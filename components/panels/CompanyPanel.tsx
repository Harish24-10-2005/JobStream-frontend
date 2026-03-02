'use client'

import { useState } from 'react'
import { apiRequest, ApiResponse } from '@/lib/api-client'

type CompanyPanelProps = {
    token: string
    companyName: string
    setCompanyName: (v: string) => void
    loading: boolean
    runAction: <T>(target: string, label: string, fn: () => Promise<ApiResponse<T>>) => void
    results: Array<{ label: string; data: unknown; at: string }>
}

function renderDossier(data: unknown) {
    if (!data || typeof data !== 'object') return null
    const obj = data as Record<string, unknown>
    const tabs = ['Overview', 'Culture', 'Red Flags', 'Interview Tips']
    return <DossierView data={obj} tabs={tabs} />
}

function DossierView({ data, tabs }: { data: Record<string, unknown>; tabs: string[] }) {
    const [activeTab, setActiveTab] = useState(0)
    const tabKeys = ['overview', 'culture', 'red_flags', 'interview_tips']

    const renderSection = (key: string) => {
        const val = data[key]
        if (Array.isArray(val)) {
            return (
                <div className='result-stack' style={{ marginTop: '16px' }}>
                    {val.map((item, i) => (
                        <div key={i} className='dossier-item' style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderLeft: '4px solid var(--accent)', borderRadius: '0 8px 8px 0', marginBottom: '12px' }}>
                            {typeof item === 'object' && item !== null ? (
                                <>
                                    <h5 style={{ margin: '0 0 8px 0', fontSize: '15px', color: 'var(--text-bright)' }}>
                                        {(item as Record<string, string>).title || (item as Record<string, string>).name || `Point ${i + 1}`}
                                    </h5>
                                    <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)' }}>
                                        {(item as Record<string, string>).description || (item as Record<string, string>).text || JSON.stringify(item)}
                                    </p>
                                </>
                            ) : (
                                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6 }}>{String(item)}</p>
                            )}
                        </div>
                    ))}
                </div>
            )
        }
        if (typeof val === 'string') {
            return (
                <div className='dossier-item' style={{ marginTop: '16px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    <p style={{ margin: 0, lineHeight: 1.6, fontSize: '14px' }}>{val}</p>
                </div>
            )
        }
        if (typeof val === 'object' && val !== null) {
            return (
                <div className='result-metrics' style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                    {Object.entries(val as Record<string, unknown>).map(([k, v]) => (
                        <div key={k} className='metric' style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                {k.replace(/_/g, ' ')}
                            </span>
                            <p style={{ margin: 0, fontSize: '15px', fontWeight: 500, color: '#fff' }}>
                                {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                            </p>
                        </div>
                    ))}
                </div>
            )
        }
        return <p className='muted' style={{ marginTop: '16px' }}>No specific data categorized for this section.</p>
    }

    return (
        <div className='result-card' style={{ border: 'none', background: 'var(--surface)', padding: '24px', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent), var(--blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    🏢
                </div>
                <div>
                    <h4 style={{ margin: 0, fontSize: '20px' }}>{String(data.company_name || 'Company Profile')}</h4>
                    {!!data.industry && <span className='muted' style={{ fontSize: '13px' }}>{String(data.industry)}</span>}
                </div>
            </div>

            <div className='dossier-tabs' style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', overflowX: 'auto' }}>
                {tabs.map((tab, i) => (
                    <button
                        key={tab}
                        className={`dossier-tab ${i === activeTab ? 'active' : ''}`}
                        onClick={() => setActiveTab(i)}
                        style={{
                            background: i === activeTab ? 'var(--accent)' : 'transparent',
                            color: i === activeTab ? '#fff' : 'var(--text-muted)',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className='dossier-section' style={{ minHeight: '150px' }}>
                {renderSection(tabKeys[activeTab])}
            </div>

            <details className='details-block' style={{ marginTop: '24px', background: 'rgba(0,0,0,0.3)' }}>
                <summary style={{ fontSize: '12px', opacity: 0.7 }}>View Raw JSON</summary>
                <pre className='code-block' style={{ fontSize: '11px' }}>{JSON.stringify(data, null, 2)}</pre>
            </details>
        </div>
    )
}

export function CompanyPanel({ token, companyName, setCompanyName, loading, runAction, results }: CompanyPanelProps) {
    const [role, setRole] = useState('')
    const [jobDesc, setJobDesc] = useState('')

    return (
        <div className='action-grid' style={{ gap: '24px' }}>
            <div className='section-header'>
                <h3>🏢 Deep Company Intel</h3>
                <p className='muted' style={{ margin: '4px 0 0', fontSize: '14px' }}>Analyze company culture, red flags, and tailored interview tips.</p>
            </div>

            <div className='field-row' style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr)', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Target Company *</label>
                    <input className='input' value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder='e.g. Google, Stripe, Airbnb' />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Target Role</label>
                    <input className='input' value={role} onChange={(e) => setRole(e.target.value)} placeholder='e.g. Senior Frontend Engineer' />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Job Description (Optional)</label>
                <textarea
                    className='input'
                    style={{ minHeight: '80px', resize: 'vertical' }}
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    placeholder='Paste the job description to get highly tailored red flags and interview tips...'
                />
            </div>

            <div className='field-row' style={{ marginTop: '8px' }}>
                <button
                    className='button primary'
                    disabled={loading || !companyName}
                    onClick={() =>
                        runAction('company', 'Company Research', () =>
                            apiRequest('/api/v1/company/research', {
                                method: 'POST', token,
                                body: { company: companyName, role: role || undefined, job_description: jobDesc || undefined }
                            })
                        )
                    }
                    style={{ flex: 1, padding: '12px' }}
                >
                    Research Company
                </button>
                <button
                    className='button'
                    disabled={loading || !companyName}
                    onClick={() =>
                        runAction('company', 'PDF Dossier', () =>
                            apiRequest('/api/v1/company/generate-dossier', {
                                method: 'POST', token,
                                body: { company: companyName, role: role || undefined, job_description: jobDesc || undefined }
                            })
                        )
                    }
                    style={{ flex: 1, padding: '12px' }}
                >
                    Generate PDF Report
                </button>
            </div>

            {results.length === 0 ? (
                <div className='empty-state' style={{ padding: '48px 24px' }}>
                    <div className='empty-icon' style={{ opacity: 0.5, transform: 'scale(1.2)' }}>🏢</div>
                    <p style={{ marginTop: '16px', fontSize: '15px' }}>Enter a company name to generate a deep-dive intelligence dossier.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '16px' }}>
                    {results.map((entry) => (
                        <div key={`${entry.label}_${entry.at}`} style={{ animation: 'slideDownFade 0.4s ease-out' }}>
                            <div className='result-head' style={{ marginBottom: '16px' }}>
                                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }}></span>
                                    {entry.label}
                                </h4>
                                <span className='muted' style={{ fontSize: 11 }}>{new Date(entry.at).toLocaleTimeString()}</span>
                            </div>
                            {renderDossier(entry.data) || (
                                <details className='details-block' open>
                                    <summary>View Raw Response</summary>
                                    <pre className='code-block'>{JSON.stringify(entry.data, null, 2)}</pre>
                                </details>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
