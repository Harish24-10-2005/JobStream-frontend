'use client'

import { useEffect, useMemo, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function bootstrap() {
      try {
        const { data } = await supabase.auth.getSession()
        if (active) {
          setSession(data.session || null)
        }
      } catch (e) {
        if (active) {
          setError((e as Error).message)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    bootstrap()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, value) => {
      setSession(value)
    })

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
