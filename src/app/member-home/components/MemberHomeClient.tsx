'use client';
import { supabase } from "../../../lib/supabase";
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { verifyAdminPassword } from '../../../lib/services/adminAuth';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import AppLogo from '../../../components/ui/AppLogo';
import { type Member, type Alert, type CommunityRecord } from '../../../lib/mockData';
import { getCommunityRecordsByGender } from '../../../lib/services/community';
import { getApprovedProfilesByGender } from '../../../lib/services/profile';
//claude
import {
  acknowledgeAlert,
  createAlert,
  getAlertHistory,
  getAvailabilityExpiresAt,
  subscribeToNewAvailabilityAlerts,
  updateAlertStatus,
  getAcceptedMembers,
  formGroup,
  getGroupWithMembers,
  getMyActiveGroup,
  subscribeToGroupFormed,
   sendPushNotificationsToArea,
} from '../../../lib/services/alerts';
import GroupSuggestions from './GroupSuggestions';
//-------------------
import GroupPanel from './GroupPanel';
import VisitRecommendation from './VisitRecommendation';
import NotificationFeed from './NotificationFeed';
import { deleteMyAccount } from '../../../lib/services/profile';
import { requestNotificationPermission, onForegroundMessage } from '../../../lib/firebase';
import { saveFcmToken } from '../../../lib/services/profile';

const ALERT_DURATION_SECONDS = 3 * 60; // 3 minutes

function getSecondsRemaining(createdAt: string): number {
  const created = new Date(createdAt).getTime();
  const expiresAt = created + ALERT_DURATION_SECONDS * 1000;
  return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
}

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
      router.replace('/sign-up-login-screen');
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

  // Request notification permission and save FCM token
useEffect(() => {
  if (!currentMember) return;

  requestNotificationPermission().then((token) => {
    if (token) {
      saveFcmToken(currentMember.id, token).catch(() => {});
    }
  });

  onForegroundMessage((payload) => {
    playAlertSound();
    toast(`📢 ${payload.notification?.title}`, { duration: 8000 });
  });
}, [currentMember?.id]);

  const [activeTab, setActiveTab] = useState<'home' | 'group' | 'notifications'>('home');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [hasActiveAlert, setHasActiveAlert] = useState(false);
  const [groupMembers, setGroupMembers] = useState<Member[]>([]);
  const [groupFormed, setGroupFormed] = useState(false);
  const [recommendedPerson, setRecommendedPerson] = useState<CommunityRecord | null>(null);
  const [logoutModal, setLogoutModal] = useState(false);
  const [beeping, setBeeping] = useState(false);
  const beepRef = useRef<NodeJS.Timeout | null>(null);
  const [myAlert, setMyAlert] = useState<any>(null);
  const [acceptedMembers, setAcceptedMembers] = useState<any[]>([]);
  const [respondedAlerts, setRespondedAlerts] = useState<string[]>([]);
  //claude
  const [groupPopupVisible, setGroupPopupVisible] = useState(false);
const [formedGroupMembers, setFormedGroupMembers] = useState<any[]>([]);
const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
const groupSubscriptionRef = useRef<(() => void) | null>(null);
const watchingAlertIdRef = useRef<string | null>(null);

const [groupAreaId, setGroupAreaId] = useState<string | null>(null);
const [groupGender, setGroupGender] = useState<string | null>(null);
const [showAdminModal, setShowAdminModal] = useState(false);
const [showAdminPass, setShowAdminPass] = useState(false);
const [adminLoading, setAdminLoading] = useState(false);
const adminForm = useForm<{ password: string }>();
  //----

  // Separate countdown states: one for my outgoing alert, one for incoming alert
  const [myAlertCountdown, setMyAlertCountdown] = useState(0);
  const [incomingAlertCountdown, setIncomingAlertCountdown] = useState(0);
  const myCountdownRef = useRef<NodeJS.Timeout | null>(null);
  const incomingCountdownRef = useRef<NodeJS.Timeout | null>(null);

  // Derived: active incoming alert (same area + gender, not mine)
  const incomingAlert = currentMember
    ? alerts.find(
        (a) =>
          a.status === 'active' &&
          a.senderId !== currentMember.id &&
          a.gender === currentMember.gender
      )
    : undefined;

  // Derived: my own active alert
  const myActiveAlert = currentMember
    ? alerts.find(
        (a) =>
          a.status === 'active' &&
          a.senderId === currentMember.id
      )
    : undefined;


   //claude add new
      // Load existing active group on mount (within 8 hours)
useEffect(() => {
  if (!currentMember) return;

  async function loadActiveGroup() {
    try {
      const group = await getMyActiveGroup(currentMember.id);
      if (group) {
  const members = await getGroupWithMembers(group.id);
  setFormedGroupMembers(members);
  setActiveGroupId(group.id);
  setGroupFormed(true);
  setGroupAreaId(currentMember.area_id);
  setGroupGender(currentMember.gender);
}
    } catch (err) {
      console.error(err);
    }
  }
  loadActiveGroup();
}, [currentMember]);

   //--------- 



  // Load alert history on mount
  useEffect(() => {
    if (!currentMember) return;
    

    async function loadAvailabilityRequests() {
      try {
        const history = await getAlertHistory(currentMember.area_id, currentMember.gender);
        const mappedAlerts = history.map((alert) =>
          toMemberHomeAlert(alert, currentMember, sameGenderMembers)
        );
        setAlerts(mappedAlerts);

        const myActive = mappedAlerts.find(
          (a) => a.status === 'active' && a.senderId === currentMember.id
        );
        setHasActiveAlert(!!myActive);

        // Restore myAlert raw row for accepted members tracking
        if (myActive) {
          const rawRow = history.find((r: any) => r.id === myActive.id);
          if (rawRow) setMyAlert(rawRow);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadAvailabilityRequests();
  }, [currentMember, sameGenderMembers]);

  // When I'm watching an incoming alert, subscribe to group formation on it
/*useEffect(() => {
  if (groupSubscriptionRef.current) {
    groupSubscriptionRef.current();
    groupSubscriptionRef.current = null;
  }

  if (!incomingAlert) return;

  const unsub = subscribeToGroupFormed(incomingAlert.id, (groupId) => {
    handleGroupFormed(groupId);
  });
  groupSubscriptionRef.current = unsub;

  return () => {
    if (groupSubscriptionRef.current) {
      groupSubscriptionRef.current();
      groupSubscriptionRef.current = null;
    }
  };
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [incomingAlert?.id]);*/

  // Countdown for MY outgoing alert — calculated from alert's created_at
  useEffect(() => {
    if (myCountdownRef.current) clearInterval(myCountdownRef.current);

    if (!myActiveAlert) {
      setMyAlertCountdown(0);
      return;
    }

    const tick = () => {
      const remaining = getSecondsRemaining(myActiveAlert.sentAt);
      setMyAlertCountdown(remaining);
 if (remaining === 0) {
  if (myCountdownRef.current) clearInterval(myCountdownRef.current);

  if (!currentMember?.id) {
    console.error('❌ currentMember is null at timer end');
    return;
  }

  formGroup(myActiveAlert.id, currentMember.id)
    .then(async (groupId) => {
    
      if (groupId) {
        await handleGroupFormedRef.current(groupId);
      } else {
        updateAlertStatus(myActiveAlert.id, 'expired').catch(console.error);
        setAlerts((prev) =>
          prev.map((a) => (a.id === myActiveAlert.id ? { ...a, status: 'expired' } : a))
        );
        setHasActiveAlert(false);
        setMyAlert(null);
       toast('Nobody is available to go at this moment. Try again later! 🕊️', {
  duration: 5000,
});
      }
    })
    .catch((err) => {
      console.error('❌ formGroup threw an error:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
    });
}
    };
    tick();
    myCountdownRef.current = setInterval(tick, 1000);
    return () => {
      if (myCountdownRef.current) clearInterval(myCountdownRef.current);
    };
   }, [myActiveAlert?.id, myActiveAlert?.sentAt, currentMember?.id]);

  // Countdown for INCOMING alert — calculated from alert's created_at (consistent after refresh)
  useEffect(() => {
    if (incomingCountdownRef.current) clearInterval(incomingCountdownRef.current);

    if (!incomingAlert) {
      setIncomingAlertCountdown(0);
      return;
    }

    const tick = () => {
      const remaining = getSecondsRemaining(incomingAlert.sentAt);
      setIncomingAlertCountdown(remaining);
      if (remaining === 0) {
        if (incomingCountdownRef.current) clearInterval(incomingCountdownRef.current);
        // Mark as expired locally
        setAlerts((prev) =>
          prev.map((a) => (a.id === incomingAlert.id ? { ...a, status: 'expired' } : a))
        );
      }
    };
    tick();
    incomingCountdownRef.current = setInterval(tick, 1000);
    return () => {
      if (incomingCountdownRef.current) clearInterval(incomingCountdownRef.current);
    };
  }, [incomingAlert?.id, incomingAlert?.sentAt]);

  // Real-time subscription for new alerts (same area + gender)
  useEffect(() => {
    if (!currentMember) return;

    /*return subscribeToNewAvailabilityAlerts(currentMember, (newAlert) => {
      const mappedAlert = toMemberHomeAlert(newAlert, currentMember, sameGenderMembers);
      setAlerts((prev) => [mappedAlert, ...prev.filter((a) => a.id !== mappedAlert.id)]);*/

      return subscribeToNewAvailabilityAlerts(currentMember, (newAlert) => {
  const mappedAlert = toMemberHomeAlert(newAlert, currentMember, sameGenderMembers);
  setAlerts((prev) => [mappedAlert, ...prev.filter((a) => a.id !== mappedAlert.id)]);
  playAlertSound();
  setBeeping(true);
  if (beepRef.current) clearTimeout(beepRef.current);
  beepRef.current = setTimeout(() => setBeeping(false), 5000);
});

     /* if (soundEnabled) {
        setBeeping(true);
        if (beepRef.current) clearTimeout(beepRef.current);
        beepRef.current = setTimeout(() => setBeeping(false), 5000);
      }
    });*/
  }, [currentMember, sameGenderMembers, soundEnabled]);

  // Real-time subscription for alert_responses on MY alert
  useEffect(() => {
    if (!currentMember || !myAlert) return;

    const channel = supabase
      .channel(`responses-${myAlert.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alert_responses',
          filter: `alert_id=eq.${myAlert.id}`,
        },
        async () => {
          try {
            const accepted = await getAcceptedMembers(myAlert.id);
            setAcceptedMembers(accepted);
          } catch (err) {
            console.error(err);
          }
        }
      )
      .subscribe();

    // Load initial accepted members
    getAcceptedMembers(myAlert.id)
      .then(setAcceptedMembers)
      .catch(console.error);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myAlert?.id]);

  // Real-time subscription for alert status changes (e.g., expired by another client)
  useEffect(() => {
    if (!currentMember) return;

    const channel = supabase
      .channel(`alert-status-${currentMember.area_id}-${currentMember.gender}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'alerts',
        },
        (payload) => {
          const updated = payload.new as any;
          if (
            updated.area_id === currentMember.area_id &&
            updated.gender === currentMember.gender
          ) {
            setAlerts((prev) =>
              prev.map((a) => (a.id === updated.id ? { ...a, status: updated.status } : a))
            );
            if (updated.sender_id === currentMember.id && updated.status !== 'active') {
              setHasActiveAlert(false);
              setMyAlert(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentMember]);

  /* const handleGroupFormed = useCallback(async (groupId: string) => {
  try {
    const members = await getGroupWithMembers(groupId);*/

    const playAlertSound = useCallback(() => {
  if (!soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContext();

    const beep = (startTime: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, startTime);
      osc.frequency.setValueAtTime(660, startTime + 0.1);
      osc.frequency.setValueAtTime(880, startTime + 0.2);
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
      osc.start(startTime);
      osc.stop(startTime + 0.5);
    };
    for (let i = 0; i < 10; i++) {
    beep(audioCtx.currentTime + i * 0.6);
    }

  } catch {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
  }
}, [soundEnabled]);

    const handleGroupFormed = useCallback(async (groupId: string) => {
  try {
    const members = await getGroupWithMembers(groupId);
    setFormedGroupMembers(members);
    setActiveGroupId(groupId);
    setGroupFormed(true);
    setGroupPopupVisible(true);
    setHasActiveAlert(false);
    setMyAlert(null);
    // Store area + gender for suggestions
    if (currentMember) {
      setGroupAreaId(currentMember.area_id);
      setGroupGender(currentMember.gender);
    }
    setTimeout(() => {
      setGroupPopupVisible(false);
      setActiveTab('group');
    }, 3000);
  } catch (err) {
    console.error('Error loading group members:', err);
  }
}, [currentMember, setFormedGroupMembers, setActiveGroupId, setGroupFormed,
    setGroupPopupVisible, setHasActiveAlert, setMyAlert, setActiveTab]);


const handleGroupFormedRef = useRef(handleGroupFormed);
useEffect(() => {
  handleGroupFormedRef.current = handleGroupFormed;
}, [handleGroupFormed]);

  useEffect(() => {
    return () => {
      if (beepRef.current) clearTimeout(beepRef.current);
      if (myCountdownRef.current) clearInterval(myCountdownRef.current);
      if (incomingCountdownRef.current) clearInterval(incomingCountdownRef.current);
    };
  }, []);

 

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

  // Send push notifications to all members
  sendPushNotificationsToArea(
    currentMember.area_id,
    currentMember.gender,
    currentMember.id,
    currentMember.name,
    currentMember.area ?? ''
  );
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
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId ? { ...a, acceptedBy: [...a.acceptedBy, currentMember.id] } : a
      )
    );

    const alert = alerts.find((a) => a.id === alertId);
    if (!alert) return;

    const secondsLeft = getSecondsRemaining(alert.sentAt);

    if (secondsLeft <= 0) {
      toast('Timer has ended. Forming group now...');
      const groupId = await formGroup(alertId, alert.senderId);
      if (groupId) await handleGroupFormedRef.current(groupId);
      return;
    }

    toast.success('Accepted! Group will appear when the timer ends.');

    // Don't subscribe again if already watching this alert
    if (watchingAlertIdRef.current === alertId) return;
    watchingAlertIdRef.current = alertId;

    // Clear any old subscription
    if (groupSubscriptionRef.current) {
      groupSubscriptionRef.current();
      groupSubscriptionRef.current = null;
    }

    // Subscribe — keep this alive until group forms
    const unsub = subscribeToGroupFormed(alertId, async (groupId) => {
        watchingAlertIdRef.current = null;
      if (groupSubscriptionRef.current) {
        groupSubscriptionRef.current();
        groupSubscriptionRef.current = null;
      }
      await handleGroupFormedRef.current(groupId);
    });

    groupSubscriptionRef.current = unsub;
    
  } catch (err) {
    console.error('Unable to accept availability request', err);
    toast.error('Unable to accept availability request');
  }
};

  const handleIgnoreAlert = async (alertId: string) => {
    if (!currentMember) return;
    try {
      await acknowledgeAlert(alertId, currentMember.id, 'declined');
      setRespondedAlerts((prev) => [...prev, alertId]);
      toast('Availability request ignored');
    } catch (err) {
      console.error('Unable to decline availability request', { alertId, memberId: currentMember.id, error: err });
      toast.error('Unable to ignore availability request');
    }
  };

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!currentMember) return null;

  const showIncomingBanner = !!incomingAlert && incomingAlert.status === 'active' && incomingAlertCountdown > 0;

const handleAdminAccess = adminForm.handleSubmit(async (data) => {
  setAdminLoading(true);
  try {
    const isValid = await verifyAdminPassword(data.password);
    if (!isValid) {
      adminForm.setError('password', { message: 'Incorrect password. Please try again.' });
      return;
    }
    toast.success('Admin access granted');
    localStorage.setItem('cv_admin', 'true');
    setShowAdminModal(false);
    adminForm.reset();
    router.push('/admin-panel');
  } catch (err) {
    toast.error('Unable to verify password. Try again.');
  } finally {
    setAdminLoading(false);
  }
});


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
  const alreadyAdmin = localStorage.getItem('cv_admin');
  if (alreadyAdmin) {
    router.push('/admin-panel');
  } else {
    setShowAdminModal(true);
  }
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

      {/* Incoming Alert Banner — shown to receivers */}
      {showIncomingBanner && (
        <div className="alert-pulse border-b border-warning/30 px-4 py-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0 ${beeping ? 'animate-bounce' : ''}`}
            >
              <Bell size={20} className="text-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">
                {incomingAlert!.senderName} is available!
              </p>
              <p className="text-xs text-muted-foreground">
                {incomingAlert!.senderArea}
                {incomingAlert!.senderSociety ? ` · ${incomingAlert!.senderSociety}` : ''}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock size={12} className="text-warning" />
                <span className="text-xs font-bold text-warning tabular-nums">
                  {formatCountdown(incomingAlertCountdown)} remaining
                </span>
              </div>
            </div>
            {!respondedAlerts.includes(incomingAlert!.id) && (
              <div className="flex gap-1.5 flex-shrink-0">
                <button
                  onClick={() => handleAcceptAlert(incomingAlert!.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-success text-success-foreground rounded-xl text-xs font-bold hover:bg-success/90 active:scale-95 transition-all"
                >
                  <CheckCircle size={13} />
                  Accept
                </button>
                <button
                  onClick={() => handleIgnoreAlert(incomingAlert!.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-muted text-muted-foreground rounded-xl text-xs font-bold hover:bg-muted/70 transition-colors"
                >
                  <XCircle size={13} />
                  Ignore
                </button>
              </div>
            )}
            {respondedAlerts.includes(incomingAlert!.id) && (
              <div className="flex-shrink-0">
                <span className="text-xs text-success font-semibold flex items-center gap-1">
                  <CheckCircle size={13} />
                  Responded
                </span>
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
                    <p className="text-sm tabular-nums">
                      Time Left: {formatCountdown(myAlertCountdown)}
                    </p>
                    <p className="text-sm mt-1">
                      Accepted: {acceptedMembers.length}
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
                  📍 {currentMember.society}, House {currentMember.house_no}
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
                receive alerts from and connect with {currentMember.gender.toLowerCase()} members in your area.
              </p>
            </div>
          </div>
        )}

        {/* GROUP TAB */}
       {activeTab === 'group' && (
  <div className="p-4 space-y-4 fade-in">
    {groupFormed && formedGroupMembers.length > 0 ? (
      <>
        <div className="bg-card border border-success/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={18} className="text-success" />
            <h2 className="font-bold text-foreground">Your Group</h2>
            <span className="ml-auto text-xs text-muted-foreground">Active for 8 hours</span>
          </div>
          <div className="space-y-2">
            {formedGroupMembers.map((member: any) => (
              <div key={member.id} className="flex items-center gap-3 bg-secondary rounded-xl p-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {member.name?.charAt(0) ?? '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {member.name}
                    {member.id === currentMember.id && (
                      <span className="ml-2 text-xs text-primary font-normal">(You)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{member.society}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {groupAreaId && groupGender && (
          <GroupSuggestions
  areaId={groupAreaId}
  gender={groupGender}
  groupMemberId={currentMember.id}
  groupId={activeGroupId}
  currentMemberMobile={currentMember.mobile}
/>
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
              badge: showIncomingBanner,
            },
          ].map((tab) => (
            <button
              key={`bottom-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-primary' :'text-muted-foreground hover:text-foreground'
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
  onClick={async () => {
    if (confirm('This will permanently delete your account. Are you sure?')) {
      await deleteMyAccount(currentMember.id);
      router.push('/');
    }
  }}
  className="w-full py-2.5 bg-destructive/10 text-destructive rounded-xl text-sm font-semibold mt-2"
>
  Delete My Account
</button>
            <button
              onClick={() => {
  localStorage.removeItem('cv_user');
  localStorage.removeItem('cv_admin');
  setLogoutModal(false);
  router.replace('/sign-up-login-screen');
}}
              className="flex-1 py-2.5 bg-destructive text-destructive-foreground rounded-xl text-sm font-semibold hover:bg-destructive/90 active:scale-95 transition-all"
            >
              Sign Out
            </button>
            <button
              onClick={() => setLogoutModal(false)}
              className="flex-1 py-2.5 bg-muted text-foreground rounded-xl text-sm font-semibold hover:bg-muted/70 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
      {/* Group Formed Popup */}
{groupPopupVisible && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-xl border border-success/30 fade-in">
      <div className="text-center mb-4">
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
          <Users size={32} className="text-success" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Group Formed!</h2>
        <p className="text-sm text-muted-foreground mt-1">Your visit group is ready</p>
      </div>
      <div className="space-y-2 mb-4">
        {formedGroupMembers.map((member: any) => (
          <div key={member.id} className="flex items-center gap-3 bg-secondary rounded-xl p-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
              {member.name?.charAt(0) ?? '?'}
            </div>
            <p className="text-sm font-semibold text-foreground">
              {member.name}
              {member.id === currentMember.id && (
                <span className="ml-2 text-xs text-primary font-normal">(You)</span>
              )}
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs text-center text-muted-foreground">
        Switching to Group tab in 3 seconds...
      </p>
    </div>
  </div>
)}

{/* Admin Password Modal */}
<Modal
  open={showAdminModal}
  onClose={() => { setShowAdminModal(false); adminForm.reset(); }}
  title="Admin Panel Access"
>
  <form onSubmit={handleAdminAccess} className="space-y-4">
    <div>
      <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wide">
        Admin Password
      </label>
      <p className="text-xs text-muted-foreground mb-2">
        Enter the password provided by the Main Admin.
      </p>
      <div className="relative">
        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type={showAdminPass ? 'text' : 'password'}
          placeholder="Enter admin password"
          {...adminForm.register('password', { required: 'Password is required' })}
          className="w-full pl-9 pr-10 py-2.5 bg-input border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="button"
          onClick={() => setShowAdminPass(!showAdminPass)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {showAdminPass ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {adminForm.formState.errors.password && (
        <p className="mt-1 text-xs text-destructive">
          {adminForm.formState.errors.password.message}
        </p>
      )}
    </div>
    <button
      type="submit"
      disabled={adminLoading}
      className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
    >
      {adminLoading ? (
        <>
          <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          Verifying...
        </>
      ) : (
        <>
          <Shield size={16} />
          Access Admin Panel
        </>
      )}
    </button>
  </form>
</Modal>
    </div>
  );
}
