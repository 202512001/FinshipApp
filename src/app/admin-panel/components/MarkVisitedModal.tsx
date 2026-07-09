'use client';
import React from 'react';
import { CheckCircle, MapPin, Calendar } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import { type CommunityRecord } from '../../../lib/mockData';

interface Props {
  open: boolean;
  record: CommunityRecord;
  onClose: () => void;
  onConfirm: () => void;
}

export default function MarkVisitedModal({ open, record, onClose, onConfirm }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Mark as Visited">
      <div className="space-y-4">
        <div className="bg-secondary rounded-xl p-3 space-y-1">
          <p className="font-semibold text-foreground text-sm">{record.name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <MapPin size={12} />
            {record.society}, {record.block}, {record.building}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Calendar size={12} />
            Last visited: {record.lastVisitedDate
              ? new Date(record.lastVisitedDate).toLocaleDateString('en-IN')
              : 'Never'}
          </p>
          <p className="text-xs font-semibold text-primary">
            Current visit count: {record.visitCount} → After recording: {record.visitCount + 1}
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          This will record today's date as the visit date and increment the total visit count to{' '}
          <strong className="text-foreground">{record.visitCount + 1}</strong>.
        </p>

        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-success text-success-foreground rounded-xl text-sm font-semibold hover:bg-success/90 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle size={16} />
            Confirm Visit
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-muted text-foreground rounded-xl text-sm font-semibold hover:bg-muted/70 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}