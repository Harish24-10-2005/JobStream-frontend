'use client'

import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

type AuthMethod = 'magic-link' | 'password'
type AuthMode = 'signin' | 'signup'

export function AuthForm() {
    const { signInWithPassword, signUp, signInWithEmail, resetPassword, loading, error } = useAuth()
    const [mode, setMode] = useState<AuthMode>('signin')
    const [method, setMethod] = useState<AuthMethod>('magic-link')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [authError, setAuthError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [showForgotPassword, setShowForgotPassword] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setAuthError(null)
        setMessage(null)
        setIsSubmitting(true)

        try {
            if (method === 'magic-link') {
                // Magic link — no password needed
                await signInWithEmail(email)
                setMessage(
                    mode === 'signup'
                        ? 'Check your email to confirm your account!'
                        : 'Magic link sent! Check your email to sign in.'
                )
            } else {
                // Email + Password
                if (mode === 'signup') {
                    await signUp(email, password)
                    setMessage('Check your email to confirm your account!')
                } else {
                    await signInWithPassword(email, password)
                }
            }
        } catch (err: any) {
            setAuthError(err.message || 'Authentication failed. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleForgotPassword = async () => {
        if (!email) {
            setAuthError('Please enter your email first.')
            return
        }
        setAuthError(null)
        setMessage(null)
        setIsSubmitting(true)

        try {
            await resetPassword(email)
            setMessage('Password reset link sent! Check your email.')
        } catch (err: any) {
            setAuthError(err.message || 'Failed to send reset link.')
        } finally {
            setIsSubmitting(false)
            setShowForgotPassword(false)
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

            {/* Sign In / Create Account tabs */}
            <div className="auth-tabs">
                <button
                    className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
                    onClick={() => { setMode('signin'); setAuthError(null); setMessage(null) }}
                    type="button"
                >
                    Sign In
                </button>
                <button
                    className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
                    onClick={() => { setMode('signup'); setAuthError(null); setMessage(null) }}
                    type="button"
                >
                    Create Account
                </button>
            </div>

            {/* Auth method toggle — Magic Link vs Password */}
            <div className="auth-method-toggle">
                <button
                    className={`auth-method-btn ${method === 'magic-link' ? 'active' : ''}`}
                    onClick={() => { setMethod('magic-link'); setAuthError(null); setMessage(null) }}
                    type="button"
                >
                    ✦ Magic Link
                </button>
                <button
                    className={`auth-method-btn ${method === 'password' ? 'active' : ''}`}
                    onClick={() => { setMethod('password'); setAuthError(null); setMessage(null) }}
                    type="button"
                >
                    🔑 Email & Password
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

                {/* Password field — only shown for email+password method */}
                {method === 'password' && (
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                            className="auth-input"
                            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                        />
                        {mode === 'signin' && (
                            <button
                                type="button"
                                className="forgot-password-link"
                                onClick={handleForgotPassword}
                                disabled={isSubmitting}
                            >
                                Forgot password?
                            </button>
                        )}
                    </div>
                )}

                {/* Info banner for magic link method */}
                {method === 'magic-link' && (
                    <div className="auth-info-banner">
                        <span>✉️</span>
                        <span>
                            {mode === 'signup'
                                ? "We'll send a sign-up link to your email — no password needed."
                                : "We'll send a one-time login link to your email."}
                        </span>
                    </div>
                )}

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
                    disabled={isSubmitting || !email || (method === 'password' && !password)}
                >
                    {isSubmitting
                        ? 'Processing...'
                        : method === 'magic-link'
                            ? mode === 'signup'
                                ? '✦ Send Sign-Up Link'
                                : '✦ Send Magic Link'
                            : mode === 'signup'
                                ? 'Create Account'
                                : 'Sign In'
                    }
                </button>

                <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', marginTop: 8, opacity: 0.7 }}>
                    🔒 End-to-end encrypted · SOC2 compliant
                </p>
            </form>
        </div>
    )
}
