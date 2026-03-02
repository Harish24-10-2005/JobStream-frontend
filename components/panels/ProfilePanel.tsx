'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api-client'

type ProfilePanelProps = {
  token: string
}

type PersonalInfo = {
  first_name?: string
  last_name?: string
  full_name?: string
  email?: string
  phone?: string
  location?: { city?: string; country?: string; address?: string }
  urls?: { linkedin?: string | null; github?: string | null; portfolio?: string | null }
}

type EducationEntry = {
  id?: string
  degree: string
  major: string
  university: string
  start_date?: string
  end_date?: string
  cgpa?: string | null
  is_current?: boolean
}

type ExperienceEntry = {
  id?: string
  title: string
  company: string
  start_date?: string
  end_date?: string
  is_current?: boolean
  description?: string
}

type ProjectEntry = {
  id?: string
  name: string
  tech_stack?: string[]
  description?: string
  project_url?: string
}

type UserProfile = {
  id?: string
  user_id?: string
  personal_information?: PersonalInfo
  education?: any[]
  experience?: any[]
  projects?: any[]
  skills?: Record<string, string[]> | null
  files?: unknown
  application_preferences?: unknown
}

import { EducationList } from '../profile/EducationList'
import { ExperienceList } from '../profile/ExperienceList'
import { ProjectList } from '../profile/ProjectList'
import { SkillList } from '../profile/SkillList'


type ProfileApiResponse = {
  profile: UserProfile | null
  message?: string
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export function ProfilePanel({ token }: ProfilePanelProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /* ---------- editable fields ---------- */
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [summary, setSummary] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  /* ---------- fetch profile ---------- */
  const fetchProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiRequest<ProfileApiResponse>('/api/v1/user/profile', { token })
      const p = res.data?.profile ?? null
      setProfile(p)
      if (p) {
        const pi = p.personal_information
        setFullName(pi?.full_name || `${pi?.first_name || ''} ${pi?.last_name || ''}`.trim())
        setPhone(pi?.phone || '')
        setLocation(pi?.location?.city || '')
        setSummary((p as unknown as Record<string, unknown>)?.summary as string || (p.personal_information as unknown as Record<string, unknown>)?.summary as string || '')
        setLinkedinUrl(pi?.urls?.linkedin || '')
        setGithubUrl(pi?.urls?.github || '')
        setPortfolioUrl(pi?.urls?.portfolio || '')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  /* ---------- save profile ---------- */
  const handleSave = async () => {
    setSaving(true)
    setSaveMsg(null)
    try {
      await apiRequest('/api/v1/user/profile', {
        method: 'PUT',
        token,
        body: {
          full_name: fullName.trim() || undefined,
          phone: phone.trim() || undefined,
          location: location.trim() || undefined,
          summary: summary.trim() || undefined,
          linkedin_url: linkedinUrl.trim() || undefined,
          github_url: githubUrl.trim() || undefined,
          portfolio_url: portfolioUrl.trim() || undefined,
        },
      })
      setSaveMsg('Profile updated!')
      setEditing(false)
      await fetchProfile()
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  /* ---------- render helpers ---------- */
  const pi = profile?.personal_information

  if (loading) {
    return (
      <div className='action-grid'>
        <div className='loading-row'>
          <div className='spinner' />
          <span className='muted'>Loading profile…</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='action-grid'>
        <div className='result-card' style={{ borderColor: 'var(--danger)' }}>
          <p style={{ color: 'var(--danger)' }}>{error}</p>
          <button className='button primary' style={{ marginTop: 8 }} onClick={fetchProfile}>Retry</button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className='action-grid'>
        <div className='empty-state'>
          <div className='empty-icon'>👤</div>
          <p>No profile found. Complete onboarding first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className='action-grid'>
      {/* ===== Personal Info ===== */}
      <div className="profile-card">
        <div className='section-header' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 className="premium-section-title" style={{ margin: 0 }}><span className="emoji">👤</span> Personal Information</h3>
          {!editing ? (
            <button className='button small primary' onClick={() => setEditing(true)}>Edit Profile</button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className='button small success' disabled={saving} onClick={handleSave}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button className='button small' onClick={() => { setEditing(false); fetchProfile() }}>Cancel</button>
            </div>
          )}
        </div>

        {saveMsg && (
          <p style={{ fontSize: 13, color: saveMsg.includes('updated') ? 'var(--green)' : 'var(--red)', marginBottom: 16 }}>
            {saveMsg}
          </p>
        )}

        {editing ? (
          /* ---- Edit Mode ---- */
          <div className='result-card popup-edit-form' style={{ marginBottom: 20, border: '1px solid var(--accent-border)', background: 'rgba(255, 138, 31, 0.03)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <label>
                <span className='muted' style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>Full Name</span>
                <input className='input' value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder='Full Name' />
              </label>
              <label>
                <span className='muted' style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>Phone</span>
                <input className='input' value={phone} onChange={(e) => setPhone(e.target.value)} placeholder='Phone' />
              </label>
              <label>
                <span className='muted' style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>Location</span>
                <input className='input' value={location} onChange={(e) => setLocation(e.target.value)} placeholder='City / Region' />
              </label>
              <label>
                <span className='muted' style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>LinkedIn</span>
                <input className='input' value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder='https://linkedin.com/in/...' />
              </label>
              <label>
                <span className='muted' style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>GitHub</span>
                <input className='input' value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder='https://github.com/...' />
              </label>
              <label>
                <span className='muted' style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>Portfolio</span>
                <input className='input' value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder='https://...' />
              </label>
            </div>
            <label style={{ display: 'block', marginTop: 16 }}>
              <span className='muted' style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>Summary</span>
              <textarea className='textarea' rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder='Professional summary…' />
            </label>
          </div>
        ) : (
          /* ---- View Mode ---- */
          <div style={{ padding: '4px 0' }}>
            <div className='result-metrics' style={{ marginBottom: 16 }}>
              <div className='metric'>
                <span>Name</span>
                <p>{pi?.full_name || `${pi?.first_name || ''} ${pi?.last_name || ''}`.trim() || '—'}</p>
              </div>
              <div className='metric'>
                <span>Email</span>
                <p>{pi?.email || '—'}</p>
              </div>
              <div className='metric'>
                <span>Phone</span>
                <p>{pi?.phone || '—'}</p>
              </div>
              <div className='metric'>
                <span>Location</span>
                <p>{pi?.location?.city || '—'}</p>
              </div>
            </div>

            {(pi?.urls?.linkedin || pi?.urls?.github || pi?.urls?.portfolio) && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
                {pi?.urls?.linkedin && <a href={pi.urls.linkedin} target='_blank' rel='noreferrer' className='premium-tag blue' style={{ textDecoration: 'none' }}>LinkedIn ↗</a>}
                {pi?.urls?.github && <a href={pi.urls.github} target='_blank' rel='noreferrer' className='premium-tag purple' style={{ textDecoration: 'none' }}>GitHub ↗</a>}
                {pi?.urls?.portfolio && <a href={pi.urls.portfolio} target='_blank' rel='noreferrer' className='premium-tag' style={{ textDecoration: 'none' }}>Portfolio ↗</a>}
              </div>
            )}

            {summary && (
              <div style={{ marginTop: 20 }}>
                <span className='muted' style={{ fontSize: 14, fontWeight: 500 }}>Summary</span>
                <p style={{ marginTop: 6, fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>{summary}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== Skills ===== */}
      <SkillList
        token={token}
        skills={profile.skills || null}
        onUpdate={fetchProfile}
      />

      {/* ===== Education ===== */}
      {profile.education && (
        <EducationList
          token={token}
          education={profile.education}
          onUpdate={fetchProfile}
        />
      )}

      {/* ===== Experience ===== */}
      {profile.experience && (
        <ExperienceList
          token={token}
          experience={profile.experience}
          onUpdate={fetchProfile}
        />
      )}

      {/* ===== Projects ===== */}
      {profile.projects && (
        <ProjectList
          token={token}
          projects={profile.projects}
          onUpdate={fetchProfile}
        />
      )}
    </div>
  )
}
