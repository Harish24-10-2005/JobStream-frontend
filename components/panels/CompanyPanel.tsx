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

/* ─────── helpers ──────── */
const str = (v: unknown): string => (v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v))
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {})

/* ─────── Chip list (for arrays of primitives like tech_stack, values, products) ──────── */
function ChipList({ items, color }: { items: unknown[]; color?: string }) {
    if (!items.length) return null
    const c = color || 'var(--accent)'
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {items.map((item, i) => (
                <span key={i} className='chip' style={{ background: `color-mix(in srgb, ${c} 12%, transparent)`, color: c, border: `1px solid color-mix(in srgb, ${c} 25%, transparent)` }}>
                    {str(item)}
                </span>
            ))}
        </div>
    )
}

/* ─────── Stat card  ──────── */
function StatCard({ label, value, icon }: { label: string; value: string; icon?: string }) {
    return (
        <div className='metric'>
            <span>{icon ? `${icon} ` : ''}{label}</span>
            <p>{value || '—'}</p>
        </div>
    )
}

/* ─────── Red flag card ──────── */
function FlagCard({ flag }: { flag: Record<string, unknown> }) {
    const severity = str(flag.severity).toLowerCase()
    const sColor = severity === 'high' ? 'var(--red)' : severity === 'medium' ? 'var(--yellow)' : 'var(--green)'
    return (
        <div className='dossier-item' style={{ borderLeft: `3px solid ${sColor}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <h5 style={{ margin: 0, fontSize: '14px' }}>{str(flag.flag)}</h5>
                <span className='pill' style={{ background: `color-mix(in srgb, ${sColor} 12%, transparent)`, color: sColor, border: `1px solid color-mix(in srgb, ${sColor} 30%, transparent)` }}>
                    {severity}
                </span>
            </div>
            {flag.how_to_verify ? <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: 'var(--text-2)' }}>🔍 {str(flag.how_to_verify)}</p> : null}
            {flag.what_to_ask ? <p style={{ margin: '4px 0 0', fontSize: '13px', lineHeight: 1.6, color: 'var(--text-2)' }}>💬 {str(flag.what_to_ask)}</p> : null}
        </div>
    )
}

/* ════════════════════════════════
   Tab‑based Dossier View
   ════════════════════════════════ */
type TabDef = { key: string; label: string; icon: string }
const TABS: TabDef[] = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'culture', label: 'Culture', icon: '🏠' },
    { key: 'redflags', label: 'Red Flags', icon: '🚩' },
    { key: 'interview', label: 'Interview Intel', icon: '🎯' },
]

function DossierView({ data }: { data: Record<string, unknown> }) {
    const [tab, setTab] = useState(0)

    // The backend returns: company_info, culture_analysis, red_flags, interview_insights
    const info = obj(data.company_info) || obj(data)
    const culture = obj(data.culture_analysis)
    const flags = obj(data.red_flags)
    const insights = obj(data.interview_insights)

    const companyName = str(info.company_name || data.company || data.company_name || '')
    const industry = str(info.industry || data.industry || '')

    const renderOverview = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Stat grid */}
            <div className='result-metrics'>
                <StatCard label='Industry' value={industry} icon='🏭' />
                <StatCard label='Size' value={str(info.size)} icon='👥' />
                <StatCard label='Founded' value={str(info.founded)} icon='📅' />
                <StatCard label='HQ' value={str(info.headquarters)} icon='📍' />
                <StatCard label='Employees' value={str(info.employee_count)} icon='🧑‍💼' />
            </div>

            {/* Mission */}
            {info.mission ? (
                <div className='dossier-item' style={{ borderLeft: '3px solid var(--accent)' }}>
                    <h5 style={{ color: 'var(--accent)', margin: '0 0 6px' }}>Mission</h5>
                    <p style={{ margin: 0, lineHeight: 1.7, fontSize: '13.5px' }}>{str(info.mission)}</p>
                </div>
            ) : null}

            {/* Values */}
            {arr(info.values).length > 0 && (
                <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--muted)', fontWeight: 700, marginBottom: '10px' }}>Core Values</div>
                    <ChipList items={arr(info.values)} color='var(--purple)' />
                </div>
            )}

            {/* Tech Stack */}
            {arr(info.tech_stack).length > 0 && (
                <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--muted)', fontWeight: 700, marginBottom: '10px' }}>Tech Stack</div>
                    <ChipList items={arr(info.tech_stack)} color='var(--blue)' />
                </div>
            )}

            {/* Products / Competitors */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {arr(info.products).length > 0 && (
                    <div>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--muted)', fontWeight: 700, marginBottom: '10px' }}>Products</div>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.8 }}>
                            {arr(info.products).map((p, i) => <li key={i}>{str(p)}</li>)}
                        </ul>
                    </div>
                )}
                {arr(info.competitors).length > 0 && (
                    <div>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--muted)', fontWeight: 700, marginBottom: '10px' }}>Competitors</div>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.8 }}>
                            {arr(info.competitors).map((c, i) => <li key={i}>{str(c)}</li>)}
                        </ul>
                    </div>
                )}
            </div>

            {/* Recent News */}
            {arr(info.recent_news).length > 0 && (
                <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--muted)', fontWeight: 700, marginBottom: '10px' }}>📰 Recent News</div>
                    <div className='result-stack'>
                        {arr(info.recent_news).map((n, i) => (
                            <div key={i} className='dossier-item' style={{ padding: '12px 14px' }}>
                                <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6 }}>{str(n)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )

    const renderCulture = () => {
        const wlb = obj(culture.work_life_balance)
        const growth = obj(culture.growth_opportunities)
        const eng = obj(culture.engineering_culture)

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Rating strip */}
                <div className='result-metrics'>
                    <StatCard label='Culture Type' value={str(culture.culture_type)} icon='🏢' />
                    <StatCard label='Work-Life Balance' value={str(wlb.rating)} icon='⚖️' />
                    <StatCard label='Growth' value={str(growth.rating)} icon='📈' />
                    <StatCard label='Management' value={str(culture.management_style)} icon='👔' />
                    <StatCard label='Remote' value={str(culture.remote_policy)} icon='🌍' />
                    {culture.glassdoor_style_rating ? <StatCard label='Rating' value={`${str(culture.glassdoor_style_rating)} / 5`} icon='⭐' /> : null}
                </div>

                {/* WLB notes */}
                {wlb.notes ? (
                    <div className='dossier-item' style={{ borderLeft: '3px solid var(--blue)' }}>
                        <h5 style={{ color: 'var(--blue)', margin: '0 0 6px' }}>Work-Life Balance</h5>
                        <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6 }}>{str(wlb.notes)}</p>
                    </div>
                ) : null}

                {/* Engineering culture */}
                {Object.keys(eng).length > 0 && (
                    <div>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--muted)', fontWeight: 700, marginBottom: '10px' }}>Engineering Culture</div>
                        <div className='result-metrics'>
                            {Object.entries(eng).map(([k, v]) => (
                                <StatCard key={k} label={k.replace(/_/g, ' ')} value={typeof v === 'boolean' ? (v ? '✅ Yes' : '❌ No') : str(v)} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Pros & Cons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {arr(culture.pros).length > 0 && (
                        <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 'var(--radius)', padding: '16px' }}>
                            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--green)', fontWeight: 700, marginBottom: '10px' }}>✅ Pros</div>
                            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.8 }}>
                                {arr(culture.pros).map((p, i) => <li key={i}>{str(p)}</li>)}
                            </ul>
                        </div>
                    )}
                    {arr(culture.cons).length > 0 && (
                        <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 'var(--radius)', padding: '16px' }}>
                            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--red)', fontWeight: 700, marginBottom: '10px' }}>⚠️ Cons</div>
                            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.8 }}>
                                {arr(culture.cons).map((c, i) => <li key={i}>{str(c)}</li>)}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Best for */}
                {culture.best_for ? (
                    <div className='dossier-item' style={{ borderLeft: '3px solid var(--purple)' }}>
                        <h5 style={{ color: 'var(--purple)', margin: '0 0 6px' }}>Best For</h5>
                        <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6 }}>{str(culture.best_for)}</p>
                    </div>
                ) : null}
            </div>
        )
    }

    const renderRedFlags = () => {
        const companyFlags = arr(flags.company_red_flags) as Array<Record<string, unknown>>
        const jobFlags = arr(flags.job_posting_red_flags) as Array<Record<string, unknown>>
        const riskLevel = str(flags.overall_risk_level).toLowerCase()
        const riskColor = riskLevel === 'high' ? 'var(--red)' : riskLevel === 'medium' ? 'var(--yellow)' : 'var(--green)'

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Risk banner */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: `color-mix(in srgb, ${riskColor} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${riskColor} 25%, transparent)`, borderRadius: 'var(--radius)', padding: '16px 20px' }}>
                    <div style={{ fontSize: '28px' }}>{riskLevel === 'high' ? '🔴' : riskLevel === 'medium' ? '🟡' : '🟢'}</div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '15px', textTransform: 'capitalize', color: riskColor }}>{riskLevel || 'Unknown'} Risk</div>
                        {flags.recommendation ? <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-2)' }}>{str(flags.recommendation)}</p> : null}
                    </div>
                </div>

                {/* Company flags */}
                {companyFlags.length > 0 && (
                    <div>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--muted)', fontWeight: 700, marginBottom: '10px' }}>Company Red Flags</div>
                        <div className='result-stack'>
                            {companyFlags.map((f, i) => <FlagCard key={i} flag={f} />)}
                        </div>
                    </div>
                )}

                {/* Job posting flags */}
                {jobFlags.length > 0 && (
                    <div>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--muted)', fontWeight: 700, marginBottom: '10px' }}>Job Posting Red Flags</div>
                        <div className='result-stack'>
                            {jobFlags.map((f, i) => <FlagCard key={i} flag={f} />)}
                        </div>
                    </div>
                )}

                {/* Questions to ask and research */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {arr(flags.questions_to_ask_in_interview).length > 0 && (
                        <div>
                            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--muted)', fontWeight: 700, marginBottom: '10px' }}>💬 Questions to Ask</div>
                            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.8 }}>
                                {arr(flags.questions_to_ask_in_interview).map((q, i) => <li key={i}>{str(q)}</li>)}
                            </ul>
                        </div>
                    )}
                    {arr(flags.things_to_research).length > 0 && (
                        <div>
                            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--muted)', fontWeight: 700, marginBottom: '10px' }}>🔎 Things to Research</div>
                            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.8 }}>
                                {arr(flags.things_to_research).map((t, i) => <li key={i}>{str(t)}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    const renderInterview = () => {
        const process = obj(insights.interview_process)
        const tips = arr(insights.tips_from_candidates)
        const questions = arr(info.questions_to_ask || insights.questions_to_ask)
        const commonQs = arr(insights.common_questions)
        const resources = arr(insights.practice_resources) as Array<Record<string, unknown>>

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Process card */}
                {Object.keys(process).length > 0 && (
                    <div className='result-metrics'>
                        {process.duration ? <StatCard label='Duration' value={str(process.duration)} icon='⏱️' /> : null}
                        {process.difficulty ? <StatCard label='Difficulty' value={str(process.difficulty)} icon='📐' /> : null}
                        {process.rounds ? <StatCard label='Rounds' value={str(process.rounds)} icon='🔁' /> : null}
                        {insights.what_they_look_for ? <StatCard label='They Look For' value={str(insights.what_they_look_for)} icon='🔍' /> : null}
                    </div>
                )}

                {/* Interview tips */}
                {tips.length > 0 && (
                    <div>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--muted)', fontWeight: 700, marginBottom: '10px' }}>💡 Insider Tips</div>
                        <div className='result-stack'>
                            {tips.map((tip, i) => (
                                <div key={i} className='dossier-item' style={{ borderLeft: '3px solid var(--accent)', padding: '12px 16px' }}>
                                    <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6 }}>{str(tip)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Common questions from this company */}
                {commonQs.length > 0 && (
                    <div>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--muted)', fontWeight: 700, marginBottom: '10px' }}>❓ Common Questions</div>
                        <div className='result-stack'>
                            {commonQs.map((q, i) => (
                                <div key={i} className='qa-item'>
                                    <div className='question'>{typeof q === 'object' ? str((q as Record<string, unknown>).question || q) : str(q)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Questions YOU should ask them */}
                {questions.length > 0 && (
                    <div style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius)', padding: '16px' }}>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--accent)', fontWeight: 700, marginBottom: '10px' }}>🙋 Questions to Ask Them</div>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.8 }}>
                            {questions.map((q, i) => <li key={i}>{str(q)}</li>)}
                        </ul>
                    </div>
                )}

                {/* Practice resources */}
                {resources.length > 0 && (
                    <div>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--muted)', fontWeight: 700, marginBottom: '10px' }}>📚 Practice Resources</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                            {resources.map((r, i) => (
                                <a key={i} href={str(r.url)} target='_blank' rel='noreferrer' className='dossier-item' style={{ textDecoration: 'none', cursor: 'pointer' }}>
                                    <h5 style={{ margin: '0 0 4px', color: 'var(--blue)' }}>{str(r.name)}</h5>
                                    {r.description ? <p style={{ fontSize: '12px', margin: 0, lineHeight: 1.5 }}>{str(r.description)}</p> : null}
                                    {r.difficulty ? <span className='pill' style={{ marginTop: '8px', fontSize: '10px' }}>{str(r.difficulty)}</span> : null}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    const tabRenderers = [renderOverview, renderCulture, renderRedFlags, renderInterview]
    const activeRenderer = tabRenderers[tab] || tabRenderers[0]

    return (
        <div className='result-card' style={{ border: 'none', background: 'var(--surface)', padding: '28px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent), var(--accent-soft))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 4px 16px rgba(255, 138, 31, 0.2)' }}>
                    🏢
                </div>
                <div>
                    <h4 style={{ margin: 0, fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>{companyName || 'Company Profile'}</h4>
                    {industry && <span style={{ color: 'var(--muted)', fontSize: '13px' }}>{industry}</span>}
                </div>
            </div>

            {/* Tabs */}
            <div className='dossier-tabs' style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', overflowX: 'auto', marginBottom: '20px' }}>
                {TABS.map((t, i) => (
                    <button
                        key={t.key}
                        className={`dossier-tab ${i === tab ? 'active' : ''}`}
                        onClick={() => setTab(i)}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className='dossier-section' style={{ minHeight: '200px' }}>
                {activeRenderer()}
            </div>

            {/* Raw JSON fallback */}
            <details className='details-block' style={{ marginTop: '24px', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
                <summary style={{ fontSize: '12px', opacity: 0.6, cursor: 'pointer' }}>View Raw JSON</summary>
                <pre className='code-block' style={{ fontSize: '11px' }}>{JSON.stringify(data, null, 2)}</pre>
            </details>
        </div>
    )
}

/* ════════════════════════════════
   Attempt dossier render
   ════════════════════════════════ */
function renderDossier(data: unknown) {
    if (!data || typeof data !== 'object') return null
    const d = data as Record<string, unknown>
    // Check for known company agent response shape
    if (d.company_info || d.culture_analysis || d.red_flags || d.interview_insights || d.company_name || d.industry || d.mission) {
        return <DossierView data={d} />
    }
    // Nested under `result`  
    if (d.result && typeof d.result === 'object') {
        const r = d.result as Record<string, unknown>
        if (r.company_info || r.culture_analysis || r.company_name) {
            return <DossierView data={r} />
        }
    }
    return null
}

/* ════════════════════════════════
   Main Panel Export
   ════════════════════════════════ */
export function CompanyPanel({ token, companyName, setCompanyName, loading, runAction, results }: CompanyPanelProps) {
    const [role, setRole] = useState('')
    const [jobDesc, setJobDesc] = useState('')

    return (
        <div className='action-grid' style={{ gap: '24px' }}>
            <div className='section-header'>
                <h3>🏢 Deep Company Intel</h3>
                <p className='muted' style={{ margin: '4px 0 0', fontSize: '14px' }}>Analyze company culture, red flags, interview process, and tailored tips with live web research.</p>
            </div>

            <div className='field-row' style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr)', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)' }}>Target Company *</label>
                    <input className='input' value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder='e.g. Google, Stripe, Airbnb' />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)' }}>Target Role</label>
                    <input className='input' value={role} onChange={(e) => setRole(e.target.value)} placeholder='e.g. Senior Frontend Engineer' />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)' }}>Job Description (Optional — unlocks red flag and ATS analysis)</label>
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
                                    <summary>View Response</summary>
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
