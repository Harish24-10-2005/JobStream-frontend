'use client'

import { useState } from 'react'
import { apiRequest, ApiResponse } from '@/lib/api-client'

type TrackerPanelProps = {
    token: string
    roleName: string
    setRoleName: (v: string) => void
    companyName: string
    setCompanyName: (v: string) => void
    loading: boolean
    runAction: <T>(target: string, label: string, fn: () => Promise<ApiResponse<T>>) => void
    results: Array<{ label: string; data: unknown; at: string }>
}

function renderTrackerData(data: unknown) {
    if (!data || typeof data !== 'object') return null
    const obj = data as Record<string, unknown>

    // Application list
    if (Array.isArray(obj.applications)) {
        const apps = obj.applications as Array<Record<string, unknown>>
        if (apps.length === 0) return <p className='muted'>No tracked applications yet.</p>
        return (
            <div style={{ overflowX: 'auto' }}>
                <table className='tracker-table'>
                    <thead>
                        <tr>
                            <th>Company</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Applied</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {apps.map((app, i) => {
                            const status = String(app.status || 'pending').toLowerCase()
                            return (
                                <tr key={String(app.id || i)}>
                                    <td style={{ fontWeight: 600 }}>{String(app.company_name || app.company || '--')}</td>
                                    <td>{String(app.role || app.job_title || '--')}</td>
                                    <td><span className={`status-badge ${status}`}>{status}</span></td>
                                    <td className='muted'>{app.applied_at ? new Date(String(app.applied_at)).toLocaleDateString() : '--'}</td>
                                    <td>
                                        <span className='muted' style={{ fontSize: 11 }}>ID: {String(app.id || '--').slice(0, 8)}</span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        )
    }

    // Stats
    if (obj.total != null || obj.by_status || obj.stats) {
        const statsData = (obj.stats || obj) as Record<string, unknown>
        return (
            <div className='stat-grid'>
                {Object.entries(statsData).map(([k, v]) => (
                    <div key={k} className='stat-card'>
                        <div className='stat-value'>{typeof v === 'number' ? v : typeof v === 'object' ? Object.keys(v as object).length : String(v)}</div>
                        <div className='stat-label'>{k.replace(/_/g, ' ')}</div>
                    </div>
                ))}
            </div>
        )
    }

    return null
}

export function TrackerPanel({ token, roleName, setRoleName, companyName, setCompanyName, loading, runAction, results }: TrackerPanelProps) {
    const [status, setStatus] = useState('Applied')
    const [updateIdentifier, setUpdateIdentifier] = useState('')
    const [newStatus, setNewStatus] = useState('Interview')

    return (
        <div className='action-grid'>
            <div className='section-header'>
                <h3>📊 Application Tracker</h3>
            </div>
            <div className='field-row'>
                <button className='button primary' disabled={loading} onClick={() => runAction('tracker', 'Applications', () => apiRequest('/api/v1/tracker/', { token }))}>
                    Load Applications
                </button>
                <button className='button' disabled={loading} onClick={() => runAction('tracker', 'Stats', () => apiRequest('/api/v1/tracker/stats', { token }))}>
                    View Stats
                </button>
            </div>

            <div className='section-divider' />
            <p className='muted' style={{ fontSize: 13 }}>Track a new application:</p>
            <div className='field-row'>
                <input className='input' value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder='Company' />
                <input className='input' value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder='Role' />
                <select className='select' value={status} onChange={(e) => setStatus(e.target.value)} style={{ flex: '0 1 140px' }}>
                    <option value='Applied'>Applied</option>
                    <option value='Interview'>Interview</option>
                    <option value='Offer'>Offer</option>
                    <option value='Rejected'>Rejected</option>
                </select>
                <button
                    className='button primary'
                    disabled={loading || !companyName || !roleName}
                    onClick={() =>
                        runAction('tracker', 'Add Application', () =>
                            apiRequest('/api/v1/tracker/', {
                                method: 'POST', token,
                                body: { company: companyName, role: roleName, url: '', notes: `Status: ${status}` },
                            })
                        )
                    }
                >
                    Add
                </button>
            </div>

            <div className='section-divider' />
            <p className='muted' style={{ fontSize: 13 }}>Update application status:</p>
            <div className='field-row'>
                <input className='input' value={updateIdentifier} onChange={(e) => setUpdateIdentifier(e.target.value)} placeholder='Application ID (preferred) or Company' style={{ flex: '0 1 280px' }} />
                <select className='select' value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={{ flex: '0 1 140px' }}>
                    <option value='Interview'>Interview</option>
                    <option value='Offer'>Offer</option>
                    <option value='Rejected'>Rejected</option>
                </select>
                <button
                    className='button'
                    disabled={loading || !updateIdentifier}
                    onClick={() =>
                        runAction('tracker', 'Update Status', () =>
                            apiRequest(`/api/v1/tracker/${encodeURIComponent(updateIdentifier)}`, { method: 'PATCH', token, body: { status: newStatus } })
                        )
                    }
                >
                    Update
                </button>
            </div>

            {results.length === 0 ? (
                <div className='empty-state'>
                    <div className='empty-icon'>📊</div>
                    <p>Load your applications to see the tracker board</p>
                </div>
            ) : (
                results.map((entry) => (
                    <div key={`${entry.label}_${entry.at}`}>
                        <div className='result-head'>
                            <h4>{entry.label}</h4>
                            <span className='muted' style={{ fontSize: 11 }}>{new Date(entry.at).toLocaleTimeString()}</span>
                        </div>
                        {renderTrackerData(entry.data) || (
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
