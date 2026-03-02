'use client'

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

const NAV_ITEMS: Array<{ key: PanelKey; icon: string; label: string }> = [
    { key: 'pipeline', icon: '🔄', label: 'Pipeline' },
    { key: 'live', icon: '⚡', label: 'Live Agent' },
    { key: 'jobs', icon: '🔍', label: 'Job Search' },
    { key: 'resume', icon: '📄', label: 'Resume Studio' },
    { key: 'cover', icon: '✉️', label: 'Cover Letter' },
    { key: 'company', icon: '🏢', label: 'Company Intel' },
    { key: 'interview', icon: '🎯', label: 'Interview Prep' },
    { key: 'tracker', icon: '📊', label: 'Tracker' },
    { key: 'network', icon: '🤝', label: 'Referrals' },
    { key: 'career', icon: '🚀', label: 'Career Paths' },
    { key: 'profile', icon: '👤', label: 'My Profile' },
    { key: 'test', icon: '🧪', label: 'Test Dashboard' },
    { key: 'analytics', icon: '📈', label: 'Analytics' },
]

type SidebarProps = {
    activePanel: PanelKey
    onPanelChange: (key: PanelKey) => void
    userEmail: string
}

export function Sidebar({ activePanel, onPanelChange, userEmail }: SidebarProps) {
    return (
        <aside className='sidebar'>
            <div className='brand-block'>
                <div className='brand-icon'>JS</div>
                <div>
                    <p className='brand-title'>JobStream</p>
                    <p className='brand-sub'>AI Career Command Center</p>
                </div>
            </div>

            <button className='sidebar-cta' onClick={() => onPanelChange('pipeline')}>
                + New Session
            </button>

            <nav className='sidebar-nav'>
                {NAV_ITEMS.map((item) => (
                    <button
                        key={item.key}
                        className={`sidebar-link ${activePanel === item.key ? 'active' : ''}`}
                        onClick={() => onPanelChange(item.key)}
                    >
                        <span className='nav-icon'>{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </nav>

            <div className='sidebar-footer'>
                <p className='sidebar-email'>{userEmail}</p>
                <p className='muted' style={{ fontSize: 11 }}>Realtime AI Workspace</p>
            </div>
        </aside>
    )
}

export type { PanelKey }
export { NAV_ITEMS }
