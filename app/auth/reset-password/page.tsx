'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

/**
 * Password reset page — users land here after clicking a password-reset email link.
 * The Supabase callback route exchanges the code for a session, then redirects here.
 * At this point, the user has an active PASSWORD_RECOVERY session and can call
 * `updateUser({ password })` to set their new password.
 */
export default function ResetPasswordPage() {
    const { session, loading, updatePassword, error } = useAuth()
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [localError, setLocalError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // Auto-redirect after successful password change
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                window.location.href = '/'
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [success])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLocalError(null)

        if (newPassword.length < 6) {
            setLocalError('Password must be at least 6 characters.')
            return
        }

        if (newPassword !== confirmPassword) {
            setLocalError('Passwords do not match.')
            return
        }

        setIsSubmitting(true)
        try {
            await updatePassword(newPassword)
            setSuccess(true)
        } catch (err: any) {
            setLocalError(err.message || 'Failed to update password.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return (
            <main className='landing-page' style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className='spinner' style={{ width: 32, height: 32, margin: '0 auto 16px', borderWidth: 3 }} />
                    <p style={{ color: 'var(--text-2)', fontWeight: 500, fontSize: 15 }}>Verifying session…</p>
                </div>
            </main>
        )
    }

    if (!session) {
        return (
            <main className='landing-page' style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className='auth-form-container'>
                    <div className='auth-alert error'>
                        Your reset link has expired or is invalid. Please request a new password reset.
                    </div>
                    <a href='/' className='button primary auth-submit' style={{ textDecoration: 'none', display: 'block', textAlign: 'center', marginTop: 16 }}>
                        ← Back to Sign In
                    </a>
                </div>
            </main>
        )
    }

    if (success) {
        return (
            <main className='landing-page' style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className='auth-form-container'>
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
                            Password Updated!
                        </h2>
                        <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
                            Redirecting you to the app…
                        </p>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className='landing-page' style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
            <div className='auth-form-container' style={{ marginTop: 0, width: 'min(440px, 100%)' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 14,
                        background: 'linear-gradient(135deg, rgba(255, 138, 31, .15), rgba(255, 138, 31, .05))',
                        border: '1px solid rgba(255, 138, 31, .25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px', fontSize: 24,
                        boxShadow: '0 0 30px rgba(255, 138, 31, .08)',
                    }}>
                        🔑
                    </div>
                    <h2 style={{
                        fontSize: 22, fontWeight: 800, margin: '0 0 8px',
                        color: 'var(--text)', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                        letterSpacing: '-0.02em',
                    }}>
                        Set New Password
                    </h2>
                    <p className='muted' style={{ fontSize: 14, lineHeight: 1.55, margin: 0 }}>
                        Choose a strong password for your account.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className='auth-form'>
                    <div className='form-group'>
                        <label htmlFor='newPassword'>New Password</label>
                        <input
                            id='newPassword'
                            type='password'
                            className='auth-input'
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder='Minimum 6 characters'
                            required
                            minLength={6}
                            autoComplete='new-password'
                        />
                    </div>
                    <div className='form-group'>
                        <label htmlFor='confirmPassword'>Confirm Password</label>
                        <input
                            id='confirmPassword'
                            type='password'
                            className='auth-input'
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder='Re-enter your password'
                            required
                            minLength={6}
                            autoComplete='new-password'
                        />
                    </div>

                    {(error || localError) && (
                        <div className='auth-alert error'>
                            {localError || error}
                        </div>
                    )}

                    <button
                        type='submit'
                        className='button primary auth-submit'
                        disabled={isSubmitting || !newPassword || !confirmPassword}
                    >
                        {isSubmitting ? 'Updating…' : '→ Update Password'}
                    </button>

                    <a href='/' style={{
                        display: 'block', textAlign: 'center', marginTop: 12,
                        fontSize: 13, color: 'var(--muted)', textDecoration: 'none',
                    }}>
                        ← Back to Sign In
                    </a>
                </form>
            </div>
        </main>
    )
}
