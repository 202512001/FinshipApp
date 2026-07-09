// Minimal supabase client stub for local type checking and demo purposes.
export function createClient(): any {
  const noop = async () => ({ data: null, error: null });
  return {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: (_fn: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: noop,
      signInWithPassword: noop,
      signOut: noop,
      getUser: async () => ({ data: { user: null } })
    },
    from: (_table: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null })
        })
      })
    })
  };
}
