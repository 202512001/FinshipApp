import { supabase } from '../supabase';

export async function verifyAdminPassword(enteredPassword: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('verify_admin_password', { entered_password: enteredPassword });

  if (error) {
    console.error('Password verify error:', error);
    return false;
  }

  return data === true;
}