'use client'

import { useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ProductWorkspace from '@/components/ProductWorkspace'
import { AuthForm } from '@/components/auth/AuthForm'

export default function HomePage() {
  const { session, token, loading, error, signInWithEmail, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [signingIn, setSigningIn] = useState(false)

  const authStatus = useMemo(() => {
    if (loading) return 'Checking session...'
    if (session) return `Signed in as ${session.user.email}`
    return 'Not authenticated'
  }, [loading, session])

  const onOtpSignIn = async () => {
    const candidate = email.trim()
    if (!candidate) return
    setSigningIn(true)
    try {
      await signInWithEmail(candidate)
    } finally {
      setSigningIn(false)
    }
  }

  if (session) {
    return <ProductWorkspace token={token} email={session.user.email || 'Unknown user'} onSignOut={signOut} />
  }

  return (
    <main className='landing-page'>
      <header className='landing-topbar'>
        <div className='landing-brand'>
          <span className='landing-brand-icon'>JS</span>
          <span>JobStream</span>
        </div>
        <nav className='landing-nav'>
          <a href='#features'>Products</a>
          <a href='#security'>Resources</a>
          <a href='#pricing'>Pricing</a>
        </nav>
        <button className='button primary'>Get Started</button>
      </header>

      <section className='hero-shell'>
        <p className='announce-banner'>We have massively upgraded our agent. Advanced HITL and live apply are now available.</p>
        <h1 className='hero-title'>
          THE WAY AI
          <span>applies for jobs.</span>
        </h1>
        <p className='hero-subtitle'>
          JobStream gives you live autonomous application flows, human approvals, and production-safe controls in one
          interface.
        </p>

        <AuthForm />
      </section>
    </main>
  )
}
