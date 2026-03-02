'use client'

import { apiRequest, ApiResponse } from '@/lib/api-client'

type AnalyticsPanelProps = {
    token: string
    loading: boolean
    runAction: <T>(target: string, label: string, fn: () => Promise<ApiResponse<T>>) => void
    results: Array<{ label: string; data: unknown; at: string }>
}

function renderAnalytics(data: unknown) {
    if (!data || typeof data !== 'object') return null
    const obj = data as Record<string, unknown>

    // Dashboard / stats overview
    const statKeys = ['total_searches', 'total_applications', 'total_interviews', 'total_offers',
        'success_rate', 'total_resumes', 'total_cover_letters', 'credits_remaining', 'credits_used']

    const stats: Array<{ key: string; value: string | number }> = []
    for (const k of statKeys) {
        if (obj[k] != null) stats.push({ key: k, value: obj[k] as string | number })
    }

    // Agent performance
    const agentPerf = Array.isArray(obj.agents) ? obj.agents as Array<Record<string, unknown>>
        : obj.agents && typeof obj.agents === 'object' ? Object.entries(obj.agents as Record<string, unknown>).map(([name, v]) => ({ name, ...(typeof v === 'object' && v !== null ? v : { score: v }) })) as Array<Record<string, unknown>>
            : obj.agent_performance && typeof obj.agent_performance === 'object' ? Object.entries(obj.agent_performance as Record<string, unknown>).map(([name, v]) => ({ name, ...(typeof v === 'object' && v !== null ? v : { score: v }) })) as Array<Record<string, unknown>>
            : null

    // Cost breakdown
    const costs = Array.isArray(obj.costs) ? obj.costs as Array<Record<string, unknown>>
        : obj.breakdown && typeof obj.breakdown === 'object' ? Object.entries(obj.breakdown as Record<string, unknown>).map(([label, amount]) => ({ label, amount })) as Array<Record<string, unknown>>
            : obj.cost_breakdown && typeof obj.cost_breakdown === 'object' ? Object.entries(obj.cost_breakdown as Record<string, unknown>).map(([label, amount]) => ({ label, amount })) as Array<Record<string, unknown>>
            : null

    if (stats.length === 0 && !agentPerf && !costs) return null

    return (
        <div className='result-card'>
            {stats.length > 0 && (
                <div className='stat-grid' style={{ marginBottom: agentPerf || costs ? 16 : 0 }}>
                    {stats.map((s) => (
                        <div key={s.key} className='stat-card'>
                            <div className='stat-value'>{typeof s.value === 'number' && s.key.includes('rate') ? `${s.value}%` : String(s.value)}</div>
                            <div className='stat-label'>{s.key.replace(/_/g, ' ')}</div>
                        </div>
                    ))}
                </div>
            )}

            {agentPerf && (
                <div style={{ marginBottom: costs ? 16 : 0 }}>
                    <h4 style={{ marginBottom: 8, fontSize: 14 }}>Agent Performance</h4>
                    {agentPerf.map((a) => {
                        const score = Number(a.score || a.success_rate || a.accuracy || 0)
                        return (
                            <div key={String(a.name)} className='perf-bar'>
                                <span className='perf-bar-label'>{String(a.name)}</span>
                                <div className='perf-bar-track'>
                                    <div className='perf-bar-fill' style={{ width: `${Math.min(score, 100)}%` }} />
                                </div>
                                <span className='muted' style={{ fontSize: 11, width: 36, textAlign: 'right' }}>{score}%</span>
                            </div>
                        )
                    })}
                </div>
            )}

            {costs && (
                <div>
                    <h4 style={{ marginBottom: 8, fontSize: 14 }}>Cost Breakdown</h4>
                    <div className='result-metrics'>
                        {costs.map((c) => (
                            <div key={String(c.label || c.model)} className='metric'>
                                <span>{String(c.label || c.model)}</span>
                                <p>${typeof c.amount === 'number' ? c.amount.toFixed(4) : String(c.amount || c.cost || '0')}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export function AnalyticsPanel({ token, loading, runAction, results }: AnalyticsPanelProps) {
    return (
        <div className='action-grid'>
            <div className='section-header'>
                <h3>📈 Analytics & System</h3>
            </div>
            <div className='field-row' style={{ flexWrap: 'wrap' }}>
                <button className='button primary' disabled={loading} onClick={() => runAction('analytics', 'Dashboard', () => apiRequest('/api/v1/analytics/dashboard', { token }))}>
                    Dashboard
                </button>
                <button className='button' disabled={loading} onClick={() => runAction('analytics', 'Agent Performance', () => apiRequest('/api/v1/analytics/agent-performance', { token }))}>
                    Agents
                </button>
                <button className='button' disabled={loading} onClick={() => runAction('analytics', 'Cost Breakdown', () => apiRequest('/api/v1/analytics/costs', { token }))}>
                    Costs
                </button>
                <button className='button' disabled={loading} onClick={() => runAction('analytics', 'System Health', () => apiRequest('/api/v1/analytics/system-health', { token }))}>
                    Health
                </button>
                <button className='button' disabled={loading} onClick={() => runAction('analytics', 'Credits', () => apiRequest('/api/v1/analytics/credits', { token }))}>
                    Credits
                </button>
            </div>

            {results.length === 0 ? (
                <div className='empty-state'>
                    <div className='empty-icon'>📈</div>
                    <p>Load the dashboard to see stats, costs, and agent performance</p>
                </div>
            ) : (
                results.map((entry) => (
                    <div key={`${entry.label}_${entry.at}`}>
                        <div className='result-head'>
                            <h4>{entry.label}</h4>
                            <span className='muted' style={{ fontSize: 11 }}>{new Date(entry.at).toLocaleTimeString()}</span>
                        </div>
                        {renderAnalytics(entry.data) || (
                            <details className='details-block' open>
                                <summary>View Response</summary>
                                <pre className='code-block'>{JSON.stringify(entry.data, null, 2)}</pre>
                            </details>
                        )}
                    </div>
                ))
            )}
        </div>
    )
}
