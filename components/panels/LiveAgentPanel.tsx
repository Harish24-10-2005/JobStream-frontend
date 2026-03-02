'use client'

import { useState, useRef, useEffect } from 'react'
import { ApiResponse } from '@/lib/api-client'

/* ── types ── */
type WsEvent = { type: string; data: string; ts: string; agent?: string }
type HitlRequest = { id: string; message: string; options?: string[] } | null
type TaskItem = { label: string; done: boolean }

type ChatEntry =
    | { kind: 'user'; text: string; ts: string }
    | { kind: 'agent'; text: string; ts: string; actionType?: string }
    | { kind: 'hitl'; id: string; message: string; ts: string; resolved?: boolean }
    | { kind: 'system'; text: string; ts: string }

type LiveAgentPanelProps = {
    token: string
    loading: boolean
    runAction: <T>(target: string, label: string, fn: () => Promise<ApiResponse<T>>) => void
    results: Array<{ label: string; data: unknown; at: string }>
    wsConnected: boolean
    wsEvents: WsEvent[]
    screenshot: string | null
    screenshots: string[]
    pendingHitl: HitlRequest
    tasks: TaskItem[]
    onStartApply: (url: string, draft: boolean) => void
    onResolveHitl: (id: string, response: string) => void
    onSendChat: (msg: string) => void
    onStopApply: () => void
}

/* ── helpers ── */
const TS = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
    catch { return '' }
}

const actionIcon = (type: string) => {
    if (type.includes('navigate') || type.includes('url')) return '🌐'
    if (type.includes('click') || type.includes('input')) return '🖱️'
    if (type.includes('screenshot') || type.includes('image')) return '📸'
    if (type.includes('python') || type.includes('code') || type.includes('script')) return '💻'
    if (type.includes('analyze') || type.includes('extract')) return '🔍'
    if (type.includes('hitl') || type.includes('draft') || type.includes('approval')) return '⚠️'
    if (type.includes('error') || type.includes('fail')) return '❌'
    if (type.includes('success') || type.includes('complete') || type.includes('done')) return '✅'
    if (type.includes('start') || type.includes('begin')) return '▶️'
    if (type.includes('stop') || type.includes('end')) return '⏹️'
    if (type.includes('chat') || type.includes('message')) return '💬'
    return '⚡'
}

const actionLabel = (type: string) => {
    return type
        .replace(/[:_-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim()
}

export function LiveAgentPanel({
    loading, wsConnected, wsEvents, screenshot, screenshots,
    pendingHitl, tasks, onStartApply, onResolveHitl, onSendChat, onStopApply,
}: LiveAgentPanelProps) {
    const [jobUrl, setJobUrl] = useState('')
    const [draft, setDraft] = useState(true)
    const [chatInput, setChatInput] = useState('')
    const [hitlResponse, setHitlResponse] = useState('')
    const [started, setStarted] = useState(false)
    const [activeThumb, setActiveThumb] = useState(-1)
    const chatEndRef = useRef<HTMLDivElement>(null)
    const displayImg = activeThumb >= 0 ? screenshots[activeThumb] : screenshot

    // Build unified chat timeline from events
    const chatHistory: ChatEntry[] = wsEvents
        .slice()
        .reverse()
        .map((ev) => {
            if (ev.type === 'hitl:request' || ev.type === 'draft:review') {
                return null; // Handled by inline pendingHitl prompt
            }
            if (ev.type.includes('screenshot') || (typeof ev.data === 'string' && ev.data === 'Browser screenshot')) {
                return null; // Don't show screenshot events in the chat
            }
            if (ev.type === 'chat:message' || ev.type === 'chat:user') {
                if (ev.agent === 'assistant' || ev.agent === 'agent' || ev.agent === 'applier') {
                    return { kind: 'agent' as const, text: ev.data, ts: ev.ts, actionType: 'chat:message' }
                } else if (ev.agent === 'system') {
                    return { kind: 'system' as const, text: ev.data, ts: ev.ts }
                }
                return { kind: 'user' as const, text: ev.data, ts: ev.ts }
            }
            if (ev.type === 'error' || ev.type === 'applier:error') {
                return { kind: 'system' as const, text: `Error: ${ev.data}`, ts: ev.ts }
            }
            return { kind: 'agent' as const, text: ev.data, ts: ev.ts, actionType: ev.type }
        })
        .filter(Boolean) as ChatEntry[]

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chatHistory.length])

    const handleSend = () => {
        const msg = chatInput.trim()
        if (!msg) return
        onSendChat(msg)
        setChatInput('')
    }

    const handleStart = () => {
        if (!jobUrl.trim()) return
        onStartApply(jobUrl.trim(), draft)
        setStarted(true)
    }

    return (
        <div className='agent-ui'>
            {/* ─── LEFT: Chat Column ─── */}
            <div className='agent-chat-col'>
                {/* Chat messages area */}
                <div className='agent-chat-messages'>
                    {!started && chatHistory.length === 0 ? (
                        <div className='agent-welcome'>
                            <div className='agent-welcome-icon'>⚡</div>
                            <h3>How can I help you?</h3>
                            <p>I can browse the web, find jobs, fill out applications, and take action for you.</p>
                            <div className='agent-start-card'>
                                <div className='agent-start-field'>
                                    <input
                                        className='agent-url-input'
                                        value={jobUrl}
                                        onChange={(e) => setJobUrl(e.target.value)}
                                        placeholder='Paste a job URL to start applying...'
                                        onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                                    />
                                </div>
                                <div className='agent-start-options'>
                                    <label className='agent-draft-toggle'>
                                        <input type='checkbox' checked={draft} onChange={(e) => setDraft(e.target.checked)} />
                                        <span>Draft Mode</span>
                                        <span className='muted' style={{ fontSize: 11 }}>Review before submitting</span>
                                    </label>
                                    <button
                                        className='agent-start-btn'
                                        disabled={!wsConnected || !jobUrl.trim()}
                                        onClick={handleStart}
                                    >
                                        ▶ Start Apply
                                    </button>
                                </div>
                                {!wsConnected && (
                                    <p className='agent-ws-warn'>⚠ WebSocket not connected — waiting for connection...</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Connection status */}
                            <div className='agent-sys-msg'>
                                <span className={`agent-ws-dot ${wsConnected ? 'on' : 'off'}`} />
                                {wsConnected ? 'Connected to live agent' : 'Disconnected — reconnecting...'}
                            </div>

                            {/* Initial task description if started */}
                            {started && jobUrl && (
                                <div className='agent-bubble user'>
                                    <div className='agent-bubble-content'>
                                        <p>Apply to this job:</p>
                                        <a href={jobUrl} target='_blank' rel='noreferrer'
                                            style={{ color: 'var(--accent)', wordBreak: 'break-all', fontSize: 13 }}>
                                            {jobUrl}
                                        </a>
                                        {draft && <span className='agent-badge draft'>Draft Mode</span>}
                                    </div>
                                    <span className='agent-bubble-ts'>You</span>
                                </div>
                            )}

                            {/* Chat timeline */}
                            {chatHistory.map((entry, i) => {
                                if (entry.kind === 'user') {
                                    return (
                                        <div key={i} className='agent-bubble user'>
                                            <div className='agent-bubble-content'>{entry.text}</div>
                                            <span className='agent-bubble-ts'>{TS(entry.ts)}</span>
                                        </div>
                                    )
                                }

                                if (entry.kind === 'system') {
                                    return (
                                        <div key={i} className='agent-sys-msg error'>
                                            {entry.text}
                                        </div>
                                    )
                                }

                                if (entry.kind === 'hitl') {
                                    return (
                                        <div key={i} className='agent-bubble hitl'>
                                            <div className='agent-hitl-badge'>⚠ Human Approval Required</div>
                                            <div className='agent-bubble-content'>{entry.message}</div>
                                        </div>
                                    )
                                }

                                // Agent action
                                return (
                                    <div key={i} className='agent-bubble agent'>
                                        <div className='agent-action-header'>
                                            <span className='agent-action-icon'>{actionIcon(entry.actionType || '')}</span>
                                            <span className='agent-action-label'>{actionLabel(entry.actionType || 'Action')}</span>
                                        </div>
                                        {entry.text && (
                                            <div className='agent-bubble-content'>
                                                {entry.text.length > 200 ? (
                                                    <details>
                                                        <summary>{entry.text.slice(0, 120)}…</summary>
                                                        <p>{entry.text}</p>
                                                    </details>
                                                ) : (
                                                    entry.text
                                                )}
                                            </div>
                                        )}
                                        <span className='agent-bubble-ts'>{TS(entry.ts)}</span>
                                    </div>
                                )
                            })}

                            {/* Inline HITL prompt */}
                            {pendingHitl && (
                                <div className='agent-hitl-inline'>
                                    <div className='agent-hitl-badge'>⚠ Needs Your Input</div>
                                    <p className='agent-hitl-msg'>{pendingHitl.message}</p>
                                    {pendingHitl.options && pendingHitl.options.length > 0 ? (
                                        <div className='agent-hitl-options'>
                                            {pendingHitl.options.map((opt) => (
                                                <button key={opt} className='agent-hitl-opt-btn' onClick={() => onResolveHitl(pendingHitl.id, opt)}>
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className='agent-hitl-freeform'>
                                            <input
                                                className='agent-url-input'
                                                value={hitlResponse}
                                                onChange={(e) => setHitlResponse(e.target.value)}
                                                placeholder='Type your response...'
                                                onKeyDown={(e) => { if (e.key === 'Enter' && hitlResponse) { onResolveHitl(pendingHitl.id, hitlResponse); setHitlResponse('') } }}
                                            />
                                            <button className='agent-hitl-approve' onClick={() => { onResolveHitl(pendingHitl.id, hitlResponse || 'approved'); setHitlResponse('') }}>
                                                ✓ Approve
                                            </button>
                                            <button className='agent-hitl-reject' onClick={() => onResolveHitl(pendingHitl.id, '__REJECT__')}>
                                                ✗ Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div ref={chatEndRef} />
                        </>
                    )}
                </div>

                {/* Chat input bar */}
                <div className='agent-chat-bar'>
                    {started && (
                        <button className='agent-stop-btn' onClick={() => { onStopApply(); setStarted(false) }} title='Stop agent'>
                            ■
                        </button>
                    )}
                    <div className='agent-chat-input-wrap'>
                        <input
                            className='agent-chat-input'
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder={started ? 'Queue message...' : 'Send a message...'}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                    </div>
                    <button className='agent-send-btn' onClick={handleSend} disabled={!chatInput.trim()}>
                        ↑
                    </button>
                    <span className='agent-chat-disclaimer'>AI can make mistakes. Please use with caution.</span>
                </div>
            </div>

            {/* ─── RIGHT: Browser + Tasks Column ─── */}
            <div className='agent-browser-col'>
                <div className='agent-browser-header'>
                    <span className='agent-browser-title'>JobStream&apos;s Computer</span>
                    <div className='agent-browser-controls'>
                        <span className={`agent-ws-dot ${wsConnected ? 'on' : 'off'}`} />
                        <span className='muted' style={{ fontSize: 11 }}>{wsConnected ? 'Live' : 'Offline'}</span>
                    </div>
                </div>

                <div className='agent-browser-viewport'>
                    {displayImg ? (
                        <>
                            <div className='agent-browser-chrome'>
                                <div className='agent-browser-dots'>
                                    <span /><span /><span />
                                </div>
                                <div className='agent-browser-url-bar'>
                                    <span className='agent-browse-icon'>🌐</span>
                                    <span className='agent-browse-label'>Browsing</span>
                                </div>
                            </div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img className='agent-browser-img' src={displayImg} alt='Live browser screenshot' />
                        </>
                    ) : (
                        <div className='agent-browser-empty'>
                            <div className='agent-browser-empty-icon'>🖥️</div>
                            <p>Browser output will appear here</p>
                            <p className='muted' style={{ fontSize: 12 }}>Start an application to see live screenshots</p>
                        </div>
                    )}
                </div>

                {/* Screenshot thumbnail strip */}
                {screenshots.length > 1 && (
                    <div className='agent-thumb-strip'>
                        {screenshots.map((src, i) => (
                            <button
                                key={i}
                                className={`agent-thumb ${i === activeThumb ? 'active' : ''}`}
                                onClick={() => setActiveThumb(i === activeThumb ? -1 : i)}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={src} alt={`Frame ${i + 1}`} />
                            </button>
                        ))}
                    </div>
                )}

                {/* Tasks panel */}
                <div className='agent-tasks-panel'>
                    <div className='agent-tasks-header'>
                        <span>Tasks</span>
                        {tasks.length > 0 && (
                            <span className='muted'>{tasks.filter((t) => t.done).length} / {tasks.length}</span>
                        )}
                    </div>
                    {tasks.length > 0 ? (
                        <ul className='agent-task-list'>
                            {tasks.map((t, i) => (
                                <li key={i} className={t.done ? 'done' : ''}>
                                    <span className='agent-task-icon'>{t.done ? '✅' : '⭕'}</span>
                                    {t.label}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className='muted' style={{ fontSize: 12, padding: '8px 0' }}>No tasks yet — start an application to track progress</p>
                    )}
                </div>
            </div>
        </div>
    )
}
