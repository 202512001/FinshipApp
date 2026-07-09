'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { Award, AlertTriangle } from 'lucide-react';
import { type CommunityRecord, type VisitRecord, type Gender } from '../../../lib/mockData';

const VisitsBarChart = dynamic(() => import('./charts/VisitsBarChart'), { ssr: false });
const VisitTrendChart = dynamic(() => import('./charts/VisitTrendChart'), { ssr: false });

interface Props {
  communityRecords: CommunityRecord[];
  visitRecords: VisitRecord[];
  adminGender: Gender;
  adminRole: 'main' | 'male' | 'female';
}

export default function AdminReports({ communityRecords, visitRecords, adminGender, adminRole }: Props) {
  const filtered = communityRecords.filter((r) => adminRole === 'main' || r.gender === adminGender);

  const totalVisits = filtered.reduce((s, r) => s + r.visitCount, 0);
  const neverVisited = filtered.filter((r) => r.visitCount === 0);
  const leastVisited = [...filtered].sort((a, b) => a.visitCount - b.visitCount).slice(0, 3);
  const mostVisited = [...filtered].sort((a, b) => b.visitCount - a.visitCount).slice(0, 3);
  const highPriority = filtered.filter((r) => r.priority === 'high');

  const areaData = filtered.reduce<Record<string, number>>((acc, r) => {
    const key = r.area.split(' - ')[1] || r.area;
    acc[key] = (acc[key] || 0) + r.visitCount;
    return acc;
  }, {});

  const barData = Object.entries(areaData).map(([area, visits]) => ({ area, visits }));

  return (
    <div className="space-y-5 fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Total Visits</p>
          <p className="text-3xl font-bold text-primary tabular-nums">{totalVisits}</p>
          <p className="text-xs text-muted-foreground mt-1">Across {filtered.length} people</p>
        </div>
        <div className="bg-card border border-destructive/20 rounded-2xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Never Visited</p>
          <p className="text-3xl font-bold text-destructive tabular-nums">{neverVisited.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Need first visit</p>
        </div>
        <div className="bg-card border border-warning/20 rounded-2xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">High Priority</p>
          <p className="text-3xl font-bold text-warning tabular-nums">{highPriority.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Urgent attention needed</p>
        </div>
        <div className="bg-card border border-success/20 rounded-2xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Active Members</p>
          <p className="text-3xl font-bold text-success tabular-nums">7</p>
          <p className="text-xs text-muted-foreground mt-1">In the system</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Visits by Area</h3>
          <VisitsBarChart data={barData} />
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Monthly Visit Trend</h3>
          <VisitTrendChart />
        </div>
      </div>

      {/* Least + Most Visited */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-card border border-destructive/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-destructive" />
            <h3 className="text-sm font-semibold text-foreground">Least Visited — Visit Soon</h3>
          </div>
          <div className="space-y-2">
            {leastVisited.map((r) => (
              <div key={`least-${r.id}`} className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.society}</p>
                </div>
                <span className="text-sm font-bold text-destructive tabular-nums flex-shrink-0">
                  {r.visitCount} visits
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-success/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award size={16} className="text-success" />
            <h3 className="text-sm font-semibold text-foreground">Most Visited</h3>
          </div>
          <div className="space-y-2">
            {mostVisited.map((r) => (
              <div key={`most-${r.id}`} className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.society}</p>
                </div>
                <span className="text-sm font-bold text-success tabular-nums flex-shrink-0">
                  {r.visitCount} visits
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Never Visited List */}
      {neverVisited.length > 0 && (
        <div className="bg-card border border-destructive/20 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle size={15} className="text-destructive" />
            People Never Visited ({neverVisited.length})
          </h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {neverVisited.map((r) => (
              <div key={`never-${r.id}`} className="bg-destructive/5 border border-destructive/10 rounded-xl p-3">
                <p className="text-sm font-semibold text-foreground">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.society} · {r.area}</p>
                <p className="text-xs text-muted-foreground">{r.block} · {r.building}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}