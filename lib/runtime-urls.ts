const DEFAULT_BACKEND_PORT = process.env.NEXT_PUBLIC_BACKEND_PORT || '8000'

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '')
}

export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (configured) return normalizeBaseUrl(configured)

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
    return `${protocol}//${window.location.hostname}:${DEFAULT_BACKEND_PORT}`
  }

  return `http://localhost:${DEFAULT_BACKEND_PORT}`
}

export function getWsBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_WS_URL?.trim()
  if (configured) return normalizeBaseUrl(configured)

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.hostname}:${DEFAULT_BACKEND_PORT}`
  }

  return `ws://localhost:${DEFAULT_BACKEND_PORT}`
}
