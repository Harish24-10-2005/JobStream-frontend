'use client'

import { useState } from 'react'
import { apiRequest } from '@/lib/api-client'

export type ExperienceEntry = {
    id?: string
    title: string
    company: string
    start_date?: string
    end_date?: string
    is_current?: boolean
    description?: string
}

interface ExperienceListProps {
    token: string
    experience: ExperienceEntry[]
    onUpdate: () => void
}

export function ExperienceList({ token, experience, onUpdate }: ExperienceListProps) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const [formData, setFormData] = useState<Partial<ExperienceEntry>>({})

    const startAdd = () => {
        setIsAdding(true)
        setEditingId(null)
        setFormData({ title: '', company: '', start_date: '', end_date: '', is_current: false, description: '' })
        setErrorMsg(null)
    }

    const startEdit = (entry: ExperienceEntry) => {
        setIsAdding(false)
        setEditingId(entry.id!)
        setFormData({ ...entry })
        setErrorMsg(null)
    }

    const handleCancel = () => {
        setIsAdding(false)
        setEditingId(null)
        setFormData({})
        setErrorMsg(null)
    }

    const handleSave = async () => {
        setLoading(true)
        setErrorMsg(null)
        try {
            if (isAdding) {
                await apiRequest('/api/v1/user/experience', {
                    method: 'POST',
                    token,
                    body: formData
                })
            } else if (editingId) {
                await apiRequest(`/api/v1/user/experience/${editingId}`, {
                    method: 'PUT',
                    token,
                    body: formData
                })
            }
            onUpdate()
            handleCancel()
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : 'Failed to save')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this experience entry?')) return
        setLoading(true)
        try {
            await apiRequest(`/api/v1/user/experience/${id}`, {
                method: 'DELETE',
                token,
            })
            onUpdate()
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="profile-card">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 className="premium-section-title" style={{ margin: 0 }}><span className="emoji">💼</span> Experience</h3>
                {!isAdding && !editingId && (
                    <button className="button small primary" onClick={startAdd}>+ Add Experience</button>
                )}
            </div>

            {errorMsg && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{errorMsg}</p>}

            {(isAdding || editingId) && (
                <div className="result-card popup-edit-form" style={{ marginBottom: 20, border: '1px solid var(--accent-border)', background: 'rgba(255, 138, 31, 0.03)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <label>
                            <span className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>Job Title</span>
                            <input className="input" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Software Engineer" />
                        </label>
                        <label>
                            <span className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>Company</span>
                            <input className="input" value={formData.company || ''} onChange={e => setFormData({ ...formData, company: e.target.value })} placeholder="Google" />
                        </label>
                        <label>
                            <span className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>Start Date</span>
                            <input type="month" className="input" value={formData.start_date || ''} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
                        </label>
                        <label>
                            <span className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>End Date</span>
                            <input type="month" className="input" value={formData.end_date || ''} onChange={e => setFormData({ ...formData, end_date: e.target.value })} disabled={formData.is_current} />
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, gridColumn: 'span 2' }}>
                            <input type="checkbox" checked={formData.is_current || false} onChange={e => setFormData({ ...formData, is_current: e.target.checked, end_date: e.target.checked ? '' : formData.end_date })} />
                            <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>I currently work here</span>
                        </label>
                        <label style={{ gridColumn: 'span 2' }}>
                            <span className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>Description</span>
                            <textarea className="textarea" rows={3} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Describe what you did..." />
                        </label>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
                        <button className="button" onClick={handleCancel} disabled={loading}>Cancel</button>
                        <button className="button primary" onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
                    </div>
                </div>
            )}

            {!isAdding && experience.length > 0 && (
                <div className="profile-timeline-container">
                    {experience.map((exp, i) => (
                        <div key={exp.id || i} className="profile-timeline-item">
                            <div className="timeline-header">
                                <div>
                                    <div className="timeline-title">{exp.title}</div>
                                    <div className="timeline-subtitle">{exp.company}</div>
                                </div>
                                {exp.id && !editingId && (
                                    <div className="profile-actions">
                                        <button className="icon-btn" onClick={() => startEdit(exp)} title="Edit">✎</button>
                                        <button className="icon-btn danger" onClick={() => handleDelete(exp.id!)} title="Delete">×</button>
                                    </div>
                                )}
                            </div>
                            <div className="timeline-meta">
                                🗓 {exp.start_date || 'Unknown'} – {exp.is_current ? 'Present' : exp.end_date || 'Unknown'}
                                {exp.is_current && <span className="premium-tag blue" style={{ marginLeft: 8 }}>Current</span>}
                            </div>
                            {exp.description && (
                                <div className="timeline-body">{exp.description}</div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {!isAdding && experience.length === 0 && (
                <p className="muted" style={{ fontSize: 14 }}>No experience added yet.</p>
            )}
        </div>
    )
}
