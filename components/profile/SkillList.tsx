'use client'

import { useState } from 'react'
import { apiRequest } from '@/lib/api-client'

interface SkillListProps {
    token: string
    skills: Record<string, string[]> | null
    onUpdate: () => void
}

export function SkillList({ token, skills, onUpdate }: SkillListProps) {
    const [editing, setEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const [localSkills, setLocalSkills] = useState<Record<string, string>>({})

    const startEdit = () => {
        setEditing(true)
        setErrorMsg(null)
        const initial: Record<string, string> = {}
        if (skills) {
            Object.entries(skills).forEach(([cat, list]) => {
                initial[cat] = list.join(', ')
            })
        }
        // Default to at least 'primary' category if empty
        if (!initial['primary']) initial['primary'] = ''
        setLocalSkills(initial)
    }

    const handleSave = async () => {
        setLoading(true)
        setErrorMsg(null)
        try {
            const payload: Record<string, string[]> = {}
            Object.entries(localSkills).forEach(([cat, val]) => {
                const parsed = val.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
                if (parsed.length > 0) {
                    payload[cat] = parsed
                }
            })

            await apiRequest('/api/v1/user/profile', {
                method: 'PUT',
                token,
                body: { skills: payload }
            })
            onUpdate()
            setEditing(false)
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : 'Failed to save skills')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="profile-card">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 className="premium-section-title" style={{ margin: 0 }}><span className="emoji">🛠</span> Skills</h3>
                {!editing ? (
                    <button className="button small primary" onClick={startEdit}>✎ Edit Skills</button>
                ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="button small success" onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
                        <button className="button small" onClick={() => setEditing(false)} disabled={loading}>Cancel</button>
                    </div>
                )}
            </div>

            {errorMsg && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{errorMsg}</p>}

            {editing ? (
                <div className="result-card popup-edit-form" style={{ marginBottom: 20, border: '1px solid var(--accent-border)', background: 'rgba(255, 138, 31, 0.03)' }}>
                    {Object.keys(localSkills).map(cat => (
                        <label key={cat} style={{ display: 'block', marginBottom: 16 }}>
                            <span className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500, textTransform: 'capitalize' }}>{cat} Skills (comma separated)</span>
                            <input className="input" value={localSkills[cat]} onChange={e => setLocalSkills({ ...localSkills, [cat]: e.target.value })} placeholder="React, Node.js, Python..." />
                        </label>
                    ))}
                    <button className="button small" onClick={() => {
                        const newCat = prompt("Enter new category name (e.g., 'languages', 'tools'):")
                        if (newCat && newCat.trim()) {
                            if (!localSkills[newCat.trim().toLowerCase()]) {
                                setLocalSkills({ ...localSkills, [newCat.trim().toLowerCase()]: '' })
                            }
                        }
                    }}>+ Add Category</button>
                </div>
            ) : (
                <div style={{ padding: '4px 0' }}>
                    {!skills || Object.keys(skills).length === 0 ? (
                        <p className="muted" style={{ fontSize: 14 }}>No skills added yet.</p>
                    ) : (
                        Object.entries(skills).map(([category, items]) => (
                            <div key={category} style={{ marginBottom: 20 }}>
                                <span className="muted" style={{ fontSize: 12, textTransform: 'capitalize', fontWeight: 500, display: 'block', marginBottom: 8 }}>{category}</span>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {(items as string[]).map((skill, i) => (
                                        <span key={i} className="premium-tag">{skill}</span>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
