'use client'

import { useState, useRef } from 'react'
import { apiRequest, ApiResponse } from '@/lib/api-client'

type CoverLetterPanelProps = {
    token: string
    roleName: string
    setRoleName: (v: string) => void
    companyName: string
    setCompanyName: (v: string) => void
    loading: boolean
    runAction: <T>(target: string, label: string, fn: () => Promise<ApiResponse<T>>) => void
    results: Array<{ label: string; data: unknown; at: string }>
}

function renderCoverLetter(data: unknown) {
    if (!data || typeof data !== 'object') return null
    const obj = data as Record<string, unknown>
    const text = obj.content || obj.full_text
    if (typeof text !== 'string' || !text) return null

    const copyToClipboard = () => { navigator.clipboard.writeText(text) }

    return (
        <div className='result-card' style={{ padding: '24px', background: 'var(--surface)', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {!!obj.job_title && <span className='pill' style={{ background: 'var(--accent)', color: '#fff', border: 'none' }}>{String(obj.job_title)}</span>}
                {!!obj.company_name && <span className='pill' style={{ background: 'var(--blue)', color: '#fff', border: 'none' }}>{String(obj.company_name)}</span>}
                {!!obj.tone && <span className='pill' style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-bright)', border: '1px solid rgba(255,255,255,0.1)' }}>{String(obj.tone)}</span>}
            </div>
            <div className='letter-preview' style={{ background: 'rgba(255,255,255,0.98)', color: '#111', padding: '32px', borderRadius: '8px', fontSize: '15px', lineHeight: 1.8, fontFamily: 'serif', whiteSpace: 'pre-wrap', position: 'relative', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)' }}>
                <button className='copy-btn' onClick={copyToClipboard} style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--surface)', color: 'var(--text-bright)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, transition: '0.2s hover' }}>
                    📋 Copy
                </button>
                {text}
            </div>
        </div>
    )
}

export function CoverLetterPanel({ token, roleName, setRoleName, companyName, setCompanyName, loading, runAction, results }: CoverLetterPanelProps) {
    const [tone, setTone] = useState('professional')
    const [techStack, setTechStack] = useState('')
    const [jobDesc, setJobDesc] = useState('')

    const [hitlRequest, setHitlRequest] = useState<{ message: string, context?: string } | null>(null)
    const [hitlInput, setHitlInput] = useState('')
    const wsRef = useRef<WebSocket | null>(null)

    const handleGenerate = () => {
        runAction('cover', 'Cover Letter', () => new Promise<ApiResponse<any>>((resolve) => {
            const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
            const wsUrl = `${WS_BASE_URL}/api/v1/cover-letter/ws-generate?token=${token}`
            const ws = new WebSocket(wsUrl)
            wsRef.current = ws

            ws.onopen = () => {
                ws.send(JSON.stringify({
                    action: 'generate',
                    role: roleName,
                    company: companyName,
                    tech_stack: techStack.split(',').map(s => s.trim()).filter(Boolean),
                    job_description: jobDesc || undefined,
                    tone: tone
                }))
            }

            ws.onmessage = (event) => {
                const msg = JSON.parse(event.data)
                if (msg.type === 'hitl:request') {
                    setHitlRequest({ message: msg.message, context: msg.context })
                } else if (msg.type === 'complete') {
                    setHitlRequest(null)
                    wsRef.current = null
                    resolve({ data: msg.data, headers: new Headers() })
                    ws.close()
                } else if (msg.type === 'error') {
                    setHitlRequest(null)
                    wsRef.current = null
                    resolve({ data: { error: msg.message } as any, headers: new Headers() })
                    ws.close()
                }
            }

            ws.onerror = () => {
                setHitlRequest(null)
                wsRef.current = null
                resolve({ data: { error: 'WebSocket connection failed' } as any, headers: new Headers() })
            }

            ws.onclose = () => {
                setHitlRequest(null)
                wsRef.current = null
            }
        }))
    }

    const submitHitl = (text: string) => {
        if (!wsRef.current) return
        wsRef.current.send(JSON.stringify({
            action: 'hitl_response',
            text: text
        }))
        setHitlRequest(null)
        setHitlInput('')
    }

    return (
        <div className='action-grid' style={{ gap: '24px' }}>
            <div className='section-header'>
                <h3>✉️ Cover Letter Orchestrator</h3>
                <p className='muted' style={{ margin: '4px 0 0', fontSize: '14px' }}>Generate hyper-personalized cover letters utilizing live hitl loops.</p>
            </div>

            <div className='field-row' style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr)', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Target Company *</label>
                    <input className='input' value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder='e.g. Acme Corp' />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Target Role *</label>
                    <input className='input' value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder='e.g. Design Engineer' />
                </div>
            </div>

            <div className='field-row' style={{ display: 'grid', gridTemplateColumns: '1fr 150px', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Tech Stack / Key Skills (Comma separated)</label>
                    <input className='input' value={techStack} onChange={(e) => setTechStack(e.target.value)} placeholder='e.g. React, Node.js, AWS' />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Tone</label>
                    <select className='select' value={tone} onChange={(e) => setTone(e.target.value)}>
                        <option value='professional'>Professional</option>
                        <option value='enthusiastic'>Enthusiastic</option>
                        <option value='formal'>Formal</option>
                        <option value='casual'>Casual</option>
                    </select>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Job Description (Optional)</label>
                <textarea
                    className='input'
                    style={{ minHeight: '80px', resize: 'vertical' }}
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    placeholder='Paste job description to map your skills perfectly against their requirements...'
                />
            </div>

            {hitlRequest && (
                <div className='agent-hitl-inline' style={{ margin: '16px 0', border: '1px solid var(--accent)', borderRadius: '12px', padding: '20px', background: 'rgba(255,138,31,0.05)', animation: 'cardIn 0.3s ease-out' }}>
                    <div className='agent-hitl-badge' style={{ display: 'inline-block', padding: '4px 10px', background: 'var(--accent)', color: '#fff', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '12px', boxShadow: '0 0 10px rgba(255,138,31,0.5)' }}>
                        ⚠ Human Intervention Required
                    </div>
                    <p style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 500 }}>{hitlRequest.message}</p>
                    {hitlRequest.context && (
                        <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', whiteSpace: 'pre-wrap', borderLeft: '3px solid var(--accent)', color: 'var(--text-muted)' }}>
                            {hitlRequest.context}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <input
                            className='input'
                            style={{ flex: 1, minWidth: '250px' }}
                            value={hitlInput}
                            onChange={(e) => setHitlInput(e.target.value)}
                            placeholder='Instructions (e.g., "Make it shorter" or leave blank to approve)'
                            onKeyDown={(e) => e.key === 'Enter' && submitHitl(hitlInput || 'approved')}
                        />
                        <button className='button primary' onClick={() => submitHitl(hitlInput || 'approved')}>
                            {hitlInput ? 'Revise' : 'Approve'}
                        </button>
                        <button className='button' onClick={() => submitHitl('abort')} style={{ background: 'rgba(255,255,255,0.1)' }}>Abort</button>
                    </div>
                </div>
            )}

            <div className='field-row' style={{ marginTop: '8px' }}>
                <button
                    className='button primary'
                    disabled={loading || !roleName || !companyName || !!hitlRequest}
                    onClick={handleGenerate}
                    style={{ flex: 1, padding: '12px' }}
                >
                    {wsRef.current ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <div className='spinner' style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            Drafting Letter...
                        </span>
                    ) : 'Generate Cover Letter'}
                </button>
                <button className='button' disabled={loading || !!wsRef.current || !!hitlRequest} onClick={() => runAction('cover', 'History', () => apiRequest('/api/v1/cover-letter/history', { token }))} style={{ padding: '12px 24px' }}>
                    Load History
                </button>
            </div>

            {results.length === 0 ? (
                <div className='empty-state' style={{ padding: '48px 24px' }}>
                    <div className='empty-icon' style={{ opacity: 0.5, transform: 'scale(1.2)' }}>✉️</div>
                    <p style={{ marginTop: '16px', fontSize: '15px' }}>Draft a tailored cover letter to preview it here</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '16px' }}>
                    {results.map((entry) => (
                        <div key={`${entry.label}_${entry.at}`} style={{ animation: 'slideDownFade 0.4s ease-out' }}>
                            <div className='result-head' style={{ marginBottom: '16px' }}>
                                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }}></span>
                                    {entry.label}
                                </h4>
                                <span className='muted' style={{ fontSize: 11 }}>{new Date(entry.at).toLocaleTimeString()}</span>
                            </div>
                            {renderCoverLetter(entry.data) || (
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
