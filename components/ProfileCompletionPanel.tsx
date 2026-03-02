import React from 'react'

type ProfileCompletionPanelProps = {
    onboardingName: string
    setOnboardingName: (val: string) => void
    onboardingLocation: string
    setOnboardingLocation: (val: string) => void
    onboardingSummary: string
    setOnboardingSummary: (val: string) => void
    onboardingSaving: boolean
    onboardingError: string | null
    handleCreateProfile: () => void
    onSignOut: () => void
}

export function ProfileCompletionPanel({
    onboardingName,
    setOnboardingName,
    onboardingLocation,
    setOnboardingLocation,
    onboardingSummary,
    setOnboardingSummary,
    onboardingSaving,
    onboardingError,
    handleCreateProfile,
    onSignOut
}: ProfileCompletionPanelProps) {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
            <div className='auth-form-container' style={{ marginTop: 0, width: 'min(500px, 100%)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text)' }}>
                            Complete your profile
                        </h2>
                        <p className='muted' style={{ fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
                            Your account is authenticated. A profile is required to use the resume, cover letter, and networking features.
                        </p>
                    </div>

                    <div className='auth-form'>
                        <div className='form-group'>
                            <label htmlFor='fullName'>Full Name</label>
                            <input
                                id='fullName'
                                className='auth-input'
                                value={onboardingName}
                                onChange={(e) => setOnboardingName(e.target.value)}
                                placeholder='Jane Doe'
                            />
                        </div>
                        <div className='form-group'>
                            <label htmlFor='location'>Location</label>
                            <input
                                id='location'
                                className='auth-input'
                                value={onboardingLocation}
                                onChange={(e) => setOnboardingLocation(e.target.value)}
                                placeholder='City, Country'
                            />
                        </div>
                        <div className='form-group'>
                            <label htmlFor='summary'>Professional Summary</label>
                            <textarea
                                id='summary'
                                className='textarea'
                                style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'var(--border)' }}
                                value={onboardingSummary}
                                onChange={(e) => setOnboardingSummary(e.target.value)}
                                placeholder='A brief overview of your professional background...'
                                rows={3}
                            />
                        </div>

                        {onboardingError && <div className='auth-alert error'>{onboardingError}</div>}

                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                            <button
                                className='button primary auth-submit'
                                style={{ flex: 1, marginTop: 0 }}
                                disabled={onboardingSaving || !onboardingName.trim()}
                                onClick={handleCreateProfile}
                            >
                                {onboardingSaving ? 'Saving...' : 'Create Profile'}
                            </button>
                            <button
                                className='button'
                                style={{ flex: 1, marginTop: 0 }}
                                onClick={onSignOut}
                                disabled={onboardingSaving}
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
            </div>
        </div>
    )
}
