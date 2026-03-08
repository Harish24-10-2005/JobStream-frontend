'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError, apiRequest, ApiResponse } from '@/lib/api-client'
import { getApiBaseUrl } from '@/lib/runtime-urls'
import { useRealtimeApplier } from '@/hooks/useRealtimeApplier'
import { Sidebar, type PanelKey } from './Sidebar'
import { Topbar } from './Topbar'
import { JobsPanel } from './panels/JobsPanel'
import { ResumePanel } from './panels/ResumePanel'
import { CoverLetterPanel } from './panels/CoverLetterPanel'
import { CompanyPanel } from './panels/CompanyPanel'
import { InterviewPanel } from './panels/InterviewPanel'
import { TrackerPanel } from './panels/TrackerPanel'
import { NetworkPanel } from './panels/NetworkPanel'
import { CareerPanel } from './panels/CareerPanel'
import { AnalyticsPanel } from './panels/AnalyticsPanel'
import { LiveAgentPanel } from './panels/LiveAgentPanel'
import { PipelinePanel } from './panels/PipelinePanel'
import { ProfilePanel } from './panels/ProfilePanel'
import { ProfileCompletionPanel } from './ProfileCompletionPanel'
import TestDashboard from '@/app/test-dashboard/page'

type Result = { label: string; data: unknown; at: string }

type ProfileCompletion = {
  has_profile: boolean
  has_education: boolean
  has_experience: boolean
  has_projects: boolean
  has_skills: boolean
  has_resume: boolean
  completion_percent: number
}

type CreditsResponse = {
  queries_remaining?: number
  tokens_remaining?: number
}

type WorkspacePrefs = {
  accent: 'ember' | 'ocean' | 'emerald'
  density: 'comfortable' | 'compact'
  radius: 'soft' | 'sharp'
  motion: 'full' | 'reduced'
  intentMode: 'balanced' | 'aggressive' | 'conservative'
}

const DEFAULT_PREFS: WorkspacePrefs = {
  accent: 'ember',
  density: 'comfortable',
  radius: 'soft',
  motion: 'full',
  intentMode: 'balanced'
}

export default function ProductWorkspace({ token, email, onSignOut }: { token: string; email: string; onSignOut: () => void }) {
  const [panel, setPanel] = useState<PanelKey>('pipeline')
  const [roleName, setRoleName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobId, setJobId] = useState('')
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletion | null>(null)
  const [backendDown, setBackendDown] = useState(false)
  const [onboardingName, setOnboardingName] = useState('')
  const [onboardingLocation, setOnboardingLocation] = useState('')
  const [onboardingSummary, setOnboardingSummary] = useState('')
  const [onboardingSaving, setOnboardingSaving] = useState(false)
  const [onboardingError, setOnboardingError] = useState<string | null>(null)

  // Per-panel results
  const [results, setResults] = useState<Record<string, Result[]>>({})
  const panelResults = useMemo(() => results[panel] || [], [results, panel])

  // WebSocket
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID())
  const ws = useRealtimeApplier(token, sessionId)
  const screenshotStrings = useMemo(() => ws.screenshots.map((s) => s.image), [ws.screenshots])

  // Credit state
  const [creditQueries, setCreditQueries] = useState<string | null>(null)
  const [creditTokens, setCreditTokens] = useState<string | null>(null)
  const [prefs, setPrefs] = useState<WorkspacePrefs>(DEFAULT_PREFS)

  const applyCreditHeaders = useCallback((headers: Headers) => {
    const queryRemaining = headers.get('X-Credits-Queries-Remaining')
    const tokenRemaining = headers.get('X-Credits-Tokens-Remaining')
    if (queryRemaining) setCreditQueries(queryRemaining)
    if (tokenRemaining) setCreditTokens(tokenRemaining)
  }, [])

  const refreshCredits = useCallback(async () => {
    const res = await apiRequest<CreditsResponse>('/api/v1/analytics/credits', { token })
    applyCreditHeaders(res.headers)
    if (typeof res.data?.queries_remaining === 'number') {
      setCreditQueries(String(res.data.queries_remaining))
    }
    if (typeof res.data?.tokens_remaining === 'number') {
      setCreditTokens(String(res.data.tokens_remaining))
    }
  }, [applyCreditHeaders, token])

  const refreshProfileCompletion = useCallback(async () => {
    const res = await apiRequest<ProfileCompletion>('/api/v1/user/profile/completion', { token })
    setProfileCompletion(res.data)
    setBackendDown(false)
  }, [token])

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const results = await Promise.allSettled([refreshCredits(), refreshProfileCompletion()])
          const hasFailure = results.some((result) => result.status === 'rejected')
          if (mounted) setBackendDown(hasFailure)
        } finally {
          if (mounted) setProfileLoading(false)
        }
      })()
    return () => {
      mounted = false
    }
  }, [refreshCredits, refreshProfileCompletion])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = window.localStorage.getItem('jobstream.workspace.prefs')
      if (!saved) return
      const parsed = JSON.parse(saved) as Partial<WorkspacePrefs>
      setPrefs((prev) => ({ ...prev, ...parsed }))
    } catch {
      // Keep defaults when local storage is unavailable.
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('jobstream.workspace.prefs', JSON.stringify(prefs))

    const root = document.documentElement
    root.setAttribute('data-density', prefs.density)
    root.setAttribute('data-radius', prefs.radius)
    root.setAttribute('data-motion', prefs.motion)

    const accentMap = {
      ember: { accent: '#ff8a1f', soft: '#ffb46d', bg: 'rgba(255, 138, 31, .12)', border: 'rgba(255, 138, 31, .45)' },
      ocean: { accent: '#2ea8ff', soft: '#84d2ff', bg: 'rgba(46, 168, 255, .14)', border: 'rgba(46, 168, 255, .45)' },
      emerald: { accent: '#13b981', soft: '#77e7c3', bg: 'rgba(19, 185, 129, .14)', border: 'rgba(19, 185, 129, .45)' }
    } as const
    const tokens = accentMap[prefs.accent]
    root.style.setProperty('--accent', tokens.accent)
    root.style.setProperty('--accent-soft', tokens.soft)
    root.style.setProperty('--accent-bg', tokens.bg)
    root.style.setProperty('--accent-border', tokens.border)
  }, [prefs])

  // Generic action runner that stores results per-panel
  const runAction = useCallback(
    async <T,>(target: string, label: string, fn: () => Promise<ApiResponse<T>>) => {
      setLoading(true)
      try {
        const res = await fn()
        applyCreditHeaders(res.headers)
        const entry: Result = { label, data: res.data ?? res, at: new Date().toISOString() }
        setResults((prev) => ({ ...prev, [target]: [entry, ...(prev[target] || [])].slice(0, 20) }))
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          applyCreditHeaders(err.headers)
        }
        const msg = err instanceof Error ? err.message : String(err)
        const entry: Result = { label: `ERROR ${label}`, data: { error: msg }, at: new Date().toISOString() }
        setResults((prev) => ({ ...prev, [target]: [entry, ...(prev[target] || [])].slice(0, 20) }))
      } finally {
        setLoading(false)
      }
    },
    [applyCreditHeaders]
  )

  const handleRefresh = useCallback(() => {
    runAction('analytics', 'Credits', () => apiRequest('/api/v1/analytics/credits', { token }))
  }, [runAction, token])

  const handleCreateProfile = useCallback(async () => {
    const name = onboardingName.trim()
    if (!name) return
    setOnboardingSaving(true)
    setOnboardingError(null)
    try {
      await apiRequest('/api/v1/user/profile', {
        method: 'POST',
        token,
        body: {
          full_name: name,
          email,
          location: onboardingLocation.trim(),
          summary: onboardingSummary.trim(),
          skills: []
        }
      })
      await refreshProfileCompletion()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save profile'
      setOnboardingError(message)
    } finally {
      setOnboardingSaving(false)
    }
  }, [email, onboardingLocation, onboardingName, onboardingSummary, refreshProfileCompletion, token])

  // Panel headlines
  const headlines: Record<PanelKey, { title: string; sub: string }> = {
    pipeline: { title: 'Pipeline', sub: 'Full autonomous job application pipeline' },
    live: { title: 'Live Agent', sub: 'Autonomous browser application with HITL' },
    jobs: { title: 'Job Search', sub: 'Search, analyze, and apply to jobs' },
    resume: { title: 'Resume Studio', sub: 'ATS analysis, tailoring, and templates' },
    cover: { title: 'Cover Letter', sub: 'Generate tailored cover letters instantly' },
    company: { title: 'Company Intel', sub: 'Deep research and insider dossiers' },
    interview: { title: 'Interview Prep', sub: 'Categorized questions, tips, and roleplay' },
    tracker: { title: 'Tracker', sub: 'Track and manage all your applications' },
    network: { title: 'Referrals', sub: 'Find connections and generate outreach' },
    career: { title: 'Career Paths', sub: 'Explore paths, timelines, and skill gaps' },
    profile: { title: 'My Profile', sub: 'View and edit your profile details' },
    test: { title: 'Test Dashboard', sub: 'System Health & Validation Metrics' },
    analytics: { title: 'Analytics', sub: 'Dashboard, costs, and system health' }
  }

  const renderPanel = () => {
    const shared = { token, roleName, setRoleName, companyName, setCompanyName, loading, runAction, results: panelResults }

    switch (panel) {
      case 'jobs':
        return <JobsPanel {...shared} jobId={jobId} setJobId={setJobId} />
      case 'resume':
        return <ResumePanel {...shared} />
      case 'cover':
        return <CoverLetterPanel {...shared} />
      case 'company':
        return <CompanyPanel {...shared} />
      case 'interview':
        return <InterviewPanel {...shared} />
      case 'tracker':
        return <TrackerPanel {...shared} />
      case 'network':
        return <NetworkPanel {...shared} />
      case 'career':
        return <CareerPanel {...shared} />
      case 'profile':
        return <ProfilePanel token={token} />
      case 'analytics':
        return <AnalyticsPanel token={token} loading={loading} runAction={runAction} results={panelResults} />
      case 'test':
        return <TestDashboard />
      case 'pipeline':
        return (
          <PipelinePanel
            token={token}
            sessionId={sessionId}
            loading={loading}
            runAction={runAction}
            results={panelResults}
            wsConnected={ws.connected}
            wsEvents={ws.events.map((e) => ({
              type: e.type,
              data: e.message || JSON.stringify(e.data || ''),
              ts: e.timestamp || new Date().toISOString(),
              raw: e.data || null,
              agent: e.agent || 'system'
            }))}
            screenshot={ws.lastScreenshot}
            screenshots={screenshotStrings}
            pendingHitl={ws.pendingHitl}
            onResolveHitl={(_id: string, response: string) => ws.resolveHitl(response)}
            onSendChat={ws.sendChat}
            onSessionChange={setSessionId}
            wsError={ws.error}
            wsReconnectCount={ws.reconnectCount}
            wsLastPongAt={ws.lastPongAt}
            onReconnectWs={ws.reconnect}
            intentPreset={prefs.intentMode}
          />
        )
      case 'live':
        return (
          <LiveAgentPanel
            token={token}
            loading={loading}
            runAction={runAction}
            results={panelResults}
            wsConnected={ws.connected}
            wsEvents={ws.events.map((e) => ({ type: e.type, data: e.message || JSON.stringify(e.data || ''), ts: e.timestamp || new Date().toISOString(), agent: e.agent || 'system' }))}
            screenshot={ws.lastScreenshot}
            screenshots={screenshotStrings}
            pendingHitl={ws.pendingHitl}
            tasks={[]}
            onStartApply={ws.startApply}
            onResolveHitl={(_id: string, response: string) => ws.resolveHitl(response)}
            onSendChat={ws.sendChat}
            onStopApply={ws.stopApply}
          />
        )
      default:
        return null
    }
  }

  if (profileLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className='spinner' style={{ width: 32, height: 32, margin: '0 auto 16px', borderWidth: 3 }} />
          <p style={{ color: 'var(--text-2)', fontWeight: 500, fontSize: 15 }}>Loading workspace...</p>
          <p className='muted' style={{ fontSize: 12, marginTop: 4 }}>Connecting to AI services</p>
        </div>
      </div>
    )
  }

  if (!profileCompletion?.has_profile) {
    // Backend unreachable and no cached profile — show an error, not the onboarding form
    if (backendDown) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
        }}>
          <div style={{ textAlign: 'center', maxWidth: 420, padding: 32 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚡</div>
            <h2 style={{ color: 'var(--text)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Backend Unavailable</h2>
            <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Cannot reach the API server. Make sure the backend is running on <code style={{ color: 'var(--accent)' }}>{getApiBaseUrl()}</code> and try again.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className='button primary' onClick={() => { setProfileLoading(true); setBackendDown(false); refreshProfileCompletion().catch(() => { setBackendDown(true) }).finally(() => setProfileLoading(false)) }}>
                Retry Connection
              </button>
              <button className='button secondary' onClick={onSignOut}>Sign Out</button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <ProfileCompletionPanel
        onboardingName={onboardingName}
        setOnboardingName={setOnboardingName}
        onboardingLocation={onboardingLocation}
        setOnboardingLocation={setOnboardingLocation}
        onboardingSummary={onboardingSummary}
        setOnboardingSummary={setOnboardingSummary}
        onboardingSaving={onboardingSaving}
        onboardingError={onboardingError}
        handleCreateProfile={handleCreateProfile}
        onSignOut={onSignOut}
      />
    )
  }

  return (
    <div className='app-shell'>
      <Sidebar activePanel={panel} onPanelChange={setPanel} userEmail={email} />
      <div className='workspace-shell'>
        <Topbar
          sessionId={sessionId}
          wsConnected={ws.connected}
          creditQueries={creditQueries}
          creditTokens={creditTokens}
          prefs={prefs}
          onPrefsChange={setPrefs}
          onRefresh={handleRefresh}
          onSignOut={onSignOut}
        />
        {panel === 'live' || panel === 'pipeline' ? (
          renderPanel()
        ) : (
          <div className='workspace-content'>
            <div className='main-column'>
              <div className='headline-block'>
                <h2>{headlines[panel].title}</h2>
                <p>{headlines[panel].sub}</p>
              </div>
              {loading && (
                <div className='loading-row'>
                  <div className='spinner' />
                  <span className='muted'>Processing...</span>
                </div>
              )}
              {renderPanel()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
