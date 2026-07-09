/*import { supabase } from "./supabase";

export async function getCommunityRecords() {
  const { data, error } = await supabase
    .from("community_records")
    .select("*, areas(name)")
    .eq("is_deleted", false)
    .order("visit_count", { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

export async function addCommunityRecord(record: any) {
  return await supabase
    .from("community_records")
    .insert(record);
}

export async function updateCommunityRecord(id: string, updates: any) {
  return await supabase
    .from("community_records")
    .update(updates)
    .eq("id", id);
}

export async function deleteCommunityRecord(id: string) {
  return await supabase
    .from("community_records")
    .update({
      is_deleted: true,
    })
    .eq("id", id);
}*/

import { supabase } from "./supabase";

export async function getCommunityRecords() {
  const { data, error } = await supabase
    .from("community_records")
    .select("*");

  console.log("DATA =", data);
  console.log("ERROR =", error);

  if (error) {
    alert(error.message);
  }

  return data ?? [];
}