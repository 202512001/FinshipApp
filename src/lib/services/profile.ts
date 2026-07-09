import { supabase } from "../supabase";


export async function registerUser(data: {
  name: string;
  mobile: string;
  gender: "Male" | "Female";
  area_id: string;
  society: string;
  house_no: string;
  pin: string;
}) {
  const { error } = await supabase
    .from("profiles")
    .insert({
      ...data,
      role: "member",
      status: "pending",
    });

  if (error) throw error;
}

export async function loginUser(mobile: string, pin: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("mobile", mobile)
    .eq("pin", pin)
    .eq("status", "approved")
    .single();

  if (error) return null;

  return data;
}
export async function getAreas() {
  const { data, error } = await supabase
    .from("areas")
    .select("*")
    .order("name");

  if (error) throw error;

  return data ?? [];
}

export async function getPendingProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      areas(name)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data ?? [];
}

export async function approveProfile(id: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ status: "approved" })
    .eq("id", id);

  if (error) throw error;
}

export async function rejectProfile(id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", id)
    .select();

  console.log("Deleted data:", data);
  console.log("Delete error:", error);

  if (error) throw error;
}

export async function getApprovedProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      areas(name)
    `)
    .eq("status", "approved")
    .order("name");

  if (error) throw error;

  return data ?? [];
}
export async function getApprovedProfilesByGender(gender: "Male" | "Female") {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("status", "approved")
    .eq("gender", gender);

  if (error) throw error;

  return data ?? [];
}