'use client'

import { apiRequest, ApiResponse } from '@/lib/api-client'
import { PrettyResponse } from '@/components/common/PrettyResponse'

type JobsPanelProps = {
    token: string
    roleName: string
    setRoleName: (v: string) => void
    companyName: string
    setCompanyName: (v: string) => void
    jobId: string
    setJobId: (v: string) => void
    loading: boolean
    runAction: <T>(target: string, label: string, fn: () => Promise<ApiResponse<T>>) => void
    results: Array<{ label: string; data: unknown; at: string }>
}

function renderJobCards(data: unknown) {
    if (!data || typeof data !== 'object') return null

    const obj = data as Record<string, unknown>

    // Handle job search response
    if (Array.isArray(obj.jobs)) {
        const jobs = obj.jobs as Array<Record<string, unknown>>
        if (jobs.length === 0) return <p className='muted'>No jobs found. Try a different search query.</p>
        return (
            <div className='result-stack'>
                {jobs.map((job, i) => (
                    <div key={String(job.id || i)} className='job-card'>
                        <div className='job-card-header'>
                            <div>
                                <div className='job-card-title'>{String(job.title || job.role || 'Untitled')}</div>
                                <div className='job-card-company'>{String(job.company || 'Unknown Company')}</div>
                            </div>
                            {job.match_score != null && (
                                <span className={`pill ${Number(job.match_score) >= 80 ? 'ok' : Number(job.match_score) >= 60 ? 'warn' : 'error'}`}>
                                    {String(job.match_score)}% Match
                                </span>
                            )}
                        </div>
                        <div className='job-card-meta'>
                            {!!job.location && <span className='chip'>{String(job.location)}</span>}
                            {!!job.platform && <span className='chip'>{String(job.platform)}</span>}
                            {!!job.salary && <span className='chip'>{String(job.salary)}</span>}
                        </div>
                        {job.match_score != null && (
                            <div className='match-bar'>
                                <div
                                    className={`match-bar-fill ${Number(job.match_score) >= 80 ? 'high' : Number(job.match_score) >= 60 ? 'mid' : 'low'}`}
                                    style={{ width: `${job.match_score}%` }}
                                />
                            </div>
                        )}
                        {!!job.matching_skills && Array.isArray(job.matching_skills) && (
                            <div className='skills-row'>
                                {(job.matching_skills as string[]).map((s) => (
                                    <span key={s} className='chip match'>{s}</span>
                                ))}
                            </div>
                        )}
                        {!!job.missing_skills && Array.isArray(job.missing_skills) && (
                            <div className='skills-row'>
                                {(job.missing_skills as string[]).map((s) => (
                                    <span key={s} className='chip miss'>{s}</span>
                                ))}
                            </div>
                        )}
                        {!!job.url && (
                            <div className='job-card-actions'>
                                <a href={String(job.url)} target='_blank' rel='noreferrer' className='button' style={{ fontSize: 12 }}>
                                    View Posting ↗
                                </a>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )
    }

    // Handle analysis response
    if (obj.match_score != null || obj.role) {
        return (
            <div className='result-card'>
                <div className='result-head'>
                    <h4>{String(obj.role || 'Job Analysis')}</h4>
                    {obj.match_score != null && (
                        <span className={`pill ${Number(obj.match_score) >= 80 ? 'ok' : Number(obj.match_score) >= 60 ? 'warn' : 'error'}`}>
                            {String(obj.match_score)}% Match
                        </span>
                    )}
                </div>
                {!!obj.company && <p className='muted' style={{ margin: '4px 0 8px' }}>{String(obj.company)}</p>}
                {obj.match_score != null && (
                    <div className='match-bar'>
                        <div
                            className={`match-bar-fill ${Number(obj.match_score) >= 80 ? 'high' : Number(obj.match_score) >= 60 ? 'mid' : 'low'}`}
                            style={{ width: `${obj.match_score}%` }}
                        />
                    </div>
                )}
                {!!obj.matching_skills && Array.isArray(obj.matching_skills) && (
                    <div style={{ marginTop: 10 }}>
                        <span className='muted' style={{ fontSize: 11 }}>MATCHING SKILLS</span>
                        <div className='skills-row'>{(obj.matching_skills as string[]).map((s) => <span key={s} className='chip match'>{s}</span>)}</div>
                    </div>
                )}
                {!!obj.missing_skills && Array.isArray(obj.missing_skills) && (
                    <div style={{ marginTop: 8 }}>
                        <span className='muted' style={{ fontSize: 11 }}>SKILLS TO DEVELOP</span>
                        <div className='skills-row'>{(obj.missing_skills as string[]).map((s) => <span key={s} className='chip miss'>{s}</span>)}</div>
                    </div>
                )}
                {!!obj.gap_analysis_advice && (
                    <div style={{ marginTop: 10, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                        {String(obj.gap_analysis_advice)}
                    </div>
                )}
            </div>
        )
    }

    return null
}

export function JobsPanel({ token, roleName, setRoleName, companyName, setCompanyName, jobId, setJobId, loading, runAction, results }: JobsPanelProps) {
    return (
        <div className='action-grid'>
            <div className='section-header'>
                <h3>🔍 Job Search & Analysis</h3>
            </div>
            <div className='field-row'>
                <input className='input' value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder='Role (e.g. AI Engineer)' />
                <input className='input' value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder='Location (e.g. Remote)' />
                <button
                    className='button primary'
                    disabled={loading}
                    onClick={() =>
                        runAction('jobs', 'Job Search', () =>
                            apiRequest('/api/v1/jobs/search', { method: 'POST', token, body: { query: roleName, location: companyName || 'Remote' } })
                        )
                    }
                >
                    Search Jobs
                </button>
            </div>
            <div className='field-row'>
                <button
                    className='button'
                    disabled={loading}
                    onClick={() => runAction('jobs', 'Load Results', () => apiRequest('/api/v1/jobs/results', { token }))}
                >
                    Load Saved Results
                </button>
                <input className='input' value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder='Job ID to analyze' style={{ flex: '0 1 220px' }} />
                <button
                    className='button'
                    disabled={!jobId || loading}
                    onClick={() => runAction('jobs', 'Analyze', () => apiRequest(`/api/v1/jobs/analyze/${jobId}`, { method: 'POST', token }))}
                >
                    Analyze
                </button>
                <button
                    className='button success'
                    disabled={!jobId || loading}
                    onClick={() => runAction('jobs', 'Apply', () => apiRequest(`/api/v1/jobs/apply/${jobId}?trigger_agent=false`, { method: 'POST', token }))}
                >
                    Apply
                </button>
            </div>

            {results.length === 0 ? (
                <div className='empty-state'>
                    <div className='empty-icon'>🔍</div>
                    <p>Search for jobs to see results here</p>
                </div>
            ) : (
                results.map((entry) => (
                    <div key={`${entry.label}_${entry.at}`}>
                        <div className='result-head'>
                            <h4>{entry.label}</h4>
                            <span className='muted' style={{ fontSize: 11 }}>{new Date(entry.at).toLocaleTimeString()}</span>
                        </div>
                        {renderJobCards(entry.data) || (
                            <PrettyResponse data={entry.data} />
                        )}
                    </div>
                ))
            )}
        </div>
    )
}
