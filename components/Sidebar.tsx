'use client'

import { useState } from 'react'

type PanelKey =
    | 'pipeline'
    | 'live'
    | 'jobs'
    | 'resume'
    | 'cover'
    | 'company'
    | 'interview'
    | 'tracker'
    | 'network'
    | 'career'
    | 'profile'
    | 'test'
    | 'analytics'

type NavSection = {
    label: string
    items: Array<{ key: PanelKey; icon: string; label: string; badge?: string }>
}

const NAV_SECTIONS: NavSection[] = [
    {
        label: 'Automation',
        items: [
            { key: 'pipeline', icon: '🔄', label: 'Pipeline' },
            { key: 'live', icon: '⚡', label: 'Live Agent' },
        ],
    },
    {
        label: 'Research',
        items: [
            { key: 'jobs', icon: '🔍', label: 'Job Search' },
            { key: 'company', icon: '🏢', label: 'Company Intel' },
            { key: 'career', icon: '🚀', label: 'Career Paths' },
        ],
    },
    {
        label: 'Preparation',
        items: [
            { key: 'resume', icon: '📄', label: 'Resume Studio' },
            { key: 'cover', icon: '✉️', label: 'Cover Letter' },
            { key: 'interview', icon: '🎯', label: 'Interview Prep' },
        ],
    },
    {
        label: 'Tracking',
        items: [
            { key: 'tracker', icon: '📊', label: 'Tracker' },
            { key: 'network', icon: '🤝', label: 'Referrals' },
            { key: 'analytics', icon: '📈', label: 'Analytics' },
        ],
    },
    {
        label: 'Account',
        items: [
            { key: 'profile', icon: '👤', label: 'My Profile' },
            { key: 'test', icon: '🧪', label: 'Diagnostics' },
        ],
    },
]

const NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items)

type SidebarProps = {
    activePanel: PanelKey
    onPanelChange: (key: PanelKey) => void
    userEmail: string
}

export function Sidebar({ activePanel, onPanelChange, userEmail }: SidebarProps) {
    const [hoveredKey, setHoveredKey] = useState<PanelKey | null>(null)

    // Find which section contains the active panel
    const activeSectionLabel = NAV_SECTIONS.find(s => s.items.some(i => i.key === activePanel))?.label

    return (
        <aside className='sidebar'>
            {/* ── Brand ── */}
            <div className='sidebar-brand'>
                <div className='brand-block'>
                    <div className='brand-icon'>JS</div>
                    <div>
                        <p className='brand-title'>JobStream</p>
                        <p className='brand-sub'>AI Career Command Center</p>
                    </div>
                </div>
            </div>

            {/* ── CTA ── */}
            <div className='sidebar-cta-wrap'>
                <button className='sidebar-cta' onClick={() => onPanelChange('pipeline')}>
                    <span className='cta-icon'>＋</span>
                    New Session
                </button>
            </div>

            {/* ── Scrollable nav ── */}
            <nav className='sidebar-nav'>
                <div className='sidebar-scroll'>
                    {NAV_SECTIONS.map((section) => (
                        <div key={section.label} className='nav-section'>
                            <div className={`nav-section-label ${section.label === activeSectionLabel ? 'section-active' : ''}`}>
                                {section.label}
                            </div>
                            <div className='nav-section-items'>
                                {section.items.map((item) => {
                                    const isActive = activePanel === item.key
                                    const isHovered = hoveredKey === item.key
                                    return (
                                        <button
                                            key={item.key}
                                            className={`sidebar-link ${isActive ? 'active' : ''}`}
                                            onClick={() => onPanelChange(item.key)}
                                            onMouseEnter={() => setHoveredKey(item.key)}
                                            onMouseLeave={() => setHoveredKey(null)}
                                        >
                                            <span className='nav-icon'>{item.icon}</span>
                                            <span className='nav-label'>{item.label}</span>
                                            {item.badge && <span className='nav-badge'>{item.badge}</span>}
                                            {isActive && <span className='active-dot' />}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </nav>

            {/* ── Footer ── */}
            <div className='sidebar-footer'>
                <div className='sidebar-user'>
                    <div className='user-avatar'>
                        {userEmail.charAt(0).toUpperCase()}
                    </div>
                    <div className='user-info'>
                        <p className='sidebar-email'>{userEmail}</p>
                        <p className='sidebar-status'>
                            <span className='status-dot' />
                            Online
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    )
}

export type { PanelKey }
export { NAV_ITEMS }
