'use client'

import { useState } from 'react'
import { apiRequest, ApiResponse } from '@/lib/api-client'
import { Target, Building2, FileText, CheckCircle2, AlertCircle, TrendingUp, Sparkles, Copy, XCircle } from 'lucide-react'

type ResumePanelProps = {
    token: string
    roleName: string
    setRoleName: (v: string) => void
    companyName: string
    setCompanyName: (v: string) => void
    loading: boolean
    runAction: <T>(target: string, label: string, fn: () => Promise<ApiResponse<T>>) => void
    results: Array<{ label: string; data: unknown; at: string }>
}

const str = (v: unknown) => (v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v))
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {})

/* ── ATS Score Gauge ── */
function ATSGauge({ score }: { score: number }) {
    const circumference = 2 * Math.PI * 34
    const offset = circumference - (score / 100) * circumference
    const color = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--yellow)' : 'var(--red)'

    return (
        <div className='glass-panel' style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '24px', borderLeft: `4px solid ${color}` }}>
            <div className='ats-circle' style={{ position: 'relative', width: '80px', height: '80px' }}>
                <svg viewBox='0 0 76 76' style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    <circle cx='38' cy='38' r='34' fill='none' stroke='hsl(var(--foreground) / 0.1)' strokeWidth='6' />
                    <circle cx='38' cy='38' r='34' fill='none' stroke={color} strokeWidth='6' strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap='round' style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, color }}>
                    {score}
                </div>
            </div>
            <div>
                <h4 style={{ color, margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>ATS Compatibility Score</h4>
                <p style={{ margin: 0, color: 'var(--text-2)', fontSize: '14px', lineHeight: 1.5 }}>
                    {score >= 75 ? 'Excellent — your resume is well-optimized for ATS systems. You have a high chance of passing the initial screening.' : score >= 50 ? 'Fair — some improvements recommended to pass ATS filters. Focus on adding missing keywords and fixing formatting.' : 'Needs work — significant improvements needed. Your resume might be rejected by automated systems.'}
                </p>
            </div>
        </div>
    )
}

/* ── Skill match chips ── */
function SkillChips({ matched, missing }: { matched: unknown[]; missing: unknown[] }) {
    if (!matched.length && !missing.length) return null
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {matched.length > 0 && (
                <div className='glass-panel' style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <CheckCircle2 size={18} color='var(--green)' />
                        <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--green)', fontWeight: 600 }}>Matched Skills</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {matched.map((s, i) => <span key={i} className='chip' style={{ background: 'color-mix(in srgb, var(--green) 15%, transparent)', color: 'var(--green)', border: '1px solid color-mix(in srgb, var(--green) 30%, transparent)' }}>{str(s)}</span>)}
                    </div>
                </div>
            )}
            {missing.length > 0 && (
                <div className='glass-panel' style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <XCircle size={18} color='var(--red)' />
                        <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--red)', fontWeight: 600 }}>Missing Skills</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {missing.map((s, i) => <span key={i} className='chip' style={{ background: 'color-mix(in srgb, var(--red) 15%, transparent)', color: 'var(--red)', border: '1px solid color-mix(in srgb, var(--red) 30%, transparent)' }}>{str(s)}</span>)}
                    </div>
                </div>
            )}
        </div>
    )
}

/* ── ATS Results ── */
function ATSResults({ data }: { data: unknown }) {
    const d = obj(data)
    const root = d.result ? obj(d.result) : d

    const score = Number(root.ats_score || root.score || root.overall_score || 0)
    const matchedSkills = arr(root.matched_skills || root.matching_skills)
    const missingSkills = arr(root.missing_skills || root.gap_skills)
    const improvements = arr(root.improvements || root.suggestions || root.recommendations) as Array<Record<string, unknown>>
    const formatIssues = arr(root.format_issues || root.formatting_issues)
    const strengthsList = arr(root.strengths)
    const weaknessesList = arr(root.weaknesses)
    const tailoredContent = str(root.tailored_resume || root.optimized_resume || root.resume_content || '')

    if (!score && !matchedSkills.length && !improvements.length && !tailoredContent) return null

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '16px' }}>
            {score > 0 && <ATSGauge score={score} />}

            <SkillChips matched={matchedSkills} missing={missingSkills} />

            {(strengthsList.length > 0 || weaknessesList.length > 0) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    {strengthsList.length > 0 && (
                        <div className='glass-panel' style={{ padding: '20px', borderTop: '3px solid var(--green)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <TrendingUp size={18} color='var(--green)' />
                                <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--green)', fontWeight: 600 }}>Strengths</span>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.7 }}>
                                {strengthsList.map((s, i) => <li key={i} style={{ marginBottom: '8px' }}>{str(s)}</li>)}
                            </ul>
                        </div>
                    )}
                    {weaknessesList.length > 0 && (
                        <div className='glass-panel' style={{ padding: '20px', borderTop: '3px solid var(--red)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <AlertCircle size={18} color='var(--red)' />
                                <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--red)', fontWeight: 600 }}>Weaknesses</span>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.7 }}>
                                {weaknessesList.map((w, i) => <li key={i} style={{ marginBottom: '8px' }}>{str(w)}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {improvements.length > 0 && (
                <div className='glass-panel' style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                        <Sparkles size={20} color='var(--primary)' />
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Improvement Suggestions</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {improvements.map((imp, i) => {
                            const priority = str(imp.priority || imp.importance || '').toLowerCase()
                            const pColor = priority === 'high' ? 'var(--red)' : priority === 'medium' ? 'var(--yellow)' : 'var(--green)'
                            return (
                                <div key={i} style={{ display: 'flex', gap: '16px', padding: '16px', borderRadius: '8px', background: 'hsl(var(--foreground) / 0.03)', border: '1px solid hsl(var(--foreground) / 0.08)' }}>
                                    <div style={{ width: '4px', borderRadius: '4px', background: pColor, flexShrink: 0 }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 500 }}>{str(imp.section || imp.area || imp.title || `Suggestion ${i + 1}`)}</h4>
                                            {priority && <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 10px', borderRadius: '12px', background: `color-mix(in srgb, ${pColor} 15%, transparent)`, color: pColor, fontWeight: 600 }}>{priority}</span>}
                                        </div>
                                        <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: 'var(--text-2)' }}>{str(imp.suggestion || imp.description || imp.recommendation || imp)}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {formatIssues.length > 0 && (
                <div className='glass-panel' style={{ padding: '20px', borderLeft: '3px solid var(--yellow)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <AlertCircle size={18} color='var(--yellow)' />
                        <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--yellow)', fontWeight: 600 }}>Formatting Issues</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.7 }}>
                        {formatIssues.map((f, i) => <li key={i}>{str(f)}</li>)}
                    </ul>
                </div>
            )}

            {tailoredContent && (
                <div className='glass-panel' style={{ padding: '24px', background: 'linear-gradient(145deg, hsl(var(--foreground)/0.03) 0%, hsl(var(--primary)/0.05) 100%)', border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={20} color='var(--primary)' />
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Tailored Resume Content</h3>
                        </div>
                        <button
                            className='button'
                            style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center', background: 'hsl(var(--foreground)/0.05)' }}
                            onClick={() => navigator.clipboard.writeText(tailoredContent)}
                            title="Copy to clipboard"
                        >
                            <Copy size={14} /> Copy
                        </button>
                    </div>
                    <div style={{
                        padding: '24px',
                        background: 'hsl(var(--background))',
                        borderRadius: '8px',
                        fontSize: '14px',
                        lineHeight: 1.8,
                        color: 'var(--text-1)',
                        whiteSpace: 'pre-wrap',
                        border: '1px solid hsl(var(--foreground) / 0.1)',
                        fontFamily: 'var(--font-mono)'
                    }}>
                        {tailoredContent}
                    </div>
                </div>
            )}
        </div>
    )
}

/* ════════════════════════════════
   Main Export
   ════════════════════════════════ */
export function ResumePanel({ token, roleName, setRoleName, companyName, setCompanyName, loading, runAction, results }: ResumePanelProps) {
    const [resumeContent, setResumeContent] = useState('')
    const [jobDescription, setJobDescription] = useState('')

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>
            <div className='glass-panel' style={{ padding: '32px', background: 'linear-gradient(180deg, hsl(var(--foreground)/0.03) 0%, transparent 100%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'color-mix(in srgb, var(--primary) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                        <FileText size={24} />
                    </div>
                    <div>
                        <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 600 }}>Resume Studio</h2>
                        <p style={{ margin: 0, color: 'var(--text-2)', fontSize: '15px' }}>ATS analysis, skill matching, and AI-powered tailoring for your target roles.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '32px' }}>
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px' }}>
                            <Building2 size={16} /> Target Company
                        </label>
                        <input className='input' style={{ width: '100%', background: 'hsl(var(--foreground)/0.03)', border: '1px solid hsl(var(--foreground)/0.1)', padding: '12px 16px', borderRadius: '8px' }} value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder='e.g. Google' />
                    </div>
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px' }}>
                            <Target size={16} /> Target Role
                        </label>
                        <input className='input' style={{ width: '100%', background: 'hsl(var(--foreground)/0.03)', border: '1px solid hsl(var(--foreground)/0.1)', padding: '12px 16px', borderRadius: '8px' }} value={roleName} onChange={e => setRoleName(e.target.value)} placeholder='e.g. Senior Software Engineer' />
                    </div>
                </div>

                <div style={{ marginTop: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px' }}>
                        Your Resume Content
                    </label>
                    <textarea
                        className='input'
                        style={{ width: '100%', minHeight: '160px', background: 'hsl(var(--foreground)/0.03)', border: '1px solid hsl(var(--foreground)/0.1)', padding: '16px', borderRadius: '8px', resize: 'vertical', fontFamily: 'inherit' }}
                        value={resumeContent}
                        onChange={e => setResumeContent(e.target.value)}
                        placeholder='Paste your resume text here...'
                    />
                </div>

                <div style={{ marginTop: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px' }}>
                        Job Description
                    </label>
                    <textarea
                        className='input'
                        style={{ width: '100%', minHeight: '120px', background: 'hsl(var(--foreground)/0.03)', border: '1px solid hsl(var(--foreground)/0.1)', padding: '16px', borderRadius: '8px', resize: 'vertical', fontFamily: 'inherit' }}
                        value={jobDescription}
                        onChange={e => setJobDescription(e.target.value)}
                        placeholder='Paste the job description for highly targeted ATS analysis...'
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '32px' }}>
                    <button
                        className='button'
                        disabled={loading || !resumeContent}
                        onClick={() =>
                            runAction('resume', 'ATS Analysis', () =>
                                apiRequest('/api/v1/resume/analyze', {
                                    method: 'POST', token,
                                    body: {
                                        resume_content: resumeContent,
                                        job_description: jobDescription || undefined,
                                        company: companyName || undefined,
                                        role: roleName || undefined,
                                    }
                                })
                            )
                        }
                        style={{ padding: '14px', fontSize: '15px', fontWeight: 600, background: 'hsl(var(--foreground) / 0.05)', color: 'var(--text-1)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                    >
                        <TrendingUp size={18} /> Analyze ATS Score
                    </button>
                    <button
                        className='button'
                        disabled={loading || !resumeContent || !jobDescription}
                        onClick={() =>
                            runAction('resume', 'Tailor Resume', () =>
                                apiRequest('/api/v1/resume/tailor', {
                                    method: 'POST', token,
                                    body: {
                                        resume_content: resumeContent,
                                        job_description: jobDescription,
                                        company: companyName || undefined,
                                        role: roleName || undefined,
                                    }
                                })
                            )
                        }
                        style={{ padding: '14px', fontSize: '15px', fontWeight: 600, background: 'var(--primary)', color: '#fff', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px 0 color-mix(in srgb, var(--primary) 40%, transparent)' }}
                    >
                        <Sparkles size={18} /> Tailor to Job
                    </button>
                </div>
            </div>

            {results.length === 0 ? (
                <div className='glass-panel' style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', borderStyle: 'dashed' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'hsl(var(--foreground)/0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', marginBottom: '16px' }}>
                        <FileText size={32} />
                    </div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>No Analysis Yet</h3>
                    <p style={{ margin: 0, color: 'var(--text-2)', fontSize: '15px', maxWidth: '400px' }}>
                        Paste your resume and a job description above to get an ATS compatibility score with detailed improvement suggestions.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {results.map((entry) => (
                        <div key={`${entry.label}_${entry.at}`} style={{ animation: 'slideDownFade 0.4s ease-out' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingLeft: '8px' }}>
                                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: 600 }}>
                                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: entry.label.startsWith('ERROR') ? 'var(--red)' : 'var(--green)', boxShadow: `0 0 10px ${entry.label.startsWith('ERROR') ? 'var(--red)' : 'var(--green)'}` }} />
                                    {entry.label}
                                </h3>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, background: 'hsl(var(--foreground)/0.05)', padding: '4px 10px', borderRadius: '12px' }}>
                                    {new Date(entry.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            {ATSResults({ data: entry.data }) || (
                                <details className='glass-panel' style={{ padding: '16px' }} open>
                                    <summary style={{ cursor: 'pointer', fontWeight: 500, color: 'var(--text-2)', marginBottom: '12px' }}>View Raw Response</summary>
                                    <pre style={{ margin: 0, padding: '16px', background: 'hsl(var(--background))', borderRadius: '8px', fontSize: '13px', overflowX: 'auto', border: '1px solid hsl(var(--foreground) / 0.1)' }}>{JSON.stringify(entry.data, null, 2)}</pre>
                                </details>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

