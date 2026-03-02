'use client'

import { useState } from 'react'
import { apiRequest } from '@/lib/api-client'

export type EducationEntry = {
    id?: string
    degree: string
    major: string
    university: string
    start_date?: string
    end_date?: string
    cgpa?: string | null
    is_current?: boolean
}

interface EducationListProps {
    token: string
    education: EducationEntry[]
    onUpdate: () => void
}

export function EducationList({ token, education, onUpdate }: EducationListProps) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const [formData, setFormData] = useState<Partial<EducationEntry>>({})

    const startAdd = () => {
        setIsAdding(true)
        setEditingId(null)
        setFormData({ degree: '', major: '', university: '', start_date: '', end_date: '', cgpa: '', is_current: false })
        setErrorMsg(null)
    }

    const startEdit = (entry: EducationEntry) => {
        setIsAdding(false)
        setEditingId(entry.id!)
        setFormData({ ...entry, cgpa: entry.cgpa || '' })
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
            const payload = { ...formData }
            if (payload.cgpa === '') payload.cgpa = null

            if (isAdding) {
                await apiRequest('/api/v1/user/education', {
                    method: 'POST',
                    token,
                    body: payload
                })
            } else if (editingId) {
                await apiRequest(`/api/v1/user/education/${editingId}`, {
                    method: 'PUT',
                    token,
                    body: payload
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
        if (!confirm('Are you sure you want to delete this education entry?')) return
        setLoading(true)
        try {
            await apiRequest(`/api/v1/user/education/${id}`, {
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
                <h3 className="premium-section-title" style={{ margin: 0 }}><span className="emoji">🎓</span> Education</h3>
                {!isAdding && !editingId && (
                    <button className="button small primary" onClick={startAdd}>+ Add Education</button>
                )}
            </div>

            {errorMsg && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{errorMsg}</p>}

            {(isAdding || editingId) && (
                <div className="result-card popup-edit-form" style={{ marginBottom: 20, border: '1px solid var(--accent-border)', background: 'rgba(255, 138, 31, 0.03)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <label>
                            <span className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>Degree</span>
                            <input className="input" value={formData.degree || ''} onChange={e => setFormData({ ...formData, degree: e.target.value })} placeholder="B.Sc., M.S., etc." />
                        </label>
                        <label>
                            <span className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>Major</span>
                            <input className="input" value={formData.major || ''} onChange={e => setFormData({ ...formData, major: e.target.value })} placeholder="Computer Science" />
                        </label>
                        <label style={{ gridColumn: 'span 2' }}>
                            <span className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>University / Institution</span>
                            <input className="input" value={formData.university || ''} onChange={e => setFormData({ ...formData, university: e.target.value })} placeholder="Stanford University" />
                        </label>
                        <label>
                            <span className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>Start Date</span>
                            <input type="month" className="input" value={formData.start_date || ''} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
                        </label>
                        <label>
                            <span className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>End Date</span>
                            <input type="month" className="input" value={formData.end_date || ''} onChange={e => setFormData({ ...formData, end_date: e.target.value })} disabled={formData.is_current} />
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="checkbox" checked={formData.is_current || false} onChange={e => setFormData({ ...formData, is_current: e.target.checked, end_date: e.target.checked ? '' : formData.end_date })} />
                            <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>Current</span>
                        </label>
                        <label>
                            <span className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>CGPA (Optional)</span>
                            <input className="input" value={formData.cgpa || ''} onChange={e => setFormData({ ...formData, cgpa: e.target.value })} placeholder="3.8/4.0" />
                        </label>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
                        <button className="button" onClick={handleCancel} disabled={loading}>Cancel</button>
                        <button className="button primary" onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
                    </div>
                </div>
            )}

            {!isAdding && education.length > 0 && (
                <div className="profile-timeline-container">
                    {education.map((edu, i) => (
                        <div key={edu.id || i} className="profile-timeline-item">
                            <div className="timeline-header">
                                <div>
                                    <div className="timeline-title">{edu.degree} in {edu.major}</div>
                                    <div className="timeline-subtitle">{edu.university}</div>
                                </div>
                                {edu.id && !editingId && (
                                    <div className="profile-actions">
                                        <button className="icon-btn" onClick={() => startEdit(edu)} title="Edit">✎</button>
                                        <button className="icon-btn danger" onClick={() => handleDelete(edu.id!)} title="Delete">×</button>
                                    </div>
                                )}
                            </div>
                            <div className="timeline-meta">
                                🗓 {edu.start_date || 'Unknown'} – {edu.is_current ? 'Present' : edu.end_date || 'Unknown'}
                                {edu.is_current && <span className="premium-tag blue" style={{ marginLeft: 8 }}>Current</span>}
                                {edu.cgpa && <span className="premium-tag purple" style={{ marginLeft: edu.is_current ? 4 : 8 }}>GPA: {edu.cgpa}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {!isAdding && education.length === 0 && (
                <p className="muted" style={{ fontSize: 14 }}>No education added yet.</p>
            )}
        </div>
    )
}
