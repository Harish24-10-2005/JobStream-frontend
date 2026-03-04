'use client'

type PrettyResponseProps = {
  data: unknown
  compact?: boolean
}

function formatKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function isPrimitive(value: unknown): value is string | number | boolean | null {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value)
}

function RenderNode({ value, depth, compact }: { value: unknown; depth: number; compact: boolean }) {
  if (depth > 4) {
    return <span className='muted'>Nested data</span>
  }

  if (value === null) return <span className='muted'>—</span>
  if (typeof value === 'boolean') return <span style={{ color: value ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>{value ? '✅ Yes' : '❌ No'}</span>
  if (typeof value === 'number') return <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{value.toLocaleString()}</span>
  if (typeof value === 'string') {
    // Long strings: display as paragraph
    if (value.length > 120) {
      return <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.65, color: 'var(--text-2)' }}>{value}</p>
    }
    // URLs
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return <a href={value} target='_blank' rel='noreferrer' style={{ color: 'var(--blue)', fontWeight: 500, fontSize: '13px', wordBreak: 'break-all' }}>{value} ↗</a>
    }
    return <span style={{ color: 'var(--text-2)' }}>{value}</span>
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className='muted'>No items</span>

    // All primitives → chip list
    if (value.every(isPrimitive)) {
      return (
        <div className='pretty-chips'>
          {value.map((item, index) => (
            <span key={`${String(item)}_${index}`} className='chip'>
              {String(item)}
            </span>
          ))}
        </div>
      )
    }

    // Array of objects → card list
    return (
      <div className='pretty-list'>
        {value.map((item, index) => {
          // Try to use a meaningful title from each object
          const itemObj = item && typeof item === 'object' && !Array.isArray(item) ? item as Record<string, unknown> : null
          const title = itemObj
            ? String(itemObj.title || itemObj.name || itemObj.flag || itemObj.question || itemObj.skill || `Item ${index + 1}`)
            : `Item ${index + 1}`

          return (
            <div key={index} className='pretty-list-item'>
              <div className='pretty-item-title'>{title}</div>
              <RenderNode value={item} depth={depth + 1} compact={compact} />
            </div>
          )
        })}
      </div>
    )
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined && v !== null && v !== '')
    if (entries.length === 0) return <span className='muted'>No data</span>

    // Small flat objects (depth >= 1, <= 5 keys, all primitives) → inline metric cards
    const allPrimitive = entries.every(([, v]) => isPrimitive(v))
    if (allPrimitive && entries.length <= 6 && depth >= 1) {
      return (
        <div className='result-metrics' style={{ gap: '8px' }}>
          {entries.map(([key, val]) => (
            <div key={key} className='metric'>
              <span>{formatKey(key)}</span>
              <p><RenderNode value={val} depth={depth + 1} compact={compact} /></p>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className={`pretty-grid ${compact ? 'compact' : ''}`}>
        {entries.map(([key, val]) => (
          <div key={key} className='pretty-field'>
            <div className='pretty-key'>{formatKey(key)}</div>
            <div className='pretty-value'>
              <RenderNode value={val} depth={depth + 1} compact={compact} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return <span className='muted'>Unsupported value</span>
}

export function PrettyResponse({ data, compact = false }: PrettyResponseProps) {
  return (
    <div className={`pretty-response ${compact ? 'compact' : ''}`}>
      <RenderNode value={data} depth={0} compact={compact} />
    </div>
  )
}
