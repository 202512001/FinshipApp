import { supabase } from "../supabase";

export async function getCommunityRecords(filters?: {
  area_id?: string;
  gender?: string;
  isMain?: boolean;
}) {
  let query = supabase
    .from('community_records')
    .select(`*, areas(name)`)
    .eq('is_deleted', false)
    .order('name');

  if (!filters?.isMain) {
    if (filters?.area_id) query = query.eq('area_id', filters.area_id);
    if (filters?.gender) query = query.eq('gender', filters.gender);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function addCommunityRecord(record: any) {
  const { error } = await supabase
    .from("community_records")
    .insert(record);

  if (error) throw error;
}

export async function updateCommunityRecord(id: string, record: any) {
  const { error } = await supabase
    .from("community_records")
    .update(record)
    .eq("id", id);

  if (error) throw error;
}
export async function deleteCommunityRecord(id: string) {
  const { error } = await supabase
    .from("community_records")
    .update({
      is_deleted: true
    })
    .eq("id", id);

  if (error) throw error;
}

export async function markCommunityRecordVisited(
  id: string,
  currentCount: number
) {
  const today = new Date().toISOString().split("T")[0];

  const { error } = await supabase
    .from("community_records")
    .update({
      visit_count: currentCount + 1,
      last_visited_date: today
    })
    .eq("id", id);

  if (error) throw error;
}

export async function getCommunityRecordsByGender(gender: "Male" | "Female") {
  const { data, error } = await supabase
    .from("community_records")
    .select(`
      *,
      areas(name)
    `)
    .eq("gender", gender);

  if (error) throw error;

  return data ?? [];
}

export async function getSuggestionsForGroup(
  areaId: string,
  gender: string,
  excludeMobile?: string
) {
  let query = supabase
    .from('community_records')
    .select('id, name, mobile, society, house_no, visit_count, last_visited_date, notes, areas(name)')
    .eq('area_id', areaId)
    .eq('gender', gender)
    .eq('is_deleted', false)
    .order('last_visited_date', { ascending: true, nullsFirst: true })
    .limit(20);

  if (excludeMobile) {
    query = query.neq('mobile', excludeMobile);
  }

  const { data, error } = await query;
  if (error) throw error;

  const sorted = (data ?? []).sort((a, b) => {
    if (!a.last_visited_date && b.last_visited_date) return -1;
    if (a.last_visited_date && !b.last_visited_date) return 1;
    if (a.last_visited_date && b.last_visited_date) {
      const dateDiff = new Date(a.last_visited_date).getTime() - new Date(b.last_visited_date).getTime();
      if (dateDiff !== 0) return dateDiff;
    }
    return (a.visit_count ?? 0) - (b.visit_count ?? 0);
  });

  return sorted.slice(0, 3);
}

export async function markCommunityMemberVisited(
  recordId: string,
  visitedBy: string,
  groupId?: string | null,
  notes?: string
) {
  const now = new Date().toISOString();

  // 1. Get current visit count
  const { data: current, error: fetchError } = await supabase
    .from('community_records')
    .select('visit_count')
    .eq('id', recordId)
    .single();

  if (fetchError) throw fetchError;

  // 2. Update community_records
  const { data, error } = await supabase
    .from('community_records')
    .update({
      visit_count: (current.visit_count ?? 0) + 1,
      last_visited_date: now,
      updated_at: now,
    })
    .eq('id', recordId)
    .select()
    .single();

  if (error) throw error;

  // 3. Insert into visits table
  await supabase.from('visits').insert({
    community_record_id: recordId,
    visited_by: visitedBy,
    group_id: groupId ?? null,
    notes: notes ?? null,
    visit_date: now,
  });

  return data;
}

export async function getVisitHistory(filters?: {
  area_id?: string;
  gender?: string;
  isMain?: boolean;
}) {
  let query = supabase
    .from('visits')
    .select(`
      id,
      visit_date,
      notes,
      community_records!visits_community_record_id_fkey(
        id, name, society, house_no, gender, area_id, areas(name)
      ),
      profiles!visits_visited_by_fkey(
        id, name
      ),
      groups!visits_group_id_fkey(
        id
      )
    `)
    .order('visit_date', { ascending: false })
    .limit(50);

  const { data, error } = await query;
  if (error) throw error;

  // Filter by area and gender after fetch since it's nested
  if (!filters?.isMain && (filters?.area_id || filters?.gender)) {
    return (data ?? []).filter((v: any) => {
      const record = v.community_records;
      if (!record) return false;
      if (filters.area_id && record.area_id !== filters.area_id) return false;
      if (filters.gender && record.gender !== filters.gender) return false;
      return true;
    });
  }

  return data ?? [];
}

export async function getVisitedRecordsByGroup(groupId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('visits')
    .select('community_record_id')
    .eq('group_id', groupId);

  if (error) throw error;
  return (data ?? []).map((r: any) => r.community_record_id);
}

export function subscribeToGroupVisits(
  groupId: string,
  callback: (recordId: string) => void
) {
  const channel = supabase
    .channel(`group-visits-${groupId}-${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'visits',
      },
      (payload) => {
        const visit = payload.new as any;
        if (visit.group_id === groupId) {
          callback(visit.community_record_id);
        }
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
