'use client'

import { useState } from 'react'
import { apiRequest, ApiResponse } from '@/lib/api-client'

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

function ATSGauge({ score }: { score: number }) {
    const r = 34
    const circ = 2 * Math.PI * r
    const offset = circ - (score / 100) * circ
    const color = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--yellow)' : 'var(--red)'
    return (
        <div className='ats-circle'>
            <svg viewBox='0 0 80 80'>
                <circle className='track' cx='40' cy='40' r={r} />
                <circle className='fill' cx='40' cy='40' r={r} stroke={color} strokeDasharray={circ} strokeDashoffset={offset} />
            </svg>
            <span className='score-label' style={{ color }}>{score}</span>
        </div>
    )
}

function renderResumeResult(data: unknown) {
    if (!data || typeof data !== 'object') return null
    const obj = data as Record<string, unknown>

    // ATS Analysis
    if (obj.ats_score != null) {
        const suggestions = Array.isArray(obj.suggestions) ? obj.suggestions as Array<Record<string, string>> : []
        const matched = Array.isArray(obj.matched_keywords) ? obj.matched_keywords as string[] : []
        const missing = Array.isArray(obj.missing_keywords) ? obj.missing_keywords as string[] : []

        return (
            <div className='result-card' style={{ background: 'var(--surface)', border: 'none', padding: '24px', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                <div className='ats-gauge' style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px', background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <ATSGauge score={Number(obj.ats_score)} />
                    <div className='ats-info'>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>ATS Match Score</h4>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.5 }}>
                            {Number(obj.ats_score) >= 80 ? 'Excellent! Your resume is highly optimized for this role.' :
                                Number(obj.ats_score) >= 60 ? 'Good, but there are some missing keywords you should include.' :
                                    'Needs significant work. The ATS will likely filter this out.'}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                    {matched.length > 0 && (
                        <div style={{ background: 'rgba(57, 255, 20, 0.05)', border: '1px solid rgba(57, 255, 20, 0.1)', padding: '16px', borderRadius: '12px' }}>
                            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }}></span> Matches
                            </span>
                            <div className='skills-row' style={{ marginTop: '12px', gap: '6px' }}>
                                {matched.map((k) => <span key={k} className='chip match' style={{ background: 'rgba(57, 255, 20, 0.1)', color: 'var(--green)', border: '1px solid rgba(57, 255, 20, 0.2)', padding: '4px 10px', borderRadius: '4px' }}>{k}</span>)}
                            </div>
                        </div>
                    )}
                    {missing.length > 0 && (
                        <div style={{ background: 'rgba(255, 68, 68, 0.05)', border: '1px solid rgba(255, 68, 68, 0.1)', padding: '16px', borderRadius: '12px' }}>
                            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--red)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--red)' }}></span> Missing
                            </span>
                            <div className='skills-row' style={{ marginTop: '12px', gap: '6px' }}>
                                {missing.map((k) => <span key={k} className='chip miss' style={{ background: 'rgba(255, 68, 68, 0.1)', color: 'var(--red)', border: '1px solid rgba(255, 68, 68, 0.2)', padding: '4px 10px', borderRadius: '4px' }}>{k}</span>)}
                            </div>
                        </div>
                    )}
                </div>

                {suggestions.length > 0 && (
                    <div>
                        <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '12px', display: 'block' }}>Actionable Suggestions</span>
                        <div className='result-stack'>
                            {suggestions.map((s, i) => (
                                <div key={i} className='dossier-item' style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderLeft: `3px solid ${s.priority === 'high' ? 'var(--red)' : s.priority === 'medium' ? 'var(--yellow)' : 'var(--blue)'}`, marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <h5 style={{ margin: 0, fontSize: '14px', color: 'var(--text-bright)', textTransform: 'capitalize' }}>{s.type || 'Suggestion'}</h5>
                                        <span className={`pill`} style={{ fontSize: '10px', padding: '2px 8px', background: s.priority === 'high' ? 'rgba(255, 68, 68, 0.2)' : s.priority === 'medium' ? 'rgba(255, 204, 0, 0.2)' : 'rgba(0, 122, 255, 0.2)', color: s.priority === 'high' ? 'var(--red)' : s.priority === 'medium' ? 'var(--yellow)' : 'var(--blue)', border: 'none' }}>
                                            {s.priority || 'low'} priority
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: 'var(--text-muted)' }}>{s.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // Templates
    if (Array.isArray(obj.templates)) {
        return (
            <div className='result-stack' style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                {(obj.templates as Array<Record<string, string>>).map((t) => (
                    <div key={t.id} className='dossier-item' style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: '0.2s transform' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                        <div style={{ height: '120px', background: 'linear-gradient(180deg, rgba(255,255,255,0.1), transparent)', borderRadius: '4px', marginBottom: '16px' }} />
                        <h5 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>{t.name}</h5>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>{t.description}</p>
                    </div>
                ))}
            </div>
        )
    }

    return null
}

export function ResumePanel({ token, roleName, setRoleName, companyName, setCompanyName, loading, runAction, results }: ResumePanelProps) {
    const [resumeContent, setResumeContent] = useState('')
    const [jobDesc, setJobDesc] = useState('')
    const [techStack, setTechStack] = useState('')

    return (
        <div className='action-grid' style={{ gap: '24px' }}>
            <div className='section-header'>
                <h3>📄 ATS Resume Studio</h3>
                <p className='muted' style={{ margin: '4px 0 0', fontSize: '14px' }}>Analyze you resume against ATS systems or dynamically tailor it to specific job descriptions.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Your Resume Content *</label>
                <textarea
                    className='input'
                    style={{ minHeight: '120px', resize: 'vertical' }}
                    value={resumeContent}
                    onChange={(e) => setResumeContent(e.target.value)}
                    placeholder='Paste your raw resume text here...'
                />
            </div>

            <div className='field-row' style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr)', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Target Role</label>
                    <input className='input' value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder='e.g. Senior BE Engineer' />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Target Company</label>
                    <input className='input' value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder='e.g. Meta' />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Target Tech Stack (Optional)</label>
                <input className='input' value={techStack} onChange={(e) => setTechStack(e.target.value)} placeholder='e.g. Python, Redis, Postgres' />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Target Job Description (Optional but recommended)</label>
                <textarea
                    className='input'
                    style={{ minHeight: '80px', resize: 'vertical' }}
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    placeholder='Paste the job description you are matching to...'
                />
            </div>

            <div className='field-row' style={{ marginTop: '16px' }}>
                <button
                    className='button primary'
                    disabled={loading || !resumeContent}
                    onClick={() =>
                        runAction('resume', 'ATS Analysis', () =>
                            apiRequest('/api/v1/resume/analyze', {
                                method: 'POST', token,
                                body: {
                                    content: resumeContent,
                                    job_description: jobDesc || undefined,
                                    role: roleName || undefined,
                                    company: companyName || undefined
                                }
                            })
                        )
                    }
                    style={{ flex: 1, padding: '12px' }}
                >
                    Run ATS Matcher
                </button>
                <button
                    className='button'
                    disabled={loading || !resumeContent || !jobDesc}
                    onClick={() =>
                        runAction('resume', 'Tailor Resume', () =>
                            apiRequest('/api/v1/resume/tailor', {
                                method: 'POST', token,
                                body: {
                                    resume_content: resumeContent,
                                    job_description: jobDesc,
                                    role: roleName || 'Software Engineer',
                                    company: companyName || 'Company',
                                    tech_stack: techStack.split(',').map(s => s.trim()).filter(Boolean)
                                },
                            })
                        )
                    }
                    style={{ flex: 1, padding: '12px', background: 'rgba(255, 138, 31, 0.15)', color: 'var(--accent)', border: '1px solid rgba(255, 138, 31, 0.3)' }}
                >
                    ✨ Tailor Resume to JD
                </button>
                <button className='button' disabled={loading} onClick={() => runAction('resume', 'Templates', () => apiRequest('/api/v1/resume/templates', { token }))} style={{ padding: '12px' }}>
                    Templates
                </button>
            </div>

            {results.length === 0 ? (
                <div className='empty-state' style={{ padding: '48px 24px' }}>
                    <div className='empty-icon' style={{ opacity: 0.5, transform: 'scale(1.2)' }}>📄</div>
                    <p style={{ marginTop: '16px', fontSize: '15px' }}>Analyze or tailor your resume to see ATS scores and suggestions</p>
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
                            {renderResumeResult(entry.data) || (
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
