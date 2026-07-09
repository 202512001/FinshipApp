'use client';
import React from 'react';
import { Bell, Clock, Users } from 'lucide-react';
import Badge from '../../../components/ui/Badge';
import { type Alert, type Gender } from '../../../lib/mockData';

interface Props {
  gender: Gender;
  alerts: Alert[];
}

export default function NotificationFeed({ gender, alerts }: Props) {
  const relevantAlerts = alerts.filter((a) => a.gender === gender);

  if (relevantAlerts.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <Bell size={36} className="text-muted-foreground mx-auto mb-3 opacity-40" />
        <p className="font-semibold text-foreground">No alerts yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          When a {gender.toLowerCase()} member sends an availability alert, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Recent Alerts ({relevantAlerts.length})
      </p>
      {relevantAlerts
        .slice()
        .reverse()
        .map((alert) => {
          const isActive = alert.status === 'active';
          const isGrouped = alert.status === 'grouped';
          const isExpired = alert.status === 'expired';

          return (
            <div
              key={`notif-${alert.id}`}
              className={`bg-card border rounded-2xl p-4 fade-in ${
                isActive ? 'border-warning/40' : isGrouped ? 'border-success/30' : 'border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isActive ? 'bg-warning/20' : isGrouped ? 'bg-success/20' : 'bg-muted'
                }`}>
                  {isActive && <Bell size={18} className="text-warning" />}
                  {isGrouped && <Users size={18} className="text-success" />}
                  {isExpired && <Clock size={18} className="text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-semibold text-foreground">{alert.senderName}</p>
                    {isActive && <Badge variant="warning">Active</Badge>}
                    {isGrouped && <Badge variant="success">Group Formed</Badge>}
                    {isExpired && <Badge variant="muted">Expired</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {alert.senderSociety} · {alert.senderArea}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sent at {new Date(alert.sentAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {isGrouped && alert.acceptedBy.length > 0 && (
                    <p className="text-xs text-success font-semibold mt-1">
                      {alert.acceptedBy.length + 1} members formed a group
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}