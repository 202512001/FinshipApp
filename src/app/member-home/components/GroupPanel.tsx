'use client';
import React from 'react';
import { MapPin, Users, Navigation } from 'lucide-react';
import Badge from '../../../components/ui/Badge';
import { type Member } from '../../../lib/mockData';

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
  members: Member[];
  currentMember: Member;
}

export default function GroupPanel({ members, currentMember }: Props) {
  return (
    <div className="bg-card border border-success/30 rounded-2xl overflow-hidden">
      <div className="bg-success/10 px-4 py-3 flex items-center gap-2 border-b border-success/20">
        <Users size={18} className="text-success" />
        <div>
          <p className="text-sm font-bold text-foreground">Group Formed!</p>
          <p className="text-xs text-muted-foreground">{members.length} members ready to visit</p>
        </div>
        <Badge variant="success" className="ml-auto">{members.length} Members</Badge>
      </div>
      <div className="divide-y divide-border">
        {members.map((member, idx) => {
          const dist = member.id === currentMember.id
            ? 0
            : haversineKm(currentMember.lat, currentMember.lng, member.lat, member.lng);
          return (
            <div key={`group-member-${member.id}`} className="flex items-center gap-3 px-4 py-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                member.id === currentMember.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              }`}>
                {member.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {member.name}
                  {member.id === currentMember.id && (
                    <span className="ml-1.5 text-xs text-primary font-normal">(You)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin size={11} />
                  {member.society}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                {member.id !== currentMember.id ? (
                  <p className="text-xs font-semibold text-primary tabular-nums flex items-center gap-1">
                    <Navigation size={11} />
                    {dist.toFixed(1)} km
                  </p>
                ) : (
                  <p className="text-xs text-success font-semibold">Organizer</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}