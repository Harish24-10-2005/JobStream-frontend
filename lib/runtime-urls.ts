const DEFAULT_BACKEND_PORT = '8000'

// Next.js only inlines NEXT_PUBLIC_* vars when accessed as static literals.
// Using process.env[dynamicKey] will NOT be replaced at build time.
const ENV_API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''
const ENV_WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? ''

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '')
}

function readEnv(value: string): string | null {
  const trimmed = value.trim().replace(/^['"]|['"]$/g, '')
  return trimmed ? normalizeBaseUrl(trimmed) : null
}

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

export function getApiBaseUrl(): string {
  const configured = readEnv(ENV_API_URL)
  if (configured) return configured

  const wsConfigured = readEnv(ENV_WS_URL)
  if (wsConfigured) {
    return wsConfigured.replace(/^wss?:\/\//i, (match) => (match.toLowerCase() === 'wss://' ? 'https://' : 'http://'))
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
    const host = window.location.hostname
    if (isLocalHost(host)) {
      return `${protocol}//${host}:${DEFAULT_BACKEND_PORT}`
    }
    return `${protocol}//${host}`
  }

  return `http://localhost:${DEFAULT_BACKEND_PORT}`
}

export function getWsBaseUrl(): string {
  const configured = readEnv(ENV_WS_URL)
  if (configured) return configured

  const apiConfigured = readEnv(ENV_API_URL)
  if (apiConfigured) {
    return apiConfigured.replace(/^https?:\/\//i, (match) => (match.toLowerCase() === 'https://' ? 'wss://' : 'ws://'))
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.hostname
    if (isLocalHost(host)) {
      return `${protocol}//${host}:${DEFAULT_BACKEND_PORT}`
    }
    return `${protocol}//${host}`
  }

  return `ws://localhost:${DEFAULT_BACKEND_PORT}`
}
