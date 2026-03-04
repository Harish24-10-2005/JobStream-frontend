'use client'

import { useAuth } from '@/hooks/useAuth'
import ProductWorkspace from '@/components/ProductWorkspace'
import { AuthForm } from '@/components/auth/AuthForm'

export default function HomePage() {
  const { session, token, loading, signOut } = useAuth()

  if (loading) {
    return (
      <main className='landing-page' style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className='spinner' style={{ width: 32, height: 32, margin: '0 auto 16px', borderWidth: 3 }} />
          <p style={{ color: 'var(--text-2)', fontWeight: 500, fontSize: 15 }}>Checking session…</p>
        </div>
      </main>
    )
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
        <button className='button primary' style={{ padding: '10px 24px', borderRadius: '999px' }}>Get Started</button>
      </header>

      <section className='hero-shell'>
        <p className='announce-banner'>✦ We have massively upgraded our agent — Advanced HITL and live apply are now available.</p>
        <h1 className='hero-title'>
          THE WAY AI
          <span>applies for jobs.</span>
        </h1>
        <p className='hero-subtitle'>
          JobStream gives you live autonomous application flows, human approvals, and production-safe controls in one
          interface.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', margin: '32px 0 16px', flexWrap: 'wrap' }}>
          {['Live Browser Agent', 'Human-in-the-Loop', 'ATS Optimization', 'AI Interview Prep'].map((feat) => (
            <span key={feat} className='chip' style={{ fontSize: '12.5px', padding: '6px 14px' }}>
              {feat}
            </span>
          ))}
        </div>

        <AuthForm />

        <p className='muted' style={{ marginTop: '24px', fontSize: '12px', opacity: 0.6 }}>
          Trusted by 1,000+ job seekers — No credit card required
        </p>
      </section>
    </main>
  )
}
