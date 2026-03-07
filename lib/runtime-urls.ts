const DEFAULT_BACKEND_PORT = process.env.NEXT_PUBLIC_BACKEND_PORT || '8000'

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '')
}

function readPublicEnv(name: 'NEXT_PUBLIC_API_URL' | 'NEXT_PUBLIC_WS_URL'): string | null {
  const raw = process.env[name]
  if (!raw) return null
  const trimmed = raw.trim().replace(/^['"]|['"]$/g, '')
  return trimmed ? normalizeBaseUrl(trimmed) : null
}

export function getApiBaseUrl(): string {
  const configured = readPublicEnv('NEXT_PUBLIC_API_URL')
  if (configured) return normalizeBaseUrl(configured)

  const wsConfigured = readPublicEnv('NEXT_PUBLIC_WS_URL')
  if (wsConfigured) {
    return wsConfigured.replace(/^wss?:\/\//i, (match) => (match.toLowerCase() === 'wss://' ? 'https://' : 'http://'))
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
    return `${protocol}//${window.location.hostname}:${DEFAULT_BACKEND_PORT}`
  }

  return `http://localhost:${DEFAULT_BACKEND_PORT}`
}

export function getWsBaseUrl(): string {
  const configured = readPublicEnv('NEXT_PUBLIC_WS_URL')
  if (configured) return normalizeBaseUrl(configured)

  const apiConfigured = readPublicEnv('NEXT_PUBLIC_API_URL')
  if (apiConfigured) {
    return apiConfigured.replace(/^https?:\/\//i, (match) => (match.toLowerCase() === 'https://' ? 'wss://' : 'ws://'))
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.hostname}:${DEFAULT_BACKEND_PORT}`
  }

  return `ws://localhost:${DEFAULT_BACKEND_PORT}`
}
