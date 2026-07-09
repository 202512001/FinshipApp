'use client';
import React from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const trendData = [
  { month: 'Jan', visits: 4 },
  { month: 'Feb', visits: 7 },
  { month: 'Mar', visits: 5 },
  { month: 'Apr', visits: 11 },
  { month: 'May', visits: 9 },
  { month: 'Jun', visits: 6 },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg">
        <p className="text-xs font-semibold text-foreground">{label} 2026</p>
        <p className="text-sm font-bold text-primary">{payload[0].value} visits</p>
      </div>
    );
  }
  return null;
};

export default function VisitTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="visits" stroke="var(--primary)" strokeWidth={2} fill="url(#visitGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}