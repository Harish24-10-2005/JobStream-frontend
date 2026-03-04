'use client'

import { useState, useRef, useEffect } from 'react'

type WorkspacePrefs = {
  accent: 'ember' | 'ocean' | 'emerald'
  density: 'comfortable' | 'compact'
  radius: 'soft' | 'sharp'
  motion: 'full' | 'reduced'
  intentMode: 'balanced' | 'aggressive' | 'conservative'
}

type TopbarProps = {
  sessionId: string
  wsConnected: boolean
  creditQueries: string | null
  creditTokens: string | null
  prefs: WorkspacePrefs
  onPrefsChange: (prefs: WorkspacePrefs) => void
  onRefresh: () => void
  onSignOut: () => void
}

export function Topbar({ sessionId, wsConnected, creditQueries, creditTokens, prefs, onPrefsChange, onRefresh, onSignOut }: TopbarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)

  const updatePrefs = <K extends keyof WorkspacePrefs>(key: K, value: WorkspacePrefs[K]) => {
    onPrefsChange({ ...prefs, [key]: value })
  }

  // Close settings on outside click
  useEffect(() => {
    if (!settingsOpen) return
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [settingsOpen])

  return (
    <header className='topbar'>
      <div className='topbar-left'>
        <span className='project-tag'>
          <span style={{ marginRight: 6, fontSize: 13 }}>⚙</span>
          {sessionId.slice(0, 10)}
        </span>
      </div>
      <div className='topbar-right' ref={settingsRef}>
        <span className={`pill ${wsConnected ? 'ok' : 'warn'}`}>
          {wsConnected ? 'Connected' : 'Disconnected'}
        </span>
        <span className='pill info' title='Queries remaining'>
          <span style={{ opacity: 0.6, marginRight: 2 }}>Q:</span> {creditQueries || '--'}
        </span>
        <span className='pill info' title='Tokens remaining'>
          <span style={{ opacity: 0.6, marginRight: 2 }}>T:</span> {creditTokens || '--'}
        </span>

        <button className='button' onClick={onRefresh} title='Refresh credits'>
          ↻ Refresh
        </button>
        <button
          className='button'
          onClick={() => setSettingsOpen((v) => !v)}
          style={settingsOpen ? { borderColor: 'var(--accent-border)', color: 'var(--accent)' } : {}}
          title='Workspace settings'
        >
          ⚙ Customize
        </button>
        <button className='button' onClick={onSignOut} title='Sign out'>
          Sign Out
        </button>

        {settingsOpen && (
          <div className='workspace-settings'>
            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--text)' }}>Workspace Settings</p>
            <div className='workspace-settings-row'>
              <label>Intent</label>
              <select value={prefs.intentMode} onChange={(e) => updatePrefs('intentMode', e.target.value as WorkspacePrefs['intentMode'])}>
                <option value='balanced'>Balanced</option>
                <option value='aggressive'>Aggressive</option>
                <option value='conservative'>Conservative</option>
              </select>
            </div>
            <div className='workspace-settings-row'>
              <label>Accent</label>
              <select value={prefs.accent} onChange={(e) => updatePrefs('accent', e.target.value as WorkspacePrefs['accent'])}>
                <option value='ember'>🟠 Ember</option>
                <option value='ocean'>🔵 Ocean</option>
                <option value='emerald'>🟢 Emerald</option>
              </select>
            </div>
            <div className='workspace-settings-row'>
              <label>Density</label>
              <select value={prefs.density} onChange={(e) => updatePrefs('density', e.target.value as WorkspacePrefs['density'])}>
                <option value='comfortable'>Comfortable</option>
                <option value='compact'>Compact</option>
              </select>
            </div>
            <div className='workspace-settings-row'>
              <label>Corners</label>
              <select value={prefs.radius} onChange={(e) => updatePrefs('radius', e.target.value as WorkspacePrefs['radius'])}>
                <option value='soft'>Soft</option>
                <option value='sharp'>Sharp</option>
              </select>
            </div>
            <div className='workspace-settings-row'>
              <label>Motion</label>
              <select value={prefs.motion} onChange={(e) => updatePrefs('motion', e.target.value as WorkspacePrefs['motion'])}>
                <option value='full'>Full</option>
                <option value='reduced'>Reduced</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
