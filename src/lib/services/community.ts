import { supabase } from "../supabase";

export async function getCommunityRecords() {
  const { data, error } = await supabase
    .from("community_records")
    .select("*");

  console.log("DATA:", data);
  console.log("ERROR:", error);

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