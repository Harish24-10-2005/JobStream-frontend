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

const str = (v: unknown) => (v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v))
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {})

/* ── Person Card ── */
function PersonCard({ person }: { person: Record<string, unknown> }) {
    const [expanded, setExpanded] = useState(false)
    const name = str(person.name || person.full_name)
    const title = str(person.title || person.role || person.position)
    const company = str(person.company || person.current_company)
    const category = str(person.category || person.connection_type || '')
    const connectionStrength = str(person.connection_strength || person.relevance_score || '')
    const outreach = str(person.outreach_message || person.suggested_outreach || '')
    const reason = str(person.reason || person.why_relevant || '')

    const categoryColors: Record<string, string> = {
        alumni: 'var(--blue)',
        recruiter: 'var(--green)',
        employee: 'var(--accent)',
        mutual: 'var(--purple)',
        hiring_manager: 'var(--yellow)',
    }
    const catColor = categoryColors[category.toLowerCase().replace(/\s+/g, '_')] || 'var(--text-2)'

    return (
        <div className='dossier-item' style={{ borderLeft: `3px solid ${catColor}`, padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `color-mix(in srgb, ${catColor} 18%, transparent)`, border: `1px solid color-mix(in srgb, ${catColor} 30%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700, color: catColor, flexShrink: 0 }}>
                            {name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '14px' }}>{name}</div>
                            {title && <div style={{ color: 'var(--muted)', fontSize: '12px' }}>{title}{company ? ` at ${company}` : ''}</div>}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                    {category && <span className='pill' style={{ background: `color-mix(in srgb, ${catColor} 10%, transparent)`, color: catColor, border: `1px solid color-mix(in srgb, ${catColor} 25%, transparent)`, fontSize: '10px', textTransform: 'capitalize' }}>{category.replace(/_/g, ' ')}</span>}
                    {connectionStrength && <span className='pill accent' style={{ fontSize: '10px' }}>{connectionStrength}</span>}
                </div>
            </div>

            {reason && <p style={{ margin: '10px 0 0', fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.55 }}>💡 {reason}</p>}

            {outreach && (
                <div style={{ marginTop: '12px' }}>
                    <button onClick={() => setExpanded(!expanded)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-soft)', fontSize: '12px', fontWeight: 600, padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {expanded ? '▾' : '▸'} Outreach Template
                    </button>
                    {expanded && (
                        <div style={{ marginTop: '8px', background: 'rgba(255, 138, 31, .04)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', fontSize: '12.5px', lineHeight: 1.65, color: 'var(--text-2)', whiteSpace: 'pre-wrap', animation: 'slideDownFade .3s ease-out' }}>
                            {outreach}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

/* ── Connection Results ── */
function ConnectionResults({ data }: { data: unknown }) {
    const d = obj(data)
    const connections = arr(d.connections || d.results || d.people || d.network_contacts || data) as Array<Record<string, unknown>>

    if (connections.length === 0) {
        return (
            <div className='empty-state' style={{ padding: '32px' }}>
                <div className='empty-icon'>🔗</div>
                <p>No connections found. Try adjusting your search parameters.</p>
            </div>
        )
    }

    // Group by category
    const grouped: Record<string, Array<Record<string, unknown>>> = {}
    connections.forEach(c => {
        const cat = str(c.category || c.connection_type || 'Other')
        if (!grouped[cat]) grouped[cat] = []
        grouped[cat].push(c)
    })

    const totalCount = connections.length
    const summary = str(d.summary || d.search_summary || '')

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Summary banner */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius)', padding: '14px 18px' }}>
                <div style={{ fontSize: '24px' }}>🤝</div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>Found {totalCount} connection{totalCount !== 1 ? 's' : ''}</div>
                    {summary && <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-2)' }}>{summary}</p>}
                </div>
            </div>

            {/* Grouped connections */}
            {Object.entries(grouped).map(([category, people]) => (
                <div key={category}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--muted)', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {category.replace(/_/g, ' ')}
                        <span style={{ background: 'var(--surface-2)', padding: '2px 8px', borderRadius: '99px', fontSize: '10px' }}>{people.length}</span>
                    </div>
                    <div className='result-stack'>
                        {people.map((p, i) => <PersonCard key={i} person={p} />)}
                    </div>
                </div>
            ))}
        </div>
    )
}

/* ════════════════════════════════
   Main Export
   ════════════════════════════════ */
export function NetworkPanel({ token, companyName, setCompanyName, roleName, setRoleName, loading, runAction, results }: NetworkPanelProps) {
    const [includeAlumni, setIncludeAlumni] = useState(true)
    const [includeLocation, setIncludeLocation] = useState(false)
    const [includePast, setIncludePast] = useState(false)
    const [generateOutreach, setGenerateOutreach] = useState(true)
    const [maxPerCategory, setMaxPerCategory] = useState(5)

    return (
        <div className='action-grid' style={{ gap: '24px' }}>
            <div className='section-header'>
                <h3>🤝 Smart Referral Finder</h3>
                <p className='muted' style={{ margin: '4px 0 0', fontSize: '14px' }}>Find warm connections, generate personalized outreach, and navigate the hidden job market.</p>
            </div>

            {/* Target inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className='form-field'>
                    <label>Target Company *</label>
                    <input className='input' value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder='e.g. Google, Meta, Stripe' />
                </div>
                <div className='form-field'>
                    <label>Target Role</label>
                    <input className='input' value={roleName} onChange={e => setRoleName(e.target.value)} placeholder='e.g. Senior Backend Engineer' />
                </div>
            </div>

            {/* Options panel */}
            <div className='panel-surface' style={{ padding: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>Search Options</div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px 24px' }}>
                    <label className='toggle-row' onClick={() => setIncludeAlumni(!includeAlumni)}>
                        <div className={`toggle-switch ${includeAlumni ? 'on' : ''}`} />
                        Include Alumni
                    </label>
                    <label className='toggle-row' onClick={() => setIncludeLocation(!includeLocation)}>
                        <div className={`toggle-switch ${includeLocation ? 'on' : ''}`} />
                        Include Location
                    </label>
                    <label className='toggle-row' onClick={() => setIncludePast(!includePast)}>
                        <div className={`toggle-switch ${includePast ? 'on' : ''}`} />
                        Past Companies
                    </label>
                    <label className='toggle-row' onClick={() => setGenerateOutreach(!generateOutreach)}>
                        <div className={`toggle-switch ${generateOutreach ? 'on' : ''}`} />
                        Generate Outreach
                    </label>
                </div>

                <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '10px' }}>Max Per Category</div>
                    <div className='range-row'>
                        <input type='range' min={1} max={20} value={maxPerCategory} onChange={e => setMaxPerCategory(Number(e.target.value))} />
                        <span className='range-value'>{maxPerCategory}</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <button
                className='button primary'
                disabled={loading || !companyName}
                onClick={() =>
                    runAction('network', 'Find Connections', () =>
                        apiRequest('/api/v1/network/find-connections', {
                            method: 'POST', token,
                            body: {
                                company: companyName,
                                role: roleName || undefined,
                                include_alumni: includeAlumni,
                                include_location: includeLocation,
                                include_past_companies: includePast,
                                generate_outreach: generateOutreach,
                                max_per_category: maxPerCategory,
                            }
                        })
                    )
                }
                style={{ padding: '12px' }}
            >
                🔍 Find Connections
            </button>

            {/* Results */}
            {results.length === 0 ? (
                <div className='empty-state'>
                    <div className='empty-icon'>🌐</div>
                    <p>Enter a company name to discover warm connections and insider referral paths.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {results.map((entry) => (
                        <div key={`${entry.label}_${entry.at}`} style={{ animation: 'slideDownFade 0.4s ease-out' }}>
                            <div className='result-head'>
                                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: entry.label.startsWith('ERROR') ? 'var(--red)' : 'var(--green)' }} />
                                    {entry.label}
                                </h4>
                                <span className='muted' style={{ fontSize: 11 }}>{new Date(entry.at).toLocaleTimeString()}</span>
                            </div>
                            <ConnectionResults data={entry.data} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
