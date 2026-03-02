'use client'

import React, { useState } from 'react'
import { apiRequest, ApiResponse } from '@/lib/api-client'

type InterviewPanelProps = {
    token: string
    roleName: string
    setRoleName: (v: string) => void
    companyName: string
    setCompanyName: (v: string) => void
    loading: boolean
    runAction: <T>(target: string, label: string, fn: () => Promise<ApiResponse<T>>) => void
    results: Array<{ label: string; data: unknown; at: string }>
}

function renderInterviewPrep(data: unknown) {
    if (!data || typeof data !== 'object') return null
    const obj = data as Record<string, unknown>

    const categories = [
        { key: 'behavioral_questions', label: 'Behavioral', icon: '🧠' },
        { key: 'behavioral', label: 'Behavioral', icon: '🧠' },
        { key: 'technical_questions', label: 'Technical', icon: '💻' },
        { key: 'technical', label: 'Technical', icon: '💻' },
        { key: 'system_design', label: 'System Design', icon: '🏗️' },
        { key: 'situational', label: 'Situational', icon: '📋' },
        { key: 'questions', label: 'General Practice', icon: '❓' },
    ]

    let found = false
    const sections: React.ReactElement[] = []

    // De-duplicate keys (since we check multiple variants like technical_questions AND technical)
    const processedKeys = new Set<string>()

    for (const cat of categories) {
        if (processedKeys.has(cat.key)) continue

        const raw = obj[cat.key]
        if (!Array.isArray(raw) || raw.length === 0) continue

        found = true
        processedKeys.add(cat.key)

        sections.push(
            <div key={cat.key} className='qa-section' style={{ marginBottom: '32px' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '16px' }}>
                    <span style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px' }}>{cat.icon}</span>
                    {cat.label}
                </h4>
                <div className='result-stack' style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {raw.map((q, i) => {
                        const qObj = typeof q === 'object' && q !== null ? q as Record<string, unknown> : null
                        const question = qObj ? String(qObj.question || qObj.text || q) : String(q)
                        const answer = qObj ? String(qObj.answer || qObj.sample_answer || qObj.tip || '') : ''
                        const difficulty = qObj ? String(qObj.difficulty || '') : ''
                        return (
                            <div key={i} className='qa-item' style={{ background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid var(--accent)', padding: '20px', borderRadius: '0 12px 12px 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '12px' }}>
                                    <div className='question' style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-bright)', lineHeight: 1.5 }}>{question}</div>
                                    {difficulty && (
                                        <span className={`pill difficulty`} style={{ background: difficulty.toLowerCase() === 'hard' ? 'rgba(255, 68, 68, 0.1)' : difficulty.toLowerCase() === 'medium' ? 'rgba(255, 204, 0, 0.1)' : 'rgba(57, 255, 20, 0.1)', color: difficulty.toLowerCase() === 'hard' ? 'var(--red)' : difficulty.toLowerCase() === 'medium' ? 'var(--yellow)' : 'var(--green)', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            {difficulty}
                                        </span>
                                    )}
                                </div>
                                {answer && (
                                    <div className='answer' style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)' }}>
                                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.5px' }}>Sample Answer / Strategy</div>
                                        {answer}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    // Company-specific tips
    if (obj.company_tips || obj.tips || obj.analysis) {
        const tips = obj.company_tips || obj.tips || obj.analysis

        let tipContent: React.ReactNode = null
        if (typeof tips === 'string') {
            tipContent = <p style={{ margin: 0, lineHeight: 1.6 }}>{tips}</p>
        } else if (typeof tips === 'object' && tips !== null) {
            tipContent = (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {Object.entries(tips as Record<string, unknown>).map(([k, v]) => (
                        <div key={k}>
                            <strong style={{ color: 'var(--text-bright)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}:</strong> {String(v)}
                        </div>
                    ))}
                </div>
            )
        }

        if (tipContent) {
            sections.unshift(
                <div key='tips' className='dossier-item' style={{ background: 'linear-gradient(135deg, rgba(255,138,31,0.1), rgba(0,0,0,0.2))', border: '1px solid rgba(255,138,31,0.2)', padding: '24px', borderRadius: '12px', marginBottom: '32px' }}>
                    <h5 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0', fontSize: '16px', color: 'var(--accent)' }}>
                        💡 Interview Intelligence
                    </h5>
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                        {tipContent}
                    </div>
                </div>
            )
        }
    }

    if (!found && sections.length === 0) return null
    return <div className='result-card' style={{ background: 'var(--surface)', padding: '32px', borderRadius: '16px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>{sections}</div>
}

export function InterviewPanel({ token, roleName, setRoleName, companyName, setCompanyName, loading, runAction, results }: InterviewPanelProps) {
    const [techStack, setTechStack] = useState('')

    return (
        <div className='action-grid' style={{ gap: '24px' }}>
            <div className='section-header'>
                <h3>🎯 Interview Preparation Engine</h3>
                <p className='muted' style={{ margin: '4px 0 0', fontSize: '14px' }}>Generate tailored interview questions, sample answers, and company-specific strategies.</p>
            </div>

            <div className='field-row' style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr)', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Target Role *</label>
                    <input className='input' value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder='e.g. Backend Developer' />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Target Company *</label>
                    <input className='input' value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder='e.g. Netflix' />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Tech Stack / Skills (Comma separated)</label>
                <input className='input' value={techStack} onChange={(e) => setTechStack(e.target.value)} placeholder='e.g. Python, Docker, Kubernetes' />
            </div>

            <div className='field-row' style={{ marginTop: '8px' }}>
                <button
                    className='button primary'
                    disabled={loading || !roleName || !companyName}
                    onClick={() =>
                        runAction('interview', 'Interview Prep', () =>
                            apiRequest('/api/v1/interview/prep', {
                                method: 'POST', token,
                                body: {
                                    role: roleName,
                                    company: companyName,
                                    tech_stack: techStack ? techStack.split(',').map(s => s.trim()).filter(Boolean) : []
                                },
                            })
                        )
                    }
                    style={{ flex: 1, padding: '12px' }}
                >
                    Generate Study Material
                </button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', borderLeft: '3px solid var(--accent)' }}>
                <p className='muted' style={{ margin: 0, fontSize: '13px', lineHeight: 1.5 }}>
                    💡 <strong>Pro Tip:</strong> Want to practice these live? Head over to the <strong>Live Agent</strong> panel to connect via Voice/WebSocket for a real-time mock interview experience.
                </p>
            </div>

            {results.length === 0 ? (
                <div className='empty-state' style={{ padding: '48px 24px' }}>
                    <div className='empty-icon' style={{ opacity: 0.5, transform: 'scale(1.2)' }}>🎯</div>
                    <p style={{ marginTop: '16px', fontSize: '15px' }}>Configure your role and tech stack to generate practice Q&A.</p>
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
                            {renderInterviewPrep(entry.data) || (
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
