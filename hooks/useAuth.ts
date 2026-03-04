'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const initialEventReceived = useRef(false)

  useEffect(() => {
    let active = true

    // In @supabase/supabase-js v2.39+, onAuthStateChange fires an
    // INITIAL_SESSION event synchronously when the listener is
    // registered.  We use that as the primary session source—it
    // handles localStorage recovery *and* URL-hash detection.
    // getSession() is kept only as a safety-net fallback.

    const { data: sub } = supabase.auth.onAuthStateChange((event, value) => {
      if (!active) return

      setSession(value)

      // The INITIAL_SESSION event means the SDK has finished
      // bootstrapping (localStorage + URL hash).  We can stop
      // the loading spinner.
      if (event === 'INITIAL_SESSION') {
        initialEventReceived.current = true
        setLoading(false)
      }

      // Also stop loading on explicit sign-in / sign-out if the
      // INITIAL_SESSION event never fired (older SDK).
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setLoading(false)
      }
    })

    // Fallback: if the SDK is older and never fires INITIAL_SESSION,
    // getSession() ensures we still resolve the loading state.
    async function fallback() {
      // Give onAuthStateChange ~200 ms to fire INITIAL_SESSION
      await new Promise((r) => setTimeout(r, 250))
      if (!active || initialEventReceived.current) return
      try {
        const { data } = await supabase.auth.getSession()
        if (active) {
          setSession(data.session || null)
        }
      } catch (e) {
        if (active) setError((e as Error).message)
      } finally {
        if (active) setLoading(false)
      }
    }
    fallback()

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const token = useMemo(() => session?.access_token || '', [session])

  const signInWithEmail = async (email: string) => {
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_APP_URL
      }
    })
    if (signInError) {
      setError(signInError.message)
      throw signInError
    }
  }

  const signInWithPassword = async (email: string, password: string) => {
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (signInError) {
      setError(signInError.message)
      throw signInError
    }
  }

  const signUp = async (email: string, password: string) => {
    setError(null)
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_APP_URL
      }
    })
    if (signUpError) {
      setError(signUpError.message)
      throw signUpError
    }
  }

  const signOut = async () => {
    setError(null)
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      setError(signOutError.message)
      throw signOutError
    }
  }

  return {
    session,
    token,
    loading,
    error,
    signInWithEmail,
    signInWithPassword,
    signUp,
    signOut
  }
}
