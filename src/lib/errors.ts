export function getUserFriendlyError(err: any): string {
  // Never expose Supabase error details to UI
  const code = err?.code;

  if (code === '23505') return 'This mobile number is already registered.';
  if (code === '23503') return 'Invalid reference. Please try again.';
  if (code === 'PGRST116') return 'Record not found.';
  if (code === '42703') return 'Something went wrong. Please contact support.';

  // Generic fallback — never show raw error
  return 'Something went wrong. Please try again.';
}