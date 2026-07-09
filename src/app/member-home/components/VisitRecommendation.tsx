'use client';
import React, { useState } from 'react';
import { MapPin, Star, CheckCircle, AlertTriangle, Navigation } from 'lucide-react';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import { toast } from 'sonner';
import { type CommunityRecord, type Member } from '../../../lib/mockData';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface Props {
  record: CommunityRecord;
  groupMembers: Member[];
}

export default function VisitRecommendation({ record, groupMembers }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [visited, setVisited] = useState(false);

  const groupCentLat = groupMembers.reduce((s, m) => s + m.lat, 0) / groupMembers.length;
  const groupCentLng = groupMembers.reduce((s, m) => s + m.lng, 0) / groupMembers.length;
  const dist = haversineKm(groupCentLat, groupCentLng, record.lat, record.lng);

  const handleMarkVisited = () => {
    setVisited(true);
    setShowConfirm(false);
    toast.success(`Visit to ${record.name} noted! Admin will record the official visit.`);
  };

  if (visited) {
    return (
      <div className="bg-success/10 border border-success/30 rounded-2xl p-5 text-center fade-in">
        <CheckCircle size={36} className="text-success mx-auto mb-2" />
        <p className="font-bold text-foreground">Visit Completed!</p>
        <p className="text-sm text-muted-foreground mt-1">
          Great work visiting {record.name}. The admin will record the official visit count.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card border border-accent/30 rounded-2xl overflow-hidden fade-in">
        <div className="bg-accent/10 px-4 py-3 flex items-center gap-2 border-b border-accent/20">
          <Star size={16} className="text-accent" />
          <div>
            <p className="text-sm font-bold text-foreground">Recommended Visit</p>
            <p className="text-xs text-muted-foreground">Based on proximity and visit history</p>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-foreground text-base">{record.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{record.mobile}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {record.priority === 'high' && <Badge variant="destructive">High Priority</Badge>}
              {record.priority === 'medium' && <Badge variant="warning">Medium</Badge>}
              {record.priority === 'low' && <Badge variant="muted">Low</Badge>}
              {record.visitCount === 0 && <Badge variant="accent">Never Visited</Badge>}
            </div>
          </div>

          <div className="bg-secondary rounded-xl p-3 space-y-1.5">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MapPin size={12} className="text-primary" />
              <span className="font-medium text-foreground">{record.society}</span>
            </p>
            <p className="text-xs text-muted-foreground pl-4.5">
              {record.block} · {record.building} · {record.area}
            </p>
            <p className="text-xs text-primary font-semibold flex items-center gap-1.5">
              <Navigation size={12} />
              ~{dist.toFixed(1)} km from group centre
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/50 rounded-xl p-2.5">
              <p className="text-xs text-muted-foreground">Last Visited</p>
              <p className="text-sm font-semibold text-foreground">
                {record.lastVisitedDate
                  ? new Date(record.lastVisitedDate).toLocaleDateString('en-IN')
                  : 'Never'}
              </p>
            </div>
            <div className="bg-muted/50 rounded-xl p-2.5">
              <p className="text-xs text-muted-foreground">Total Visits</p>
              <p className="text-sm font-bold text-primary tabular-nums">{record.visitCount}</p>
            </div>
          </div>

          {record.notes && (
            <div className="bg-warning/10 border border-warning/20 rounded-xl p-2.5 flex items-start gap-2">
              <AlertTriangle size={14} className="text-warning flex-shrink-0 mt-0.5" />
              <p className="text-xs text-foreground">{record.notes}</p>
            </div>
          )}

          <button
            onClick={() => setShowConfirm(true)}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle size={16} />
            We Visited This Person
          </button>
        </div>
      </div>

      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="Confirm Visit">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Confirm that your group visited <strong className="text-foreground">{record.name}</strong> at{' '}
            <strong className="text-foreground">{record.society}</strong> today?
          </p>
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
            The Admin will officially record this visit and update the visit count in the system.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleMarkVisited}
              className="flex-1 py-2.5 bg-success text-success-foreground rounded-xl text-sm font-semibold hover:bg-success/90 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle size={16} />
              Yes, We Visited
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 py-2.5 bg-muted text-foreground rounded-xl text-sm font-semibold hover:bg-muted/70 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}