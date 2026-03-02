'use client'

type TopbarProps = {
    sessionId: string
    wsConnected: boolean
    creditQueries: string | null
    creditTokens: string | null
    onRefresh: () => void
    onSignOut: () => void
}

export function Topbar({ sessionId, wsConnected, creditQueries, creditTokens, onRefresh, onSignOut }: TopbarProps) {
    return (
        <header className='topbar'>
            <div className='topbar-left'>
                <span className='project-tag'>JobStream</span>
                <span className='muted' style={{ fontSize: 12 }}>Session: {sessionId.slice(0, 16)}...</span>
            </div>
            <div className='topbar-right'>
                <span className={`pill ${wsConnected ? 'ok' : 'warn'}`}>
                    {wsConnected ? 'Connected' : 'Disconnected'}
                </span>
                <span className='pill info'>Queries: {creditQueries || '--'}</span>
                <span className='pill info'>Tokens: {creditTokens || '--'}</span>
                <button className='button' onClick={onRefresh}>Refresh</button>
                <button className='button' onClick={onSignOut}>Sign Out</button>
            </div>
        </header>
    )
}
