'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, CheckCircle, Clock, Phone } from 'lucide-react';
import { toast } from 'sonner';
import {
  getSuggestionsForGroup,
  markCommunityMemberVisited,
  getVisitedRecordsByGroup,
  subscribeToGroupVisits,
} from '../../../lib/services/community';

interface Props {
  areaId: string;
  gender: string;
  groupMemberId: string;
  groupId: string | null;
  currentMemberMobile?: string;
}

export default function GroupSuggestions({ areaId, gender, groupMemberId, groupId, currentMemberMobile }: Props) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [visitedIds, setVisitedIds] = useState<string[]>([]);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef<(() => void) | null>(null);

  const loadSuggestions = useCallback(async () => {
  try {
    const data = await getSuggestionsForGroup(areaId, gender, currentMemberMobile);
    setSuggestions(data);
  } catch (err) {
    console.error('Failed to load suggestions:', err);
  } finally {
    setLoading(false);
  }
}, [areaId, gender, currentMemberMobile]);

  // Load already-visited records for this group session
  const loadVisitedByGroup = useCallback(async () => {
    if (!groupId) return;
    try {
      const ids = await getVisitedRecordsByGroup(groupId);
      setVisitedIds(ids);
    } catch (err) {
      console.error('Failed to load visited records:', err);
    }
  }, [groupId]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  useEffect(() => {
    if (!groupId) return;
    loadVisitedByGroup();

    // Subscribe to real-time visits for this group
    if (unsubRef.current) unsubRef.current();
    const unsub = subscribeToGroupVisits(groupId, (recordId) => {
     
      setVisitedIds((prev) =>
        prev.includes(recordId) ? prev : [...prev, recordId]
      );
    });
    unsubRef.current = unsub;

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [groupId, loadVisitedByGroup]);

  const handleMarkVisited = async (recordId: string, name: string) => {
    if (!groupMemberId) return;

    // Prevent double marking
    if (visitedIds.includes(recordId)) {
      toast('Already visited by your group');
      return;
    }

    setMarkingId(recordId);
    try {
      const updated = await markCommunityMemberVisited(recordId, groupMemberId, groupId);
      // Update local state immediately for the person who clicked
      setVisitedIds((prev) => [...prev, recordId]);
      // Update visit count in suggestions list
      setSuggestions((prev) =>
        prev.map((s) =>
          s.id === recordId
            ? {
                ...s,
                visit_count: updated.visit_count,
                last_visited_date: updated.last_visited_date,
              }
            : s
        )
      );
      toast.success(`${name} marked as visited!`);
    } catch (err) {
      console.error('Failed to mark visited:', err);
      toast.error('Failed to mark as visited');
    } finally {
      setMarkingId(null);
    }
  };

  const formatLastVisited = (date: string | null) => {
    if (!date) return 'Never visited';
    const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    if (days === 0) return 'Visited today';
    if (days === 1) return 'Visited yesterday';
    return `Last visited ${days} days ago`;
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-16 bg-muted rounded-xl" />
          <div className="h-16 bg-muted rounded-xl" />
          <div className="h-16 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 text-center">
        <MapPin size={32} className="text-muted-foreground mx-auto mb-2 opacity-40" />
        <p className="text-sm font-semibold text-foreground">No suggestions available</p>
        <p className="text-xs text-muted-foreground mt-1">No community records found for your area.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <MapPin size={16} className="text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Suggested Visits</h3>
        <span className="ml-auto text-xs text-muted-foreground">Top 3 priority</span>
      </div>

      <div className="space-y-3">
        {suggestions.map((person, index) => {
          const isVisited = visitedIds.includes(person.id);
          const isMarking = markingId === person.id;

          return (
            <div
              key={person.id}
              className={`rounded-xl p-3 border transition-all ${
                isVisited
                  ? 'bg-success/5 border-success/30'
                  : 'bg-secondary border-transparent'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Priority badge */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  index === 0 ? 'bg-destructive/20 text-destructive' :
                  index === 1 ? 'bg-warning/20 text-warning' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {isVisited ? <CheckCircle size={14} /> : index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">{person.name}</p>
                    {isVisited && (
                      <span className="flex items-center gap-1 text-xs text-success font-semibold">
                        <CheckCircle size={12} />
                        Visited by group
                      </span>
                    )}
                  </div>

                 

                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock size={11} />
                      {formatLastVisited(person.last_visited_date)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {person.visit_count ?? 0} visits
                    </span>
                  </div>
{person.mobile && (
  <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
    <Phone size={11} />
    {person.mobile}
  </p>
)}
{person.society && (
  <p className="text-xs text-muted-foreground mt-0.5">
    🏠 {person.society}{person.house_no ? `, House ${person.house_no}` : ''}
  </p>
)}
                </div>

                {/* Only show button if not yet visited by this group */}
                {!isVisited && (
                  <button
                    onClick={() => handleMarkVisited(person.id, person.name)}
                    disabled={isMarking}
                    className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 active:scale-95 transition-all"
                  >
                    {isMarking ? (
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 border border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        ...
                      </span>
                    ) : (
                      'Mark Visited'
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-3">
        Once any group member marks visited, it locks for everyone in the group
      </p>
    </div>
  );
}