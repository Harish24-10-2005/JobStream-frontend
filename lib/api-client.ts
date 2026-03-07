import { getApiBaseUrl } from '@/lib/runtime-urls'

export type ApiErrorCode = 401 | 402 | 403 | 429 | 500

export class ApiError extends Error {
  status: number
  payload: unknown
  headers: Headers
  constructor(status: number, message: string, payload: unknown, headers: Headers) {
    super(message)
    this.status = status
    this.payload = payload
    this.headers = headers
  }
}

export type ApiResponse<T> = {
  data: T
  headers: Headers
}

function buildUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  return `${getApiBaseUrl()}${path}`
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    token?: string
    body?: unknown
    idempotencyKey?: string
  } = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`
  }

  if (options.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey
  }

  const response = await fetch(buildUrl(path), {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  })

  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    let message = `Request failed: ${response.status}`
    if (typeof payload === 'object' && payload) {
      if ('message' in payload && typeof payload.message === 'string') {
        message = payload.message
      } else if ('detail' in payload && typeof payload.detail === 'string') {
        message = payload.detail
      }
    }
    throw new ApiError(response.status, message, payload, response.headers)
  }

  return {
    data: payload as T,
    headers: response.headers
  }
}

export function mapApiError(status: number): string {
  if (status === 401) return 'Session expired or invalid. Please sign in again.'
  if (status === 402) return 'Usage credits exhausted. Please upgrade or wait for reset.'
  if (status === 403) return 'Access denied for this action.'
  if (status === 429) return 'Rate limit exceeded. Please retry in a few seconds.'
  return 'Unexpected server error.'
}
