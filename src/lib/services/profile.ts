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
  // Hash PIN before storing — never store plaintext PINs
  const { data: hashResult, error: hashError } = await supabase
    .rpc('hash_pin', { plain_pin: data.pin });

  if (hashError) throw hashError;

const { data: allowed } = await supabase
  .rpc('check_registration_rate_limit', { mobile_number: data.mobile });

if (!allowed) {
  throw new Error('Too many registration attempts. Please try again later.');
}

  const { error } = await supabase
    .from("profiles")
    
    .insert({
      name: data.name,
      mobile: data.mobile,
      gender: data.gender,
      area_id: data.area_id,
      society: data.society,
      house_no: data.house_no,
      pin: hashResult, // store hash not plaintext
      role: "member",
      status: "pending",
    });

  if (error) throw error;
}

export async function loginUser(mobile: string, pin: string) {
  // Use server-side PIN verification — never compare plaintext
  const { data: userId, error } = await supabase
    .rpc('verify_pin', { mobile_number: mobile, plain_pin: pin });

  if (error || !userId) {
    // Check if user exists but is pending
    const { data: pending } = await supabase
      .from('profiles')
      .select('status')
      .eq('mobile', mobile)
      .maybeSingle();

    if (!pending) return { status: 'not_found', user: null };
    if (pending.status === 'pending') return { status: 'pending', user: null };
    if (pending.status === 'blocked') return { status: 'blocked', user: null };
    return { status: 'not_found', user: null };
  }

  // Fetch user profile without PIN field
  const { data: user } = await supabase
    .from('profiles')
    .select('id, name, mobile, gender, area_id, society, house_no, role, status, admin_type, areas(name)')
    .eq('id', userId)
    .single();

  return { status: 'approved', user };
}
export async function getAreas() {
  const { data, error } = await supabase
    .from("areas")
    .select("*")
    .order("name");

  if (error) throw error;

  return data ?? [];
}
export async function addArea(name: string) {
  const { data, error } = await supabase
    .from('areas')
    .insert({ name })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPendingProfiles(filters?: {
  area_id?: string;
  gender?: string;
  role?: 'main' | 'male' | 'female';
}) {
  let query = supabase
    .from('profiles')
    .select(`*, areas(name)`)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  // main admin sees all, gender admin sees only their gender + area
  if (filters?.role !== 'main') {
    if (filters?.area_id) query = query.eq('area_id', filters.area_id);
    if (filters?.gender) query = query.eq('gender', filters.gender);
  }

  const { data, error } = await query;
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

export async function deleteMyAccount(profileId: string) {
  // Anonymize instead of hard delete to preserve visit history integrity
  const { error } = await supabase
    .from('profiles')
    .update({
      name: 'Deleted User',
      mobile: `deleted_${profileId.slice(0, 8)}`,
      house_no: null,
      society: null,
      status: 'blocked',
      pin: 'deleted',
    })
    .eq('id', profileId);

  if (error) throw error;

  // Clear localStorage
  localStorage.removeItem('cv_user');
  localStorage.removeItem('cv_admin');
}