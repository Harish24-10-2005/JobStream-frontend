'use client'

import { useState } from 'react'
import { apiRequest, ApiResponse } from '@/lib/api-client'

type InterviewPanelProps = {
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

/** Unwrap nested question arrays — backend may return { questions: [...] } or { technical_questions: [...] } or a plain array */
function unwrap(val: unknown, ...keys: string[]): Record<string, unknown>[] {
    if (Array.isArray(val)) return val.filter(q => q && typeof q === 'object') as Record<string, unknown>[]
    if (val && typeof val === 'object' && !Array.isArray(val)) {
        const o = val as Record<string, unknown>
        for (const k of keys) {
            if (Array.isArray(o[k])) return (o[k] as unknown[]).filter(q => q && typeof q === 'object') as Record<string, unknown>[]
        }
    }
    return []
}

/* ── Difficulty Badge ── */
function DifficultyBadge({ level }: { level: string }) {
    const l = String(level).toLowerCase()
    const color = l === 'hard' ? 'var(--red)' : l === 'medium' ? 'var(--yellow)' : 'var(--green)'
    return <span style={{ background: `color-mix(in srgb, ${color} 10%, transparent)`, color, border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`, fontSize: '10px', textTransform: 'capitalize', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>{level}</span>
}

/* ── Technical Question Card ── */
function TechQuestionCard({ q, index }: { q: Record<string, unknown>; index: number }) {
    const [expanded, setExpanded] = useState(false)
    const question = str(q.question || q.title || q.text)
    const difficulty = str(q.difficulty || '')
    const category = str(q.category || q.type || '')
    const technology = str(q.technology || '')
    const keyConcepts = arr(q.key_concepts)
    const answerPoints = arr(q.sample_answer_points)
    const followUps = arr(q.follow_up_questions || q.follow_ups || [])
    const borderColor = difficulty.toLowerCase() === 'hard' ? 'var(--red)' : difficulty.toLowerCase() === 'medium' ? 'var(--yellow)' : 'var(--green)'

    return (
        <div className='glass-panel glow-on-hover' style={{ borderLeft: `4px solid ${borderColor}`, cursor: 'pointer', padding: '18px 20px', transition: 'all 0.3s ease' }} onClick={() => setExpanded(!expanded)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-1)', background: 'var(--surface-2)', padding: '4px 8px', borderRadius: '4px' }}>Q{index + 1}</span>
                        {technology && <span className='chip' style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-soft)' }}>{technology}</span>}
                        {category && <span className='chip' style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-soft)' }}>{category}</span>}
                        {difficulty && <DifficultyBadge level={difficulty} />}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 600, lineHeight: 1.5, color: 'var(--text-1)' }}>{question}</div>
                </div>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '16px', transition: 'transform .3s var(--transition-spring)', transform: expanded ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
                    ▾
                </div>
            </div>

            {expanded && (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)', animation: 'slideDownFade 0.3s ease', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {keyConcepts.length > 0 && (
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)', marginBottom: '8px' }}>🔑 Key Concepts</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {keyConcepts.map((c, i) => <span key={i} className='chip' style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'var(--border-soft)' }}>{str(c)}</span>)}
                            </div>
                        </div>
                    )}
                    {answerPoints.length > 0 && (
                        <div style={{ background: 'color-mix(in srgb, var(--green) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--green) 15%, transparent)', borderRadius: 'var(--radius)', padding: '16px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--green)', marginBottom: '10px' }}>✅ Sample Answer Points</div>
                            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {answerPoints.map((p, i) => <li key={i} style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--text-2)' }}>{str(p)}</li>)}
                            </ul>
                        </div>
                    )}
                    {followUps.length > 0 && (
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)', marginBottom: '8px' }}>🔄 Follow-up Questions</div>
                            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {followUps.map((f, i) => <li key={i} style={{ fontSize: '12.5px', lineHeight: 1.5, color: 'var(--text-2)' }}>{str(f)}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

/* ── Behavioral Question Card ── */
function BehavioralCard({ q, index }: { q: Record<string, unknown>; index: number }) {
    const [expanded, setExpanded] = useState(false)
    const question = str(q.question || q.title || q.text)
    const whyAsked = str(q.why_asked || '')
    const keyPoints = arr(q.key_points)
    const star = obj(q.star_framework)
    const framework = str(q.framework || '')

    return (
        <div className='glass-panel glow-on-hover' style={{ borderLeft: '4px solid var(--purple)', cursor: 'pointer', padding: '18px 20px', transition: 'all 0.3s ease' }} onClick={() => setExpanded(!expanded)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-1)', background: 'var(--surface-2)', padding: '4px 8px', borderRadius: '4px' }}>Q{index + 1}</span>
                        {framework && <span className='pill' style={{ fontSize: '10px', background: 'color-mix(in srgb, var(--purple) 15%, transparent)', color: 'var(--purple)', border: '1px solid color-mix(in srgb, var(--purple) 30%, transparent)' }}>{framework}</span>}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 600, lineHeight: 1.5, color: 'var(--text-1)' }}>{question}</div>
                </div>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '16px', transition: 'transform .3s var(--transition-spring)', transform: expanded ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
                    ▾
                </div>
            </div>

            {expanded && (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)', animation: 'slideDownFade 0.3s ease', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {whyAsked && (
                        <div style={{ background: 'color-mix(in srgb, var(--accent) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--accent)', marginBottom: '8px' }}>💡 Why It&apos;s Asked</div>
                            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: 'var(--text-2)' }}>{whyAsked}</p>
                        </div>
                    )}
                    {keyPoints.length > 0 && (
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)', marginBottom: '8px' }}>🎯 Key Points to Cover</div>
                            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {keyPoints.map((p, i) => <li key={i} style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--text-2)' }}>{str(p)}</li>)}
                            </ul>
                        </div>
                    )}
                    {Object.keys(star).length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {(['situation', 'task', 'action', 'result'] as const).map(k => {
                                const v = str(star[k])
                                if (!v) return null
                                const meta: Record<string, { icon: string; color: string; bg: string }> = {
                                    situation: { icon: '📍', color: 'var(--blue)', bg: 'color-mix(in srgb, var(--blue) 8%, transparent)' },
                                    task: { icon: '🎯', color: 'var(--accent)', bg: 'color-mix(in srgb, var(--accent) 8%, transparent)' },
                                    action: { icon: '⚡', color: 'var(--green)', bg: 'color-mix(in srgb, var(--green) 8%, transparent)' },
                                    result: { icon: '🏆', color: 'var(--purple)', bg: 'color-mix(in srgb, var(--purple) 8%, transparent)' },
                                }
                                const m = meta[k]
                                return (
                                    <div key={k} style={{ background: m.bg, border: `1px solid color-mix(in srgb, ${m.color} 20%, transparent)`, padding: '12px 14px', borderRadius: 'var(--radius-sm)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: m.color, fontWeight: 800, marginBottom: '6px' }}>
                                            <span style={{ fontSize: '14px' }}>{m.icon}</span> {k}
                                        </div>
                                        <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.5, color: 'var(--text-1)' }}>{v}</p>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

/* ── Analysis Overview ── */
function AnalysisOverview({ analysis }: { analysis: Record<string, unknown> }) {
    const rounds = arr(analysis.interview_rounds)
    const priorities = obj(analysis.preparation_priority)
    const techFocus = arr(analysis.technical_focus)
    const softFocus = arr(analysis.soft_skills_focus)
    const isSenior = Boolean(analysis.is_senior_role)

    if (!rounds.length && !Object.keys(priorities).length && !techFocus.length) return null

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {isSenior && (
                <div style={{ background: 'linear-gradient(90deg, rgba(234, 179, 8, 0.1), transparent)', borderLeft: '3px solid var(--yellow)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '10px', animation: 'slideDownFade 0.4s ease' }}>
                    <span style={{ fontSize: '18px' }}>👔</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 500 }}>
                        <strong style={{ color: 'var(--text)' }}>Senior / Leadership Position</strong> — System design, architecture, and behavioral leadership questions are heavily emphasized.
                    </span>
                </div>
            )}

            {rounds.length > 0 && (
                <div className='glass-panel' style={{ padding: '20px' }}>
                    <div style={{ fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        📋 Expected Interview Timeline
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {rounds.map((r, i) => (
                            <div key={i} className='glow-on-hover' style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--border)',
                                padding: '8px 16px', borderRadius: 'var(--radius)',
                                fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px',
                            }}>
                                <span style={{ background: 'var(--accent)', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>{i + 1}</span>
                                {str(r)}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {Object.keys(priorities).length > 0 && (
                <div className='glass-panel' style={{ padding: '20px' }}>
                    <div style={{ fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🎯 Preparation Focus Allocation
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {Object.entries(priorities).map(([key, val]) => {
                            const pct = Number(val) || 0
                            const colors: Record<string, string> = { technical: 'var(--blue)', behavioral: 'var(--purple)', system_design: 'var(--accent)', company_knowledge: 'var(--green)' }
                            return (
                                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '140px', fontSize: '13px', fontWeight: 500, color: 'var(--text-2)', textTransform: 'capitalize' }}>
                                        {key.replace(/_/g, ' ')}
                                    </div>
                                    <div style={{ flex: 1, height: '8px', background: 'var(--surface-2)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${pct}%`, background: colors[key] || 'var(--accent)', borderRadius: '4px', boxShadow: `0 0 10px ${colors[key] || 'var(--accent)'}`, transition: 'width 1s ease-out' }} />
                                    </div>
                                    <div style={{ width: '40px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: 'var(--heading)' }}>
                                        {pct}%
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {(techFocus.length > 0 || softFocus.length > 0) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                    {techFocus.length > 0 && (
                        <div className='glass-panel' style={{ padding: '20px' }}>
                            <div style={{ fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)', fontWeight: 700, marginBottom: '16px' }}>
                                ⚙️ High-Priority Tech
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {techFocus.map((t, i) => <span key={i} className='chip' style={{ background: 'color-mix(in srgb, var(--blue) 15%, transparent)', color: 'var(--blue)', borderColor: 'color-mix(in srgb, var(--blue) 30%, transparent)' }}>{str(t)}</span>)}
                            </div>
                        </div>
                    )}
                    {softFocus.length > 0 && (
                        <div className='glass-panel' style={{ padding: '20px' }}>
                            <div style={{ fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)', fontWeight: 700, marginBottom: '16px' }}>
                                🗣️ Crucial Soft Skills
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {softFocus.map((s, i) => <span key={i} className='chip' style={{ background: 'color-mix(in srgb, var(--purple) 15%, transparent)', color: 'var(--purple)', borderColor: 'color-mix(in srgb, var(--purple) 30%, transparent)' }}>{str(s)}</span>)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

/* ── Resource Link Card ── */
function ResourceLink({ r }: { r: Record<string, unknown> }) {
    const name = str(r.name || r.title)
    const url = str(r.url || r.link)
    const desc = str(r.description || '')
    const difficulty = str(r.difficulty || '')

    return (
        <a href={url || '#'} target='_blank' rel='noreferrer' className='glass-panel glow-on-hover' style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', textDecoration: 'none', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <h5 style={{ margin: 0, fontSize: '14px', color: 'var(--blue)', fontWeight: 600, lineHeight: 1.4 }}>{name}</h5>
                {difficulty && (
                    <span className='pill' style={{ fontSize: '10px', background: difficulty.toLowerCase().includes('hard') ? 'color-mix(in srgb, var(--red) 15%, transparent)' : 'color-mix(in srgb, var(--accent) 15%, transparent)', color: difficulty.toLowerCase().includes('hard') ? 'var(--red)' : 'var(--accent)' }}>
                        {difficulty}
                    </span>
                )}
            </div>
            {desc && <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.5, color: 'var(--text-2)', flex: 1 }}>{desc}</p>}
            {url && (
                <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-soft)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🔗 {url.replace(/^https?:\/\//, '')}</span>
                </div>
            )}
        </a>
    )
}

/* ── Resources Section ── */
function ResourcesSection({ resources }: { resources: Record<string, unknown> }) {
    const dsaSheets = arr(resources.dsa_sheets) as Record<string, unknown>[]
    const leetcode = arr(resources.leetcode_collections) as Record<string, unknown>[]
    const discussions = arr(resources.discussions_forums) as Record<string, unknown>[]
    const techSpecific = obj(resources.tech_specific)
    const behavioralPrep = arr(resources.behavioral_prep) as Record<string, unknown>[]
    const studyPlan = obj(resources.study_plan) as Record<string, string>

    const hasResources = dsaSheets.length > 0 || leetcode.length > 0 || discussions.length > 0 || Object.keys(techSpecific).length > 0 || behavioralPrep.length > 0
    if (!hasResources && !Object.keys(studyPlan).length) return null

    const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {dsaSheets.length > 0 && (
                <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--heading)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>📝 DSA Practice Hubs</div>
                    <div style={gridStyle}>
                        {dsaSheets.map((r, i) => <ResourceLink key={i} r={r} />)}
                    </div>
                </div>
            )}

            {leetcode.length > 0 && (
                <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--heading)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>💡 LeetCode Collections</div>
                    <div style={gridStyle}>
                        {leetcode.map((r, i) => <ResourceLink key={i} r={r} />)}
                    </div>
                </div>
            )}

            {Object.keys(techSpecific).length > 0 && (
                <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--heading)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>🔧 Technology Masterclass</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {Object.entries(techSpecific).map(([tech, items]) => (
                            <div key={tech} className='glass-panel' style={{ padding: '16px', background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border-soft)' }}>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)', textTransform: 'capitalize', marginBottom: '12px', display: 'inline-block', borderBottom: '2px solid var(--accent)' }}>{tech}</div>
                                <div style={gridStyle}>
                                    {arr(items).map((r, i) => <ResourceLink key={i} r={obj(r)} />)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {behavioralPrep.length > 0 && (
                <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--heading)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>🗣️ Behavioral & Culture Fit</div>
                    <div style={gridStyle}>
                        {behavioralPrep.map((r, i) => <ResourceLink key={i} r={r} />)}
                    </div>
                </div>
            )}

            {discussions.length > 0 && (
                <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--heading)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>💬 Community Discussions</div>
                    <div style={gridStyle}>
                        {discussions.map((r, i) => <ResourceLink key={i} r={r} />)}
                    </div>
                </div>
            )}

            {Object.keys(studyPlan).length > 0 && (
                <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--heading)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>📅 Recommended Study Plan</div>
                    <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: '24px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {Object.entries(studyPlan).map(([week, topics], i) => (
                            <div key={week} style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '-33px', top: '2px', width: '16px', height: '16px', background: 'var(--accent)', borderRadius: '50%', border: '4px solid var(--surface)' }} />
                                <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent)', marginBottom: '6px' }}>{week.replace(/_/g, ' ')}</div>
                                <div className='glass-panel' style={{ padding: '14px 18px' }}>
                                    <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: 'var(--text-2)' }}>{str(topics)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

/* ── Main Results view ── */
function InterviewResults({ data }: { data: unknown }) {
    const d = obj(data)
    const root = d.result ? obj(d.result) : d

    // Unwrap nested question structures from backend response
    const technicalQs = unwrap(root.technical_questions, 'technical_questions', 'questions')
    const behavioralQs = unwrap(root.behavioral_questions, 'questions', 'behavioral_questions')
    const systemDesignQs = unwrap(root.system_design_questions, 'questions', 'system_design_questions')
    const codingQs = unwrap(root.coding_questions, 'questions', 'coding_questions')
    const allQuestions = unwrap(root.questions, 'questions')

    // Analysis, resources, tips
    const analysis = obj(root.analysis || root.job_analysis)
    const resources = obj(root.resources)
    const tips = arr(root.tips || root.general_tips || root.interview_tips)

    const hasAnalysis = Object.keys(analysis).length > 0
    const hasResources = Object.keys(resources).length > 0
    const totalQuestions = technicalQs.length + behavioralQs.length + systemDesignQs.length + codingQs.length + allQuestions.length

    // If completely empty, show a nice empty state instead of raw JSON
    if (!hasAnalysis && !hasResources && totalQuestions === 0) {
        return (
            <div className='empty-state' style={{ padding: '40px', background: 'var(--surface-1)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
                <h4 style={{ margin: '0 0 8px' }}>Incomplete Response</h4>
                <p style={{ margin: 0, color: 'var(--text-2)', fontSize: '14px' }}>
                    The AI agent encountered an issue generating this specific prep package. Try adjusting the tech stack or role.
                </p>
                <details style={{ marginTop: '20px', fontSize: '12px', color: 'var(--muted)', textAlign: 'left' }}>
                    <summary style={{ cursor: 'pointer' }}>View Raw Data</summary>
                    <pre style={{ marginTop: '10px', background: 'var(--surface-2)', padding: '12px', borderRadius: '4px', overflowX: 'auto' }}>
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </details>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* ── Summary Banner ── */}
            <div className='interview-summary-banner' style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 15%, transparent), color-mix(in srgb, var(--blue) 15%, transparent))', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' }}>
                <div style={{ fontSize: '32px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}>🎯</div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '0.3px', color: 'var(--heading)' }}>
                        Interview Preparation Toolkit
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-2)' }}>
                        {totalQuestions > 0 ? (
                            [
                                technicalQs.length > 0 && `${technicalQs.length} Technical`,
                                behavioralQs.length > 0 && `${behavioralQs.length} Behavioral`,
                                systemDesignQs.length > 0 && `${systemDesignQs.length} System Design`,
                                codingQs.length > 0 && `${codingQs.length} Coding`,
                                allQuestions.length > 0 && `${allQuestions.length} General`,
                            ].filter(Boolean).join(' · ') + ' Questions Generated'
                        ) : (
                            'Role analysis and strategic resources generated successfully.'
                        )}
                    </p>
                </div>
            </div>

            {/* ── Analysis Overview ── */}
            {hasAnalysis && (
                <div style={{ animation: 'slideDownFade 0.5s ease-out' }}>
                    <div className='section-header' style={{ marginBottom: '16px' }}>
                        <h4 style={{ margin: 0, fontSize: '15px' }}>📊 Role Strategy Analysis</h4>
                    </div>
                    <AnalysisOverview analysis={analysis} />
                </div>
            )}

            {/* ── Behavioral Questions ── */}
            {behavioralQs.length > 0 && (
                <div style={{ animation: 'slideDownFade 0.6s ease-out' }}>
                    <div className='interview-category-header'>
                        🗣️ Behavioral Questions
                        <span className='interview-count-badge'>{behavioralQs.length}</span>
                    </div>
                    <div className='result-stack'>
                        {behavioralQs.map((q, i) => <BehavioralCard key={i} q={q} index={i} />)}
                    </div>
                </div>
            )}

            {/* ── Technical Questions ── */}
            {technicalQs.length > 0 && (
                <div style={{ animation: 'slideDownFade 0.7s ease-out' }}>
                    <div className='interview-category-header'>
                        ⚙️ Technical/Core Questions
                        <span className='interview-count-badge'>{technicalQs.length}</span>
                    </div>
                    <div className='result-stack'>
                        {technicalQs.map((q, i) => <TechQuestionCard key={i} q={q} index={i} />)}
                    </div>
                </div>
            )}

            {/* ── System Design ── */}
            {systemDesignQs.length > 0 && (
                <div style={{ animation: 'slideDownFade 0.8s ease-out' }}>
                    <div className='interview-category-header'>
                        🏗️ System Design
                        <span className='interview-count-badge'>{systemDesignQs.length}</span>
                    </div>
                    <div className='result-stack'>
                        {systemDesignQs.map((q, i) => <TechQuestionCard key={i} q={q} index={i} />)}
                    </div>
                </div>
            )}

            {/* ── Coding ── */}
            {codingQs.length > 0 && (
                <div style={{ animation: 'slideDownFade 0.8s ease-out' }}>
                    <div className='interview-category-header'>
                        💻 Coding Challenges
                        <span className='interview-count-badge'>{codingQs.length}</span>
                    </div>
                    <div className='result-stack'>
                        {codingQs.map((q, i) => <TechQuestionCard key={i} q={q} index={i} />)}
                    </div>
                </div>
            )}

            {/* ── General Questions ── */}
            {allQuestions.length > 0 && (
                <div style={{ animation: 'slideDownFade 0.9s ease-out' }}>
                    <div className='interview-category-header'>
                        ❓ Questions
                        <span className='interview-count-badge'>{allQuestions.length}</span>
                    </div>
                    <div className='result-stack'>
                        {allQuestions.map((q, i) => <TechQuestionCard key={i} q={q} index={i} />)}
                    </div>
                </div>
            )}

            {/* ── Missing Questions Graceful Fallback ── */}
            {totalQuestions === 0 && hasAnalysis && (
                <div className='empty-state' style={{ padding: '24px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)' }}>
                    <p style={{ margin: 0, color: 'var(--red)', fontSize: '13px', fontWeight: 500 }}>
                        We were unable to generate specific questions for this exact combination right now. Review the strategic analysis and resources below to prepare.
                    </p>
                </div>
            )}

            {/* ── Resources & Study Plan ── */}
            {hasResources && (
                <div style={{ animation: 'slideDownFade 1s ease-out' }}>
                    <div className='section-header' style={{ marginBottom: '16px', marginTop: '16px' }}>
                        <h4 style={{ margin: 0, fontSize: '15px' }}>📚 Study Resources & Guides</h4>
                    </div>
                    <ResourcesSection resources={resources} />
                </div>
            )}

            {/* ── Tips ── */}
            {tips.length > 0 && (
                <div style={{ animation: 'slideDownFade 1.1s ease-out' }}>
                    <div className='interview-section-label'>💡 General Tips</div>
                    <div className='result-stack'>
                        {tips.map((tip, i) => (
                            <div key={i} className='dossier-item' style={{ borderLeft: '3px solid var(--accent)', padding: '10px 14px' }}>
                                <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: 'var(--text-2)' }}>{str(tip)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

/* ════════════════════════════════
   Main Export
   ════════════════════════════════ */
export function InterviewPanel({ token, companyName, setCompanyName, roleName, setRoleName, loading, runAction, results }: InterviewPanelProps) {
    const [techStack, setTechStack] = useState('')

    return (
        <div className='action-grid' style={{ gap: '24px' }}>
            <div className='section-header'>
                <h3>🎯 Interview Preparation</h3>
                <p className='muted' style={{ margin: '4px 0 0', fontSize: '14px' }}>Generate categorized questions, sample answers, and a personalized study plan for your target role.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className='form-field'>
                    <label>Company *</label>
                    <input className='input' value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder='e.g. Google' />
                </div>
                <div className='form-field'>
                    <label>Role *</label>
                    <input className='input' value={roleName} onChange={e => setRoleName(e.target.value)} placeholder='e.g. Senior Software Engineer' />
                </div>
            </div>

            <div className='form-field'>
                <label>Tech Stack (comma-separated)</label>
                <input className='input' value={techStack} onChange={e => setTechStack(e.target.value)} placeholder='e.g. React, Node.js, AWS, PostgreSQL' />
            </div>

            <button
                className='button primary'
                disabled={loading || !companyName || !roleName}
                onClick={() =>
                    runAction('interview', 'Interview Prep', () =>
                        apiRequest('/api/v1/interview/prepare', {
                            method: 'POST', token,
                            body: {
                                company: companyName,
                                role: roleName,
                                tech_stack: techStack ? techStack.split(',').map(s => s.trim()).filter(Boolean) : undefined,
                            }
                        })
                    )
                }
                style={{ padding: '12px' }}
            >
                🎯 Generate Interview Prep
            </button>

            {results.length === 0 ? (
                <div className='empty-state'>
                    <div className='empty-icon'>📋</div>
                    <p>Enter a company and role to generate a comprehensive interview prep package with categorized questions.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {results.map((entry) => {
                        return (
                            <div key={`${entry.label}_${entry.at}`} style={{ animation: 'slideDownFade 0.4s ease-out' }}>
                                <div className='result-head'>
                                    <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: entry.label.startsWith('ERROR') ? 'var(--red)' : 'var(--green)' }} />
                                        {entry.label}
                                    </h4>
                                    <span className='muted' style={{ fontSize: 11 }}>{new Date(entry.at).toLocaleTimeString()}</span>
                                </div>
                                <InterviewResults data={entry.data} />
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
