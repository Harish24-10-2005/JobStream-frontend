'use client'

import { apiRequest, ApiResponse } from '@/lib/api-client'
import { PrettyResponse } from '@/components/common/PrettyResponse'

type CareerPanelProps = {
    token: string
    roleName: string
    setRoleName: (v: string) => void
    loading: boolean
    runAction: <T>(target: string, label: string, fn: () => Promise<ApiResponse<T>>) => void
    results: Array<{ label: string; data: unknown; at: string }>
}

function renderCareerResult(data: unknown) {
    if (!data || typeof data !== 'object') return null
    const obj = data as Record<string, unknown>

    // Career paths
    const pathsData = obj.paths || obj.suggested_paths
    if (Array.isArray(pathsData)) {
        const paths = pathsData as Array<Record<string, unknown>>
        return (
            <div className='result-stack'>
                {paths.map((pth, i) => (
                    <div key={i} className='path-card'>
                        <div className='path-card-title'>{String(pth.title || pth.name || `Path ${i + 1}`)}</div>
                        {!!pth.target_salary && <div className='path-card-salary'>{String(pth.target_salary)}</div>}
                        {!!pth.steps && Array.isArray(pth.steps) && (
                            <div className='path-steps'>
                                {pth.steps.map((step: any, j: number) => (
                                    <span key={j}>
                                        {j > 0 && <span className='path-arrow'>→ </span>}
                                        <span className='path-step'>{typeof step === 'string' ? step : step.title || step.name}</span>
                                    </span>
                                ))}
                            </div>
                        )}
                        {!!pth.timeline && <p className='muted' style={{ fontSize: 12, marginTop: 6 }}>Estimated: {String(pth.timeline)}</p>}
                    </div>
                ))}
            </div>
        )
    }

    // Skill gaps
    const gapsData = obj.skill_gaps || obj.gaps || obj.missing_skills
    if (Array.isArray(gapsData)) {
        const gaps = gapsData as Array<Record<string, unknown>>
        return (
            <div className='result-stack'>
                {gaps.map((gap, i) => (
                    <div key={i} className='dossier-item'>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h5>{String(gap.skill || gap.name)}</h5>
                            <span className={`pill ${Number(gap.priority || gap.importance) >= 8 ? 'error' : 'warn'}`}>
                                Priority: {String(gap.priority || gap.importance || '--')}
                            </span>
                        </div>
                        {gap.current_level != null && gap.required_level != null && (
                            <div style={{ marginTop: 6 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)' }}>
                                    <span>Current: {String(gap.current_level)}</span>
                                    <span>Required: {String(gap.required_level)}</span>
                                </div>
                                <div className='skill-gap-bar'>
                                    <div className='skill-gap-fill' style={{ width: `${(Number(gap.current_level) / Number(gap.required_level)) * 100}%` }} />
                                </div>
                            </div>
                        )}
                        {!!gap.suggestion && <p style={{ marginTop: 4, fontSize: 12, color: 'var(--text-2)' }}>{String(gap.suggestion)}</p>}
                    </div>
                ))}
            </div>
        )
    }

    // Timeline estimate
    if (obj.estimated_months || obj.timeline) {
        return (
            <div className='result-card'>
                <div className='result-metrics'>
                    {Object.entries(obj).map(([k, v]) => (
                        <div key={k} className='metric'>
                            <span>{k.replace(/_/g, ' ')}</span>
                            <p>{typeof v === 'object' ? '' : String(v)}</p>
                            {typeof v === 'object' && <PrettyResponse data={v} compact />}
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return null
}

export function CareerPanel({ token, roleName, setRoleName, loading, runAction, results }: CareerPanelProps) {
    return (
        <div className='action-grid'>
            <div className='section-header'>
                <h3>🚀 Career Paths</h3>
            </div>
            <div className='field-row'>
                <input className='input' value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder='Your Current/Target Role' />
                <button
                    className='button primary'
                    disabled={loading}
                    onClick={() => runAction('career', 'Career Analysis', () => apiRequest('/api/v1/career/analyze', { method: 'POST', token, body: {} }))}
                >
                    Full Analysis
                </button>
                <button
                    className='button'
                    disabled={loading || !roleName}
                    onClick={() => runAction('career', 'Quick Paths', () => apiRequest('/api/v1/career/paths', { method: 'POST', token, body: { current_title: roleName } }))}
                >
                    Quick Paths
                </button>
                <button
                    className='button'
                    disabled={loading || !roleName}
                    onClick={() =>
                        runAction('career', 'Skill Gaps', () =>
                            apiRequest(`/api/v1/career/skill-gaps/${encodeURIComponent('Senior ' + roleName)}`, { token })
                        )
                    }
                >
                    Skill Gaps
                </button>
            </div>

            {results.length === 0 ? (
                <div className='empty-state'>
                    <div className='empty-icon'>🚀</div>
                    <p>Analyze your career path or identify skill gaps</p>
                </div>
            ) : (
                results.map((entry) => (
                    <div key={`${entry.label}_${entry.at}`}>
                        <div className='result-head'>
                            <h4>{entry.label}</h4>
                            <span className='muted' style={{ fontSize: 11 }}>{new Date(entry.at).toLocaleTimeString()}</span>
                        </div>
                        {renderCareerResult(entry.data) || (
                            <PrettyResponse data={entry.data} />
                        )}
                    </div>
                ))
            )}
        </div>
    )
}
