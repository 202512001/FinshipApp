'use client';
import { supabase } from "../../../lib/supabase";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Users,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Volume2,
  VolumeX,
  LogOut,
  Shield,
  Home,
  AlertCircle,
  Navigation,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import AppLogo from '../../../components/ui/AppLogo';
import { type Member, type Alert, type CommunityRecord } from '../../../lib/mockData';
import { getCommunityRecordsByGender } from '../../../lib/services/community';
import { getApprovedProfilesByGender } from '../../../lib/services/profile';
import {
  acknowledgeAlert,
  createAlert,
  getAlertHistory,
  getAvailabilityExpiresAt,
  subscribeToNewAvailabilityAlerts,
  updateAlertStatus,
  getAcceptedMembers
} from '../../../lib/services/alerts';
import GroupPanel from './GroupPanel';
import VisitRecommendation from './VisitRecommendation';
import NotificationFeed from './NotificationFeed';
/*import { supabase } from "../../../lib/supabase";

useEffect(() => {
  supabase.auth.getSession().then(({ data, error }) => {
    console.log("SESSION:", data.session);
    console.log("SESSION ERROR:", error);
  });
}, []);*/
//import { useRouter } from "next/navigation";
//import { useEffect } from "react";

// Simulated current user — in real app loaded from localStorage/session
// BACKEND INTEGRATION POINT: Load from localStorage or session API

function toMemberHomeAlert(row: any, currentMember: any, members: any[]): Alert {
  const sender =
    row.sender_id === currentMember.id
      ? currentMember
      : members.find((member) => member.id === row.sender_id);

  return {
    id: row.id,
    senderId: row.sender_id,
    senderName: sender?.name ?? 'Member',
    senderArea: sender?.area ?? sender?.areas?.name ?? currentMember.area ?? '',
    senderSociety: sender?.society ?? '',
    gender: row.gender,
    sentAt: row.created_at,
    expiresAt: getAvailabilityExpiresAt(row.created_at),
    acceptedBy: [],
    status: row.status,
  };
}

export default function MemberHomeClient() {
  const router = useRouter();

  const [currentMember, setCurrentMember] = useState<any>(null);
  const [sameGenderMembers, setSameGenderMembers] = useState<any[]>([]);
  const [communityRecords, setCommunityRecords] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedUser = localStorage.getItem('cv_user');

    if (!storedUser) {
      router.replace('/');
      return;
    }

    setCurrentMember(JSON.parse(storedUser));
  }, [router]);

  useEffect(() => {
    if (!currentMember) return;

    async function loadMembers() {
      try {
        const members = await getApprovedProfilesByGender(currentMember.gender);

        setSameGenderMembers(members.filter((m: any) => m.id !== currentMember.id));
      } catch (err) {
        console.error(err);
      }
    }

    loadMembers();

    async function loadCommunityRecords() {
      try {
        const records = await getCommunityRecordsByGender(currentMember.gender);

        const formatted = records.map((r: any) => ({
          ...r,
          area: r.areas?.name ?? '',
          visitCount: r.visit_count,
          lastVisitedDate: r.last_visited_date,
        }));

        setCommunityRecords(formatted);
      } catch (err) {
        console.error(err);
      }
    }

    loadCommunityRecords();
  }, [currentMember]);

  /*function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}*/

  const [activeTab, setActiveTab] = useState<'home' | 'group' | 'notifications'>('home');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [hasActiveAlert, setHasActiveAlert] = useState(false);
  const [groupMembers, setGroupMembers] = useState<Member[]>([]);
  const [groupFormed, setGroupFormed] = useState(false);
  const [recommendedPerson, setRecommendedPerson] = useState<CommunityRecord | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [logoutModal, setLogoutModal] = useState(false);
  const [beeping, setBeeping] = useState(false);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const beepRef = useRef<NodeJS.Timeout | null>(null);
  const [myAlert, setMyAlert] = useState<any>(null);
  const [acceptedMembers, setAcceptedMembers] = useState<any[]>([]);
  const [myCountdown, setMyCountdown] = useState(0);
  const [respondedAlerts, setRespondedAlerts] = useState<string[]>([]);

  useEffect(() => {
    if (!currentMember) return;

    async function loadAvailabilityRequests() {
      try {
        const history = await getAlertHistory(currentMember.area_id, currentMember.gender);
        const mappedAlerts = history.map((alert) =>
          toMemberHomeAlert(alert, currentMember, sameGenderMembers)
        );

        setAlerts(mappedAlerts);
        setHasActiveAlert(
          mappedAlerts.some(
            (alert) => alert.status === 'active' && alert.senderId === currentMember.id
          )
        );
      } catch (err) {
        console.error(err);
      }
    }

    loadAvailabilityRequests();
  }, [currentMember, sameGenderMembers]);

  useEffect(() => {
    if (!currentMember) return;

    return subscribeToNewAvailabilityAlerts(currentMember, (newAlert) => {
      const mappedAlert = toMemberHomeAlert(newAlert, currentMember, sameGenderMembers);

      setAlerts((prev) => [mappedAlert, ...prev.filter((alert) => alert.id !== mappedAlert.id)]);

      if (soundEnabled) {
        setBeeping(true);
        beepRef.current = setTimeout(() => setBeeping(false), 5000);
      }
    });
  }, [currentMember, sameGenderMembers, soundEnabled]);

  // Active alert for this gender
  const myActiveAlert = currentMember
  ? alerts.find(
      (a) =>
        a.status === "active" &&
        a.senderId === currentMember.id
    )
  : undefined;

const incomingAlert = currentMember
  ? alerts.find(
      (a) =>
        a.status === "active" &&
        a.senderId !== currentMember.id &&
        a.gender === currentMember.gender
    )
  : undefined;

  // Countdown timer for active alert
  useEffect(() => {
   if (!myActiveAlert) return;
    const expiry = new Date(myActiveAlert.expiresAt).getTime();
    const tick = () => {
      const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining === 0) {
        updateAlertStatus(myActiveAlert.id, 'expired').catch(console.error);
        setAlerts((prev) =>
          prev.map((a) => (a.id === myActiveAlert.id ? { ...a, status: 'expired' } : a))
        );
        setHasActiveAlert(false);
      }
    };
    tick();
    countdownRef.current = setInterval(tick, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [myActiveAlert?.id]);

  useEffect(() => {
  if (!myAlert) return;

  const expiry = new Date(
    getAvailabilityExpiresAt(myAlert.created_at)
  ).getTime();

  const interval = setInterval(() => {
    const remaining = Math.max(
      0,
      Math.floor((expiry - Date.now()) / 1000)
    );

    setMyCountdown(remaining);

    if (remaining === 0) {
      clearInterval(interval);
    }
  }, 1000);

  return () => clearInterval(interval);

}, [myAlert]);

  useEffect(() => {
    return () => {
      if (beepRef.current) clearTimeout(beepRef.current);
    };
  }, []);

useEffect(() => {
  if (!currentMember) return;

  const channel = supabase
    .channel("member-alerts")

    // New alert created
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "alerts",
      },
      (payload) => {
        console.log("NEW ALERT", payload);

        // We'll improve this later.
      }
    )

    // Someone accepted / declined
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "alert_responses",
      },
      async (payload) => {
  if (!myAlert) return;

  const response = payload.new as any;

  if (response.alert_id !== myAlert.id) return;

  const accepted = await getAcceptedMembers(myAlert.id);

  console.log("Accepted Members:", accepted);

  setAcceptedMembers(accepted);
}
    )

    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [currentMember]);

  const handleSendAlert = async () => {
    if (!currentMember) return;

    setIsSendingAlert(true);

    try {
      const result = await createAlert(currentMember);
      const alert = toMemberHomeAlert(result.alert, currentMember, sameGenderMembers);
        setMyAlert(result.alert);
      setAlerts((prev) => [alert, ...prev.filter((item) => item.id !== alert.id)]);

      if (result.created) {
        setHasActiveAlert(true);
        toast.success('Availability alert sent! Waiting for members to accept (4 minutes)...');
      } else {
        toast(result.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Unable to send availability request');
    } finally {
      setIsSendingAlert(false);
    }
  };

  const handleAcceptAlert = async (alertId: string) => {
    if (!currentMember) return;

    try {
      await acknowledgeAlert(alertId, currentMember.id, 'accepted');
      setRespondedAlerts((prev) => [...prev, alertId]);
    } catch (err) {
      console.error('Unable to accept availability request', {
        alertId,
        memberId: currentMember.id,
        error: err,
      });
      toast.error('Unable to accept availability request');
      return;
    }

    setAlerts((prev) =>
    prev.map((a) =>
    a.id === alertId
      ? {
          ...a,
          acceptedBy: [...a.acceptedBy, currentMember.id],
        }
      : a
  )
);

toast.success("Accepted! Waiting for other members...");

   
    toast.success('Group formed! Visit recommendation ready.');
  };

  const handleIgnoreAlert = async (alertId: string) => {
    if (!currentMember) return;

    try {
      await acknowledgeAlert(alertId, currentMember.id, 'declined');
      setRespondedAlerts((prev) => [...prev, alertId]);
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a } : a)));
      toast("Availability request ignored");
      } catch (err) {
      console.error('Unable to decline availability request', {
        alertId,
        memberId: currentMember.id,
        error: err,
      });
      toast.error('Unable to ignore availability request');
    }
  };

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!currentMember) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      {/* Top Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <AppLogo size={32} />
          <div>
            <p className="text-sm font-bold text-foreground leading-tight">
              {currentMember.name.split(' ')[0]}
            </p>
            <div className="flex items-center gap-1">
              <Badge
                variant={currentMember.gender === 'Male' ? 'primary' : 'accent'}
                className="text-xs"
              >
                {currentMember.gender}
              </Badge>
              <span className="text-xs text-muted-foreground">{currentMember.society}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
            aria-label={soundEnabled ? 'Mute alerts' : 'Unmute alerts'}
          >
            {soundEnabled ? (
              <Volume2
                size={18}
                className={beeping ? 'text-accent animate-pulse' : 'text-muted-foreground'}
              />
            ) : (
              <VolumeX size={18} className="text-muted-foreground" />
            )}
          </button>
          <button
            onClick={() => {
              localStorage.setItem('cv_admin', 'true');
              router.push('/admin-panel');
            }}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
            aria-label="Admin panel"
            title="Admin Panel Access"
          >
            <Shield size={18} className="text-muted-foreground" />
          </button>
          <button
            onClick={() => setLogoutModal(true)}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
            aria-label="Sign out"
          >
            <LogOut size={18} className="text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Active Alert Banner */}
      {incomingAlert && incomingAlert.status === "active" && countdown > 0 && (
        <div className="alert-pulse border-b border-warning/30 px-4 py-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0 ${beeping ? 'animate-bounce' : ''}`}
            >
              <Bell size={20} className="text-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">
                {incomingAlert.senderName} is available!
              </p>
              <p className="text-xs text-muted-foreground">
                {incomingAlert.senderArea} · {incomingAlert.senderSociety}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock size={12} className="text-warning" />
                <span className="text-xs font-bold text-warning tabular-nums">
                  {formatCountdown(countdown)} remaining
                </span>
              </div>
            </div>
           {incomingAlert && !respondedAlerts.includes(incomingAlert.id) && (
  <div className="flex gap-1.5 flex-shrink-0">
    <button
      onClick={() => handleAcceptAlert(incomingAlert.id)}
      className="flex items-center gap-1 px-2.5 py-1.5 bg-success text-success-foreground rounded-xl text-xs font-bold hover:bg-success/90 active:scale-95 transition-all"
    >
      <CheckCircle size={13} />
      Accept
    </button>

    <button
      onClick={() => handleIgnoreAlert(incomingAlert.id)}
      className="flex items-center gap-1 px-2.5 py-1.5 bg-muted text-muted-foreground rounded-xl text-xs font-bold hover:bg-muted/70 transition-colors"
    >
      <XCircle size={13} />
      Ignore
    </button>
  </div>
)}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div className="p-4 space-y-5 fade-in">
            {/* Availability Button */}
            <div className="bg-card border border-border rounded-2xl p-5 text-center">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Ready to visit someone today?
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Press the button to alert all {currentMember.gender.toLowerCase()} members in your
                area.
              </p>
              <button
                onClick={handleSendAlert}
                disabled={isSendingAlert || hasActiveAlert}
                className="w-full max-w-xs mx-auto flex flex-col items-center justify-center gap-2 py-5 px-6 bg-primary text-primary-foreground rounded-2xl font-bold text-base hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-60 pulse-ring"
              >
                {isSendingAlert ? (
                  <>
                    <span className="h-6 w-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Sending Alert...
                  </>
                ) : hasActiveAlert ? (
                  <>
                    <Clock size={24} />
                    Alert Sent — Waiting...
                    <p className="text-sm">
Time Left : {formatCountdown(myCountdown)}
</p>

<p className="text-sm mt-2">
Accepted : {acceptedMembers.length}
</p>
                  </>
                ) : (
                  <>
                    <Bell size={28} />
                    I'm Available!
                    <span className="text-xs font-normal opacity-80">
                      Let's visit someone today
                    </span>
                  </>
                )}
              </button>
              {hasActiveAlert && (
                <p className="text-xs text-muted-foreground mt-3">
                  Alert active for 4 minutes. Members can accept until the timer ends.
                </p>
              )}
            </div>

            {/* My Location Card */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Navigation size={16} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">My Location</h3>
              </div>
              <div className="bg-secondary rounded-xl p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{currentMember.society}</p>
                    <p className="text-xs text-muted-foreground">{currentMember.area}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pl-5 tabular-nums">
                  📍 📍 {currentMember.society}, House {currentMember.house_no}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This location is used to find nearby members and suggest who to visit.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card border border-border rounded-2xl p-3 text-center">
                <p className="text-2xl font-bold text-primary tabular-nums">
                  {communityRecords.length}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">In Visit List</p>
              </div>
              <div className="bg-card border border-destructive/20 rounded-2xl p-3 text-center">
                <p className="text-2xl font-bold text-destructive tabular-nums">
                  {communityRecords.filter((r) => r.visitCount === 0).length}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Never Visited</p>
              </div>
              <div className="bg-card border border-success/20 rounded-2xl p-3 text-center">
                <p className="text-2xl font-bold text-success tabular-nums">
                  {sameGenderMembers.length + 1}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Members</p>
              </div>
            </div>

            {/* Gender Separation Notice */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3 flex items-start gap-2">
              <AlertCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-primary/80">
                You are in the <strong>{currentMember.gender}</strong> section. You will only
                receive alerts from and connect with {currentMember.gender.toLowerCase()} members.
              </p>
            </div>
          </div>
        )}

        {/* GROUP TAB */}
        {activeTab === 'group' && (
          <div className="p-4 space-y-4 fade-in">
            {groupFormed ? (
              <>
                <GroupPanel members={groupMembers} currentMember={currentMember} />
                {recommendedPerson && (
                  <VisitRecommendation record={recommendedPerson} groupMembers={groupMembers} />
                )}
              </>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <Users size={40} className="text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="font-semibold text-foreground">No active group yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Send an availability alert or accept someone else's alert to form a group.
                </p>
                <button
                  onClick={() => setActiveTab('home')}
                  className="mt-3 text-sm text-primary font-semibold hover:underline flex items-center gap-1 mx-auto"
                >
                  Go to Home <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="p-4 fade-in">
            <NotificationFeed gender={currentMember.gender} alerts={alerts} />
          </div>
        )}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-card border-t border-border z-20">
        <div className="flex">
          {[
            { id: 'home', label: 'Home', icon: <Home size={20} /> },
            { id: 'group', label: 'My Group', icon: <Users size={20} />, badge: groupFormed },
            {
              id: 'notifications',
              label: 'Alerts',
              icon: <Bell size={20} />,
              badge: incomingAlert && countdown > 0,
            },
          ].map((tab) => (
            <button
              key={`bottom-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="relative">
                {tab.icon}
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-warning rounded-full" />
                )}
              </span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Logout Modal */}
      <Modal open={logoutModal} onClose={() => setLogoutModal(false)} title="Sign Out">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to sign out? You will need to sign in again to receive alerts.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setLogoutModal(false);
                router.push('/');
              }}
              className="flex-1 py-2.5 bg-destructive text-destructive-foreground rounded-xl text-sm font-semibold hover:bg-destructive/90 active:scale-95 transition-all"
            >
              Sign Out
            </button>
            <button
              onClick={() => setLogoutModal(false)}
              className="flex-1 py-2.5bg-muted text-foreground rounded-xl text-sm font-semibold hover:bg-muted/70 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
