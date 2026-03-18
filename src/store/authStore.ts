import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/database.types'

interface AuthState {
  user: Profile | null
  loading: boolean
  initialized: boolean
  setUser: (user: Profile | null) => void
  setLoading: (loading: boolean) => void
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string, role: 'startup' | 'investor') => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    await get().refreshUser()
    return { error: null }
  },

  signUp: async (email, password, fullName, role) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })
    if (error) return { error: error.message }
    if (!data.user) return { error: 'Failed to create user' }

    // Update role in profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role, full_name: fullName })
      .eq('id', data.user.id)

    if (profileError) {
      // Try insert if update fails (profile might not exist yet)
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        role,
      })
    }

    await get().refreshUser()
    return { error: null }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },

  refreshUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      set({ user: null, loading: false, initialized: true })
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    set({ user: profile, loading: false, initialized: true })
  },
}))

// Initialize auth listener
supabase.auth.onAuthStateChange(async (event, session) => {
  const store = useAuthStore.getState()
  if (event === 'SIGNED_OUT') {
    store.setUser(null)
    store.setLoading(false)
    useAuthStore.setState({ initialized: true })
  } else if (session?.user) {
    await store.refreshUser()
  } else {
    store.setLoading(false)
    useAuthStore.setState({ initialized: true })
  }
})
