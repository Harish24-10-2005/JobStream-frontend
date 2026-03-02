'use client'

import { useState, useRef, useEffect } from 'react'
import { apiRequest, ApiResponse } from '@/lib/api-client'

/* ── types ── */
type PipelineStatus = {
    running: boolean
    current_agent: string | null
    progress: number
    jobs_found: number
    jobs_applied: number
}

type PipelinePanelProps = {
    token: string
    sessionId: string
    loading: boolean
    runAction: <T>(target: string, label: string, fn: () => Promise<ApiResponse<T>>) => void
    results: Array<{ label: string; data: unknown; at: string }>
    // WebSocket state from useRealtimeApplier (reused for pipeline WS)
    wsConnected: boolean
    wsEvents: Array<{ type: string; data: string; ts: string; raw?: Record<string, unknown> | null; agent?: string }>
    screenshot: string | null
    screenshots: string[]
    pendingHitl: { id: string; message: string; options?: string[] } | null
    onResolveHitl: (id: string, response: string) => void
    onSendChat: (msg: string) => void
    onSessionChange: (sessionId: string) => void
    wsError: string | null
    wsReconnectCount: number
    wsLastPongAt: string | null
    onReconnectWs: () => void
}

type ProfileReadiness = {
    ready: boolean
    missing_requirements: string[]
    completion: {
        has_profile: boolean
        has_education: boolean
        has_experience: boolean
        has_projects: boolean
        has_skills: boolean
        has_resume: boolean
        completion_percent: number
    }
}

/* ── helpers ── */
const agentSteps = [
    { key: 'scout', icon: '🔍', label: 'Scout Agent', desc: 'Finding matching jobs' },
    { key: 'analyst', icon: '📊', label: 'Analyst Agent', desc: 'Evaluating job fit' },
    { key: 'resume', icon: '📄', label: 'Resume Agent', desc: 'Tailoring resume' },
    { key: 'cover_letter', icon: '✉️', label: 'Cover Letter Agent', desc: 'Generating cover letters' },
    { key: 'applier', icon: '🚀', label: 'Applier Agent', desc: 'Submitting applications' },
]

const TS = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
    catch { return '' }
}

const actionIcon = (type: string) => {
    if (type.includes('scout')) return '🔍'
    if (type.includes('analyst') || type.includes('analyze')) return '📊'
    if (type.includes('resume')) return '📄'
    if (type.includes('cover')) return '✉️'
    if (type.includes('appli')) return '🚀'
    if (type.includes('hitl') || type.includes('approval')) return '⚠️'
    if (type.includes('error') || type.includes('fail')) return '❌'
    if (type.includes('success') || type.includes('complete')) return '✅'
    if (type.includes('start')) return '▶️'
    return '⚡'
}

const isNoiseEvent = (type: string) => type === 'connected' || type === 'ping' || type === 'pong'

export function PipelinePanel({
    token, sessionId, loading, runAction, results,
    wsConnected, wsEvents, screenshot, screenshots,
    pendingHitl, onResolveHitl, onSendChat, onSessionChange,
    wsError, wsReconnectCount, wsLastPongAt, onReconnectWs,
}: PipelinePanelProps) {
    const [query, setQuery] = useState('')
    const [location, setLocation] = useState('Remote')
    const [autoApply, setAutoApply] = useState(true)
    const [minScore, setMinScore] = useState(70)
    const [maxJobs, setMaxJobs] = useState(10)
    const [advancedOpen, setAdvancedOpen] = useState(false)
    const [showEventDetails, setShowEventDetails] = useState(true)
    const [forceResumeTailoring, setForceResumeTailoring] = useState<'auto' | 'on' | 'off'>('auto')
    const [forceCoverLetter, setForceCoverLetter] = useState<'auto' | 'on' | 'off'>('auto')
    const [forceCompanyResearch, setForceCompanyResearch] = useState<'auto' | 'on' | 'off'>('auto')
    const [pipelineRunning, setPipelineRunning] = useState(false)
    const [status, setStatus] = useState<PipelineStatus | null>(null)
    const [startError, setStartError] = useState<string | null>(null)
    const [readiness, setReadiness] = useState<ProfileReadiness | null>(null)
    const [chatInput, setChatInput] = useState('')
    const [hitlResponse, setHitlResponse] = useState('')
    const [activeThumb, setActiveThumb] = useState(-1)
    const chatEndRef = useRef<HTMLDivElement>(null)
    const displayImg = activeThumb >= 0 ? screenshots[activeThumb] : screenshot
    const timelineEvents = wsEvents.filter((ev) => !isNoiseEvent(ev.type))

    // Auto-scroll
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [wsEvents.length])

    // Poll status while running
    useEffect(() => {
        if (!pipelineRunning) return
        const interval = setInterval(async () => {
            try {
                const res = await apiRequest<PipelineStatus>('/api/v1/pipeline/status', { token })
                setStatus(res.data)
                if (!res.data.running) setPipelineRunning(false)
            } catch { /* ignore */ }
        }, 3000)
        return () => clearInterval(interval)
    }, [pipelineRunning, token])

    useEffect(() => {
        const loadReadiness = async () => {
            try {
                const res = await apiRequest<ProfileReadiness>('/api/v1/user/profile/readiness', { token })
                setReadiness(res.data)
            } catch {
                setReadiness(null)
            }
        }
        void loadReadiness()
    }, [token])

    useEffect(() => {
        const loadStatus = async () => {
            try {
                const res = await apiRequest<PipelineStatus>('/api/v1/pipeline/status', { token })
                setStatus(res.data)
                setPipelineRunning(res.data.running)
            } catch {
                // keep UI usable when status endpoint fails
            }
        }
        void loadStatus()
    }, [token])

    const handleStart = async () => {
        if (!query.trim()) return
        const toOverride = (value: 'auto' | 'on' | 'off'): boolean | null => {
            if (value === 'auto') return null
            return value === 'on'
        }
        try {
            setStartError(null)
            const res = await apiRequest<{ session_id?: string }>('/api/v1/pipeline/start', {
                method: 'POST', token,
                body: {
                    query: query.trim(),
                    location,
                    auto_apply: autoApply,
                    min_match_score: minScore,
                    max_jobs: maxJobs,
                    use_resume_tailoring: toOverride(forceResumeTailoring),
                    use_cover_letter: toOverride(forceCoverLetter),
                    use_company_research: toOverride(forceCompanyResearch),
                    session_id: sessionId
                }
            })
            if (res.data?.session_id && res.data.session_id !== sessionId) {
                onSessionChange(res.data.session_id)
            }
            setPipelineRunning(true)
            try {
                const rd = await apiRequest<ProfileReadiness>('/api/v1/user/profile/readiness', { token })
                setReadiness(rd.data)
            } catch {
                // no-op
            }
        } catch (e) {
            console.error('Pipeline start failed:', e)
            const err = e as { message?: string; payload?: unknown }
            if (err?.payload && typeof err.payload === 'object' && err.payload !== null && 'detail' in err.payload) {
                const detail = (err.payload as { detail?: unknown }).detail
                if (detail && typeof detail === 'object' && 'missing_requirements' in (detail as Record<string, unknown>)) {
                    const missing = (detail as { missing_requirements?: string[] }).missing_requirements || []
                    setStartError(`Complete required setup first: ${missing.join(', ')}`)
                    try {
                        const rd = await apiRequest<ProfileReadiness>('/api/v1/user/profile/readiness', { token })
                        setReadiness(rd.data)
                    } catch {
                        // no-op
                    }
                } else {
                    setStartError(typeof detail === 'string' ? detail : 'Pipeline start failed')
                }
            } else {
                setStartError(err?.message || 'Pipeline start failed')
            }
        }
    }

    const handleStop = async () => {
        try {
            await apiRequest('/api/v1/pipeline/stop', { method: 'POST', token })
            setPipelineRunning(false)
        } catch (e) {
            console.error('Pipeline stop failed:', e)
        }
    }

    const handlePause = async () => {
        try {
            await apiRequest('/api/v1/pipeline/pause', { method: 'POST', token })
            setPipelineRunning(false)
        } catch (e) {
            console.error('Pipeline pause failed:', e)
        }
    }

    const handleSend = () => {
        const msg = chatInput.trim()
        if (!msg) return
        onSendChat(msg)
        setChatInput('')
    }

    const currentStep = status?.current_agent
        ? agentSteps.findIndex(s => s.key === status.current_agent)
        : -1

    return (
        <div className='agent-ui'>
            {/* ─── LEFT: Chat + Config Column ─── */}
            <div className='agent-chat-col'>
                <div className='agent-chat-messages'>
                    {!pipelineRunning && timelineEvents.length === 0 ? (
                        /* Welcome / Config screen */
                        <div className='agent-welcome'>
                            <div className='agent-welcome-icon'>🔄</div>
                            <h3>AI Pipeline</h3>
                            <p>Run the full autonomous pipeline: Scout → Analyst → Resume → Cover Letter → Apply. Configure and launch below.</p>

                            <div className='agent-start-card'>
                                {readiness && !readiness.ready && (
                                    <div className='agent-sys-msg error' style={{ marginBottom: 10 }}>
                                        Setup required before launch. Missing: {readiness.missing_requirements.join(', ')}
                                        <div className='muted' style={{ fontSize: 12, marginTop: 4 }}>
                                            Completion: {readiness.completion.completion_percent}%.
                                            Upload resume in Resume Studio, then add skills and at least one of education/experience/projects.
                                        </div>
                                    </div>
                                )}
                                <div className='agent-start-field'>
                                    <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, display: 'block' }}>Job Query</label>
                                    <input
                                        className='agent-url-input'
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder='e.g. Machine Learning Engineer, Backend Developer...'
                                        onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                                    />
                                </div>

                                <div className='agent-start-field' style={{ marginTop: 10 }}>
                                    <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, display: 'block' }}>Location</label>
                                    <input
                                        className='agent-url-input'
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder='Remote, San Francisco, etc.'
                                    />
                                </div>

                                <div className='pipeline-config-row'>
                                    <label className='agent-draft-toggle'>
                                        <input type='checkbox' checked={autoApply} onChange={(e) => setAutoApply(e.target.checked)} />
                                        <span>Auto Apply</span>
                                        <span className='muted' style={{ fontSize: 11 }}>Automatically submit applications</span>
                                    </label>
                                    <div className='pipeline-score-field'>
                                        <label style={{ fontSize: 12, color: 'var(--muted)' }}>Min Match Score</label>
                                        <input
                                            type='number' min={0} max={100} value={minScore}
                                            onChange={(e) => setMinScore(Number(e.target.value))}
                                            className='agent-url-input'
                                            style={{ width: 80, textAlign: 'center', padding: '6px 8px' }}
                                        />
                                    </div>
                                </div>

                                <div className='pipeline-config-row' style={{ marginTop: 8 }}>
                                    <div className='pipeline-score-field'>
                                        <label style={{ fontSize: 12, color: 'var(--muted)' }}>Max Jobs</label>
                                        <input
                                            type='number' min={1} max={50} value={maxJobs}
                                            onChange={(e) => setMaxJobs(Number(e.target.value || 10))}
                                            className='agent-url-input'
                                            style={{ width: 80, textAlign: 'center', padding: '6px 8px' }}
                                        />
                                    </div>
                                    <button
                                        className='button'
                                        style={{ fontSize: 12 }}
                                        onClick={() => setAdvancedOpen((v) => !v)}
                                    >
                                        {advancedOpen ? 'Hide Advanced' : 'Advanced Controls'}
                                    </button>
                                </div>

                                {advancedOpen && (
                                    <div className='pipeline-config-row' style={{ marginTop: 8, gap: 10, alignItems: 'flex-start' }}>
                                        <div className='pipeline-score-field'>
                                            <label style={{ fontSize: 12, color: 'var(--muted)' }}>Resume Tailor</label>
                                            <select className='agent-url-input' value={forceResumeTailoring} onChange={(e) => setForceResumeTailoring(e.target.value as 'auto' | 'on' | 'off')}>
                                                <option value='auto'>Auto</option>
                                                <option value='on'>Force On</option>
                                                <option value='off'>Force Off</option>
                                            </select>
                                        </div>
                                        <div className='pipeline-score-field'>
                                            <label style={{ fontSize: 12, color: 'var(--muted)' }}>Cover Letter</label>
                                            <select className='agent-url-input' value={forceCoverLetter} onChange={(e) => setForceCoverLetter(e.target.value as 'auto' | 'on' | 'off')}>
                                                <option value='auto'>Auto</option>
                                                <option value='on'>Force On</option>
                                                <option value='off'>Force Off</option>
                                            </select>
                                        </div>
                                        <div className='pipeline-score-field'>
                                            <label style={{ fontSize: 12, color: 'var(--muted)' }}>Company Research</label>
                                            <select className='agent-url-input' value={forceCompanyResearch} onChange={(e) => setForceCompanyResearch(e.target.value as 'auto' | 'on' | 'off')}>
                                                <option value='auto'>Auto</option>
                                                <option value='on'>Force On</option>
                                                <option value='off'>Force Off</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div className='agent-start-options' style={{ marginTop: 12 }}>
                                    <button
                                        className='agent-start-btn'
                                        disabled={!query.trim() || loading || (readiness ? !readiness.ready : false)}
                                        onClick={handleStart}
                                    >
                                        ▶ Launch Pipeline
                                    </button>
                                    <button
                                        className='button'
                                        disabled={loading}
                                        onClick={() => runAction('pipeline', 'Status', () =>
                                            apiRequest<PipelineStatus>('/api/v1/pipeline/status', { token })
                                        )}
                                        style={{ fontSize: 13 }}
                                    >
                                        📊 Check Status
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {!pipelineRunning && (
                                <>
                                <div className='agent-start-card' style={{ marginBottom: 10 }}>
                                    {readiness && !readiness.ready && (
                                        <div className='agent-sys-msg error' style={{ marginBottom: 10 }}>
                                            Setup required before launch. Missing: {readiness.missing_requirements.join(', ')}
                                        </div>
                                    )}
                                    <div className='agent-start-field'>
                                        <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, display: 'block' }}>Job Query</label>
                                        <input
                                            className='agent-url-input'
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            placeholder='e.g. Machine Learning Engineer, Backend Developer...'
                                            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                                        />
                                    </div>
                                    <div className='agent-start-field' style={{ marginTop: 10 }}>
                                        <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, display: 'block' }}>Location</label>
                                        <input
                                            className='agent-url-input'
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            placeholder='Remote, San Francisco, etc.'
                                        />
                                    </div>
                                    <div className='agent-start-options' style={{ marginTop: 10 }}>
                                        <button className='agent-start-btn' disabled={!query.trim() || loading || (readiness ? !readiness.ready : false)} onClick={handleStart}>
                                            ▶ Launch Pipeline
                                        </button>
                                        <button
                                            className='button'
                                            disabled={loading}
                                            onClick={() => runAction('pipeline', 'Status', () =>
                                                apiRequest<PipelineStatus>('/api/v1/pipeline/status', { token })
                                            )}
                                            style={{ fontSize: 13 }}
                                        >
                                            📊 Check Status
                                        </button>
                                    </div>
                                </div>

                                <div className='pipeline-config-row' style={{ marginTop: 8 }}>
                                    <div className='pipeline-score-field'>
                                        <label style={{ fontSize: 12, color: 'var(--muted)' }}>Max Jobs</label>
                                        <input
                                            type='number' min={1} max={50} value={maxJobs}
                                            onChange={(e) => setMaxJobs(Number(e.target.value || 10))}
                                            className='agent-url-input'
                                            style={{ width: 80, textAlign: 'center', padding: '6px 8px' }}
                                        />
                                    </div>
                                    <button
                                        className='button'
                                        style={{ fontSize: 12 }}
                                        onClick={() => setAdvancedOpen((v) => !v)}
                                    >
                                        {advancedOpen ? 'Hide Advanced' : 'Advanced Controls'}
                                    </button>
                                </div>

                                {advancedOpen && (
                                    <div className='pipeline-config-row' style={{ marginTop: 8, gap: 10, alignItems: 'flex-start' }}>
                                        <div className='pipeline-score-field'>
                                            <label style={{ fontSize: 12, color: 'var(--muted)' }}>Resume Tailor</label>
                                            <select className='agent-url-input' value={forceResumeTailoring} onChange={(e) => setForceResumeTailoring(e.target.value as 'auto' | 'on' | 'off')}>
                                                <option value='auto'>Auto</option>
                                                <option value='on'>Force On</option>
                                                <option value='off'>Force Off</option>
                                            </select>
                                        </div>
                                        <div className='pipeline-score-field'>
                                            <label style={{ fontSize: 12, color: 'var(--muted)' }}>Cover Letter</label>
                                            <select className='agent-url-input' value={forceCoverLetter} onChange={(e) => setForceCoverLetter(e.target.value as 'auto' | 'on' | 'off')}>
                                                <option value='auto'>Auto</option>
                                                <option value='on'>Force On</option>
                                                <option value='off'>Force Off</option>
                                            </select>
                                        </div>
                                        <div className='pipeline-score-field'>
                                            <label style={{ fontSize: 12, color: 'var(--muted)' }}>Company Research</label>
                                            <select className='agent-url-input' value={forceCompanyResearch} onChange={(e) => setForceCompanyResearch(e.target.value as 'auto' | 'on' | 'off')}>
                                                <option value='auto'>Auto</option>
                                                <option value='on'>Force On</option>
                                                <option value='off'>Force Off</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                                </>
                            )}

                            {/* Pipeline running state */}
                            <div className='agent-sys-msg'>
                                <span className={`agent-ws-dot ${pipelineRunning ? 'on' : 'off'}`} />
                                {pipelineRunning ? 'Pipeline running' : 'Pipeline idle'}
                            </div>
                            {startError && <div className='agent-sys-msg error'>{startError}</div>}

                            <div className='agent-sys-msg' style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                <span className={`agent-ws-dot ${wsConnected ? 'on' : 'off'}`} />
                                <span>{wsConnected ? 'WS connected' : 'WS reconnecting'}</span>
                                <span className='muted' style={{ fontSize: 11 }}>Retries: {wsReconnectCount}</span>
                                <span className='muted' style={{ fontSize: 11 }}>
                                    Last pong: {wsLastPongAt ? TS(wsLastPongAt) : '--'}
                                </span>
                                <button className='button' style={{ fontSize: 12 }} onClick={onReconnectWs}>Reconnect</button>
                                <button className='button' style={{ fontSize: 12 }} onClick={() => setShowEventDetails((v) => !v)}>
                                    {showEventDetails ? 'Compact Events' : 'Detailed Events'}
                                </button>
                            </div>
                            {wsError && <div className='agent-sys-msg error'>{wsError}</div>}

                            {/* Pipeline progress */}
                            {status && (
                                <div className='pipeline-progress-card'>
                                    <div className='pipeline-steps'>
                                        {agentSteps.map((step, i) => {
                                            const isCurrent = step.key === status.current_agent
                                            const isDone = currentStep > i || (!status.running && status.progress === 100)
                                            return (
                                                <div key={step.key} className={`pipeline-step ${isCurrent ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                                                    <span className='pipeline-step-icon'>{isDone ? '✅' : isCurrent ? '🔄' : step.icon}</span>
                                                    <span className='pipeline-step-label'>{step.label}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div className='pipeline-stats'>
                                        <div className='pipeline-stat'>
                                            <span className='pipeline-stat-value'>{status.progress}%</span>
                                            <span className='pipeline-stat-label'>Progress</span>
                                        </div>
                                        <div className='pipeline-stat'>
                                            <span className='pipeline-stat-value'>{status.jobs_found}</span>
                                            <span className='pipeline-stat-label'>Found</span>
                                        </div>
                                        <div className='pipeline-stat'>
                                            <span className='pipeline-stat-value'>{status.jobs_applied}</span>
                                            <span className='pipeline-stat-label'>Applied</span>
                                        </div>
                                    </div>
                                    <div className='match-bar' style={{ marginTop: 8 }}>
                                        <div
                                            className={`match-bar-fill ${status.progress >= 80 ? 'high' : status.progress >= 40 ? 'mid' : 'low'}`}
                                            style={{ width: `${status.progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Event timeline */}
                            {timelineEvents.slice().reverse().map((ev, i) => (
                                <div key={i} className='agent-bubble agent'>
                                    <div className='agent-action-header'>
                                        <span className='agent-action-icon'>{actionIcon(ev.type)}</span>
                                        <span className='agent-action-label'>
                                            {ev.type.replace(/[:_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim()}
                                        </span>
                                    </div>
                                    {ev.data && (
                                        <div className='agent-bubble-content'>
                                            {ev.data.length > 200 ? (
                                                <details>
                                                    <summary>{ev.data.slice(0, 120)}…</summary>
                                                    <p>{ev.data}</p>
                                                </details>
                                            ) : ev.data}
                                        </div>
                                    )}
                                    {showEventDetails && ev.raw && (
                                        <details style={{ marginTop: 6 }}>
                                            <summary style={{ cursor: 'pointer', fontSize: 12 }}>Event Data</summary>
                                            <pre style={{ fontSize: 11, overflow: 'auto', maxHeight: 160, marginTop: 6 }}>
                                                {JSON.stringify(ev.raw, null, 2)}
                                            </pre>
                                        </details>
                                    )}
                                    <span className='agent-bubble-ts'>{TS(ev.ts)}</span>
                                </div>
                            ))}

                            {/* Inline HITL prompt */}
                            {pendingHitl && (
                                <div className='agent-hitl-inline'>
                                    <div className='agent-hitl-badge'>⚠ Needs Your Input</div>
                                    <p className='agent-hitl-msg'>{pendingHitl.message}</p>
                                    {pendingHitl.options && pendingHitl.options.length > 0 ? (
                                        <div className='agent-hitl-options'>
                                            {pendingHitl.options.map((opt) => (
                                                <button key={opt} className='agent-hitl-opt-btn' onClick={() => onResolveHitl(pendingHitl.id, opt)}>
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className='agent-hitl-freeform'>
                                            <input
                                                className='agent-url-input'
                                                value={hitlResponse}
                                                onChange={(e) => setHitlResponse(e.target.value)}
                                                placeholder='Type your response...'
                                                onKeyDown={(e) => { if (e.key === 'Enter' && hitlResponse) { onResolveHitl(pendingHitl.id, hitlResponse); setHitlResponse('') } }}
                                            />
                                            <button className='agent-hitl-approve' onClick={() => { onResolveHitl(pendingHitl.id, hitlResponse || 'approved'); setHitlResponse('') }}>
                                                ✓ Approve
                                            </button>
                                            <button className='agent-hitl-reject' onClick={() => onResolveHitl(pendingHitl.id, '__REJECT__')}>
                                                ✗ Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Results from API calls */}
                            {results.map((r, i) => (
                                <div key={i} className='agent-bubble agent'>
                                    <div className='agent-action-header'>
                                        <span className='agent-action-icon'>📋</span>
                                        <span className='agent-action-label'>{r.label}</span>
                                    </div>
                                    <div className='agent-bubble-content'>
                                        <pre style={{ fontSize: 12, overflow: 'auto', maxHeight: 200 }}>
                                            {JSON.stringify(r.data, null, 2)}
                                        </pre>
                                    </div>
                                    <span className='agent-bubble-ts'>{TS(r.at)}</span>
                                </div>
                            ))}

                            <div ref={chatEndRef} />
                        </>
                    )}
                </div>

                {/* Chat input bar */}
                <div className='agent-chat-bar'>
                    {pipelineRunning && (
                        <>
                            <button className='agent-stop-btn' onClick={handleStop} title='Stop pipeline'>■</button>
                            <button className='pipeline-pause-btn' onClick={handlePause} title='Pause pipeline'>⏸</button>
                        </>
                    )}
                    <div className='agent-chat-input-wrap'>
                        <input
                            className='agent-chat-input'
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder={pipelineRunning ? 'Queue message...' : 'Send a message...'}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                    </div>
                    <button className='agent-send-btn' onClick={handleSend} disabled={!chatInput.trim()}>↑</button>
                    <span className='agent-chat-disclaimer'>Pipeline runs Scout → Analyst → Resume → Cover Letter → Applier</span>
                </div>
            </div>

            {/* ─── RIGHT: Browser + Status Column ─── */}
            <div className='agent-browser-col'>
                <div className='agent-browser-header'>
                    <span className='agent-browser-title'>Pipeline Live View</span>
                    <div className='agent-browser-controls'>
                        <span className={`agent-ws-dot ${wsConnected ? 'on' : 'off'}`} />
                        <span className='muted' style={{ fontSize: 11 }}>{wsConnected ? 'Live' : 'Offline'}</span>
                    </div>
                </div>

                <div className='agent-browser-viewport'>
                    {displayImg ? (
                        <>
                            <div className='agent-browser-chrome'>
                                <div className='agent-browser-dots'><span /><span /><span /></div>
                                <div className='agent-browser-url-bar'>
                                    <span className='agent-browse-icon'>🔄</span>
                                    <span className='agent-browse-label'>Pipeline Active</span>
                                </div>
                            </div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img className='agent-browser-img' src={displayImg} alt='Pipeline screenshot' />
                        </>
                    ) : (
                        <div className='agent-browser-empty'>
                            <div className='agent-browser-empty-icon'>🔄</div>
                            <p>Pipeline output will appear here</p>
                            <p className='muted' style={{ fontSize: 12 }}>Launch the pipeline to see live agent screenshots</p>
                        </div>
                    )}
                </div>

                {screenshots.length > 1 && (
                    <div className='agent-thumb-strip'>
                        {screenshots.map((src, i) => (
                            <button
                                key={i}
                                className={`agent-thumb ${i === activeThumb ? 'active' : ''}`}
                                onClick={() => setActiveThumb(i === activeThumb ? -1 : i)}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={src} alt={`Frame ${i + 1}`} />
                            </button>
                        ))}
                    </div>
                )}

                {/* Agent steps tracker */}
                <div className='agent-tasks-panel'>
                    <div className='agent-tasks-header'>
                        <span>Agent Pipeline</span>
                        {status && <span className='muted'>{status.progress}%</span>}
                    </div>
                    <ul className='agent-task-list'>
                        {agentSteps.map((step, i) => {
                            const isDone = currentStep > i || (status && !status.running && status.progress === 100)
                            const isCurrent = step.key === status?.current_agent
                            return (
                                <li key={step.key} className={isDone ? 'done' : isCurrent ? 'active' : ''}>
                                    <span className='agent-task-icon'>{isDone ? '✅' : isCurrent ? '🔄' : '⭕'}</span>
                                    <span style={{ fontWeight: isCurrent ? 600 : 400 }}>{step.label}</span>
                                    {isCurrent && <span className='muted' style={{ fontSize: 11, marginLeft: 4 }}>— {step.desc}</span>}
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </div>
        </div>
    )
}
