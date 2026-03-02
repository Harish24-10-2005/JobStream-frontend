'use client'

import { useState } from 'react'
import { apiRequest, ApiResponse } from '@/lib/api-client'

type NetworkPanelProps = {
    token: string
    companyName: string
    setCompanyName: (v: string) => void
    roleName: string
    setRoleName: (v: string) => void
    loading: boolean
    runAction: <T>(target: string, label: string, fn: () => Promise<ApiResponse<T>>) => void
    results: Array<{ label: string; data: unknown; at: string }>
}

function renderConnections(data: unknown) {
    if (!data || typeof data !== 'object') return null
    const obj = data as Record<string, unknown>
    const result = typeof obj.result === 'object' && obj.result !== null ? obj.result as Record<string, unknown> : null

    const fromNetworkResult = result
        ? [
            ...(Array.isArray(result.alumni_matches) ? result.alumni_matches : []),
            ...(Array.isArray(result.location_matches) ? result.location_matches : []),
            ...(Array.isArray(result.company_matches) ? result.company_matches : []),
        ] as Array<Record<string, unknown>>
        : []

    const profiles = fromNetworkResult.length > 0
        ? fromNetworkResult
        : Array.isArray(obj.profiles) ? obj.profiles as Array<Record<string, unknown>>
            : Array.isArray(obj.connections) ? obj.connections as Array<Record<string, unknown>>
                : []

    if (profiles.length === 0) return null

    return (
        <div className='result-stack' style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', marginTop: '16px' }}>
            {profiles.map((p, i) => {
                const name = String(p.name || p.full_name || `Connection ${i + 1}`)
                const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
                const roleText = String(p.title || p.role || p.headline || '')
                const companyText = p.company || p.company_match
                const linkedinUrl = p.linkedin_url || p.profile_url
                const outreach = p.outreach_message || p.outreach_draft

                // Color coding tags
                const tagColor = p.category === 'alumni' ? 'var(--blue)' : p.category === 'location' ? 'var(--green)' : 'var(--accent)'

                return (
                    <div key={i} className='person-card' style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                        <div className='person-card-row' style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div className='person-card-avatar' style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${tagColor}, rgba(255,255,255,0.1))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                                {initials}
                            </div>
                            <div>
                                <div className='person-card-name' style={{ fontWeight: 600, fontSize: '16px', color: '#fff' }}>{name}</div>
                                <div className='person-card-role' style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                                    {roleText}{companyText ? <span> - <strong style={{ color: 'var(--text-bright)' }}>{String(companyText)}</strong></span> : ''}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
                            {!!p.category && <span className='chip' style={{ background: `${tagColor}22`, color: tagColor, border: `1px solid ${tagColor}44`, padding: '4px 10px', borderRadius: '12px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>{String(p.category)}</span>}
                            {!!p.connection_type && <span className='chip' style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px' }}>{String(p.connection_type)}</span>}
                            {!!p.experience_years && <span className='chip' style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px' }}>{String(p.experience_years)}y exp</span>}
                            {!!linkedinUrl && (
                                <a href={String(linkedinUrl)} target='_blank' rel='noreferrer' className='chip' style={{ color: '#0a66c2', background: 'rgba(10, 102, 194, 0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }}>
                                    LinkedIn ↗
                                </a>
                            )}
                        </div>
                        {!!outreach && (
                            <div className='outreach-preview' style={{ marginTop: '20px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', borderLeft: '3px solid var(--accent)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--accent)', fontWeight: 600 }}>Suggested Outreach</span>
                                    <button onClick={() => navigator.clipboard.writeText(String(outreach))} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}>📋 Copy</button>
                                </div>
                                <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: 'var(--text-bright)', whiteSpace: 'pre-wrap' }}>&quot;{String(outreach)}&quot;</p>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

export function NetworkPanel({ token, companyName, setCompanyName, roleName, setRoleName, loading, runAction, results }: NetworkPanelProps) {
    const [alumni, setAlumni] = useState(true)
    const [location, setLocation] = useState(true)
    const [pastCompanies, setPastCompanies] = useState(true)
    const [generateOutreach, setGenerateOutreach] = useState(true)
    const [maxResults, setMaxResults] = useState(5)

    return (
        <div className='action-grid' style={{ gap: '24px' }}>
            <div className='section-header'>
                <h3>🤝 Referral Connections</h3>
                <p className='muted' style={{ margin: '4px 0 0', fontSize: '14px' }}>Find strategic internal connections and generate hyper-personalized outreach messages.</p>
            </div>

            <div className='field-row' style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr)', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Target Company *</label>
                    <input className='input' value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder='e.g. OpenAI' />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Your Target Title</label>
                    <input className='input' value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder='e.g. Product Manager' />
                </div>
            </div>

            {/* Customization Options */}
            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h5 style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-bright)' }}>Search Filters</h5>

                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                        <input type="checkbox" checked={alumni} onChange={(e) => setAlumni(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
                        University Alumni
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                        <input type="checkbox" checked={location} onChange={(e) => setLocation(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
                        Same Location
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                        <input type="checkbox" checked={pastCompanies} onChange={(e) => setPastCompanies(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
                        Past Colleagues
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                        <input type="checkbox" checked={generateOutreach} onChange={(e) => setGenerateOutreach(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
                        Generate Outreach
                    </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <label style={{ fontSize: '13px', width: '150px' }}>Max Results / Category:</label>
                    <input type="range" min="1" max="10" value={maxResults} onChange={(e) => setMaxResults(parseInt(e.target.value))} style={{ flex: 1, accentColor: 'var(--accent)' }} />
                    <span style={{ fontSize: '14px', fontWeight: 'bold', width: '20px', textAlign: 'right' }}>{maxResults}</span>
                </div>
            </div>

            <div className='field-row'>
                <button
                    className='button primary'
                    disabled={loading || !companyName}
                    onClick={() =>
                        runAction('network', 'Find Connections', () =>
                            apiRequest('/api/v1/network/find-connections', {
                                method: 'POST', token,
                                body: {
                                    company: companyName,
                                    include_alumni: alumni,
                                    include_location: location,
                                    include_past_companies: pastCompanies,
                                    generate_outreach: generateOutreach,
                                    max_per_category: maxResults
                                },
                            })
                        )
                    }
                    style={{ flex: 1, padding: '12px', fontSize: '15px' }}
                >
                    Find Referrals
                </button>
            </div>

            {results.length === 0 ? (
                <div className='empty-state' style={{ padding: '48px 24px' }}>
                    <div className='empty-icon' style={{ opacity: 0.5, transform: 'scale(1.2)' }}>🤝</div>
                    <p style={{ marginTop: '16px', fontSize: '15px' }}>Search for warm connections to request referrals.</p>
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
                            {renderConnections(entry.data) || (
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
