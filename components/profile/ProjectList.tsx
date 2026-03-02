'use client'

import { useState } from 'react'
import { apiRequest } from '@/lib/api-client'

export type ProjectEntry = {
    id?: string
    name: string
    tech_stack?: string[]
    description?: string
    project_url?: string
}

interface ProjectListProps {
    token: string
    projects: ProjectEntry[]
    onUpdate: () => void
}

export function ProjectList({ token, projects, onUpdate }: ProjectListProps) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const [formData, setFormData] = useState<Partial<ProjectEntry>>({})

    const startAdd = () => {
        setIsAdding(true)
        setEditingId(null)
        setFormData({ name: '', tech_stack: [], description: '', project_url: '' })
        setErrorMsg(null)
    }

    const startEdit = (entry: ProjectEntry) => {
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
                await apiRequest('/api/v1/user/projects', {
                    method: 'POST',
                    token,
                    body: formData
                })
            } else if (editingId) {
                await apiRequest(`/api/v1/user/projects/${editingId}`, {
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
        if (!confirm('Are you sure you want to delete this project?')) return
        setLoading(true)
        try {
            await apiRequest(`/api/v1/user/projects/${id}`, {
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
                <h3 className="premium-section-title" style={{ margin: 0 }}><span className="emoji">🚀</span> Projects</h3>
                {!isAdding && !editingId && (
                    <button className="button small primary" onClick={startAdd}>+ Add Project</button>
                )}
            </div>

            {errorMsg && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{errorMsg}</p>}

            {(isAdding || editingId) && (
                <div className="result-card popup-edit-form" style={{ marginBottom: 20, border: '1px solid var(--accent-border)', background: 'rgba(255, 138, 31, 0.03)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <label style={{ gridColumn: 'span 2' }}>
                            <span className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>Project Name</span>
                            <input className="input" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Awesome Game Engine" />
                        </label>
                        <label style={{ gridColumn: 'span 2' }}>
                            <span className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>Project URL (Optional)</span>
                            <input className="input" value={formData.project_url || ''} onChange={e => setFormData({ ...formData, project_url: e.target.value })} placeholder="https://github.com/..." />
                        </label>
                        <label style={{ gridColumn: 'span 2' }}>
                            <span className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>Tech Stack (comma separated)</span>
                            <input
                                className="input"
                                value={formData.tech_stack?.join(', ') || ''}
                                onChange={e => setFormData({ ...formData, tech_stack: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                placeholder="React, Node.js, PostgreSQL"
                            />
                        </label>
                        <label style={{ gridColumn: 'span 2' }}>
                            <span className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>Description</span>
                            <textarea className="textarea" rows={3} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the project..." />
                        </label>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
                        <button className="button" onClick={handleCancel} disabled={loading}>Cancel</button>
                        <button className="button primary" onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
                    </div>
                </div>
            )}

            {!isAdding && projects.length > 0 && (
                <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
                    {projects.map((proj, i) => (
                        <div key={proj.id || i} className="profile-timeline-item">
                            <div className="timeline-header">
                                <div>
                                    <div className="timeline-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {proj.name}
                                        {proj.project_url && (
                                            <a href={proj.project_url} target="_blank" rel="noreferrer" className="premium-tag blue" style={{ padding: '2px 8px', fontSize: 11, textDecoration: 'none' }}>Live Link ↗</a>
                                        )}
                                    </div>
                                    {proj.tech_stack && proj.tech_stack.length > 0 && (
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                                            {proj.tech_stack.map((t, j) => (
                                                <span key={j} className="premium-tag">{t}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {proj.id && !editingId && (
                                    <div className="profile-actions" style={{ opacity: 1 }}>
                                        <button className="icon-btn" onClick={() => startEdit(proj)} title="Edit">✎</button>
                                        <button className="icon-btn danger" onClick={() => handleDelete(proj.id!)} title="Delete">×</button>
                                    </div>
                                )}
                            </div>
                            {proj.description && (
                                <div className="timeline-body" style={{ marginTop: 12 }}>{proj.description}</div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {!isAdding && projects.length === 0 && (
                <p className="muted" style={{ fontSize: 14 }}>No projects added yet.</p>
            )}
        </div>
    )
}
