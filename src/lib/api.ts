type ApiResponse<T> = {
  status: number
  data: T
  message: string
}

const API_BASE =
  (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_API_BASE ?? ''

async function request<T>(
  path: string,
  options: {
    method?: string
    body?: Record<string, unknown>
    token?: string
  } = {},
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, token } = options
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  let payload: ApiResponse<T>
  try {
    payload = (await res.json()) as ApiResponse<T>
  } catch {
    throw new Error('Unexpected server response')
  }

  if (!res.ok) {
    throw new Error(payload.message || 'Request failed')
  }

  return payload
}

export const api = {
  login(email: string, password: string) {
    return request<{
      token: string
      user: { id: string; username: string; email: string; role: string }
    }>('/user/login', { method: 'POST', body: { email, password } })
  },
  register(username: string, email: string, password: string) {
    return request<{
      token: string
      user: { id: string; username: string; email: string; role: string }
    }>('/user/register', { method: 'POST', body: { username, email, password } })
  },
  sendCode(email: string, type: 'forgot-password' | 'register') {
    return request<{ code?: string }>('/user/send-code', { method: 'POST', body: { email, type } })
  },
  resetPassword(email: string, code: string, newPassword: string) {
    return request<null>('/user/forgot-password', {
      method: 'POST',
      body: { email, code, newPassword },
    })
  },
  getProfile(token: string) {
    return request<{
      id: string
      username: string
      email: string
      role: string
      isActive: boolean
      createdAt: string
    }>('/user/profile', { token })
  },
  updateProfile(token: string, payload: { username?: string; password?: string }) {
    return request<{
      id: string
      username: string
      email: string
      role: string
      isActive: boolean
      createdAt: string
    }>('/user/profile/update', { method: 'POST', token, body: payload })
  },
}
