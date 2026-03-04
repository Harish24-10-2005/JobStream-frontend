'use client'

import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export function AuthForm() {
    const { signInWithPassword, signUp, signInWithEmail, loading, error } = useAuth()
    const [mode, setMode] = useState<'signin' | 'signup'>('signin')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [authError, setAuthError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setAuthError(null)
        setMessage(null)
        setIsSubmitting(true)

        try {
            if (mode === 'signup') {
                await signUp(email, password)
                setMessage('Check your email to confirm your account!')
            } else {
                await signInWithPassword(email, password)
            }
        } catch (err: any) {
            setAuthError(err.message || 'Authentication failed. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleMagicLink = async () => {
        if (!email) {
            setAuthError('Please enter your email for a magic link.')
            return
        }
        setAuthError(null)
        setMessage(null)
        setIsSubmitting(true)
        try {
            await signInWithEmail(email)
            setMessage('Magic link sent to your email!')
        } catch (err: any) {
            setAuthError(err.message || 'Failed to send magic link.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return <div className="auth-form-container loading">Connecting to secure server...</div>
    }

    return (
        <div className="auth-form-container">
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500, margin: 0 }}>Welcome back</p>
                <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>
                    Sign in to your workspace
                </p>
            </div>

            <div className="auth-tabs">
                <button
                    className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
                    onClick={() => setMode('signin')}
                    type="button"
                >
                    Sign In
                </button>
                <button
                    className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
                    onClick={() => setMode('signup')}
                    type="button"
                >
                    Create Account
                </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="auth-input"
                        autoComplete="email"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="auth-input"
                        autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    />
                </div>

                {(error || authError) && (
                    <div className="auth-alert error">
                        {authError || error}
                    </div>
                )}

                {message && (
                    <div className="auth-alert success">
                        {message}
                    </div>
                )}

                <button
                    type="submit"
                    className="button primary auth-submit"
                    disabled={isSubmitting || !email || !password}
                >
                    {isSubmitting ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>

                <div className="auth-divider">
                    <span>or continue with</span>
                </div>

                <button
                    type="button"
                    className="button secondary auth-magic-link"
                    onClick={handleMagicLink}
                    disabled={isSubmitting || !email}
                >
                    ✦ Send Magic Link
                </button>

                <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', marginTop: 8, opacity: 0.7 }}>
                    🔒 End-to-end encrypted · SOC2 compliant
                </p>
            </form>
        </div>
    )
}
