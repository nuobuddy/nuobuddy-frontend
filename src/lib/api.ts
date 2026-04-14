import axiosInstance from './axios'

// ==================== Type Definitions ====================

// Pagination type from backend
export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// User type matching backend response
export interface User {
  id: string
  username: string
  email: string
  role: 'user' | 'admin'
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

// Conversation type from GET /chat/conversations
export interface Conversation {
  id: string
  title: string | null
  difyConversationId: string | null
  createdAt: string
  updatedAt: string
  share?: boolean
  accessible?: boolean
}

export interface MessageAttachment {
  id: string
  name: string
  size: number
  mimeType: string | null
  fileType: ChatFileType
}

// Message type for conversation detail
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  attachments?: MessageAttachment[] | null
}

export type ChatFileType = 'image' | 'document' | 'audio' | 'video' | 'custom'

export interface ChatMessageFile {
  type: ChatFileType
  transfer_method: 'local_file'
  upload_file_id: string
}

export interface UploadedChatFile {
  id: string
  name: string
  size: number
  extension: string | null
  mimeType: string | null
  fileType: ChatFileType
}

// Conversation detail includes messages
export interface ConversationDetail extends Conversation {
  messages: Message[]
}

// System setting item from GET /admin/settings
export interface SettingItem {
  key: string
  value: string
  description?: string | null
  updatedAt?: string
}

// Flat settings record for update
export type SystemSettings = Record<string, string>

// SSE event types for chat streaming
export type SSEEvent =
  | { event: 'delta'; content: string; taskId?: string }
  | { event: 'task'; taskId: string }
  | { event: 'done'; conversationId: string }
  | { event: 'error'; message: string }
  | { event: 'ping' }

// ==================== API Client ====================
// All methods return unwrapped data (the interceptor strips the { status, data, message } envelope)

export const api = {
  // ==================== Auth Endpoints ====================

  /**
   * Login with email and password
   * POST /user/login
   * @returns { token, user }
   */
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const response = await axiosInstance.post<{ token: string; user: User }>('/user/login', {
      email,
      password,
    })
    return response.data
  },

  /**
   * Register new user
   * POST /user/register
   * @returns { token, user }
   */
  async register(
    username: string,
    email: string,
    password: string,
  ): Promise<{ token: string; user: User }> {
    const response = await axiosInstance.post<{ token: string; user: User }>('/user/register', {
      username,
      email,
      password,
    })
    return response.data
  },

  /**
   * Send verification code (for password reset or registration)
   * POST /user/send-code
   */
  async sendCode(email: string, type: 'forgot-password' | 'register'): Promise<void> {
    await axiosInstance.post('/user/send-code', { email, type })
  },

  /**
   * Reset password with verification code
   * POST /user/forgot-password
   */
  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    await axiosInstance.post('/user/forgot-password', { email, code, newPassword })
  },

  /**
   * Get current user profile
   * GET /user/profile
   */
  async getProfile(): Promise<User> {
    const response = await axiosInstance.get<User>('/user/profile')
    return response.data
  },

  /**
   * Update user profile
   * POST /user/profile/update
   */
  async updateProfile(payload: { username?: string; password?: string }): Promise<User> {
    const response = await axiosInstance.post<User>('/user/profile/update', payload)
    return response.data
  },

  // ==================== Chat Endpoints ====================

  /**
   * Get user's conversations with pagination
   * GET /chat/conversations
   * @returns { conversations, pagination }
   */
  async getConversations(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ conversations: Conversation[]; pagination: Pagination }> {
    const response = await axiosInstance.get<{
      conversations: Conversation[]
      pagination: Pagination
    }>('/chat/conversations', { params: { page, limit } })
    return response.data
  },

  /**
   * Create a new conversation
   * POST /chat/conversations
   */
  async createConversation(title?: string): Promise<Conversation> {
    const response = await axiosInstance.post<Conversation>('/chat/conversations', { title })
    return response.data
  },

  /**
   * Delete a conversation
   * POST /chat/deleteConversations
   */
  async deleteConversation(conversationId: string): Promise<void> {
    await axiosInstance.post('/chat/deleteConversations', { id: conversationId })
  },

  /**
   * Get conversation detail (with messages)
   * GET /chat/conversations/{id}/share
   * When share=1 is provided, no auth required for shared conversations
   */
  async getConversationDetail(
    conversationId: string,
    share: boolean = false,
  ): Promise<ConversationDetail> {
    const response = await axiosInstance.get<ConversationDetail>(
      `/chat/conversations/${conversationId}/share`,
      { params: share ? { share: '1' } : undefined },
    )
    return response.data
  },

  /**
   * Upload one file for chat message attachment
   * POST /chat/files/upload
   */
  async uploadChatFile(file: File): Promise<UploadedChatFile> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await axiosInstance.post<UploadedChatFile>('/chat/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  },

  /**
   * Get file preview content for an uploaded chat file
   * GET /chat/files/{fileId}/preview
   */
  async getChatFilePreview(fileId: string): Promise<Blob> {
    const response = await axiosInstance.get<Blob>(`/chat/files/${fileId}/preview`, {
      responseType: 'blob',
    })

    return response.data
  },

  /**
   * Send a chat message with SSE streaming
   * POST /chat/conversations/{id}/message
   * Uses native fetch for SSE stream (not axios)
   * @returns AbortController for cancellation
   */
  sendMessage(
    conversationId: string,
    query: string,
    onMessage: (event: SSEEvent) => void,
    files?: ChatMessageFile[],
    attachments?: MessageAttachment[],
  ): { promise: Promise<void>; abort: () => void } {
    const controller = new AbortController()

    const promise = (async () => {
      const token = localStorage.getItem('auth_token')
      const baseURL =
        (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_API_BASE ?? ''

      const payload: {
        query: string
        files?: ChatMessageFile[]
        attachments?: MessageAttachment[]
      } = { query }

      if (files && files.length > 0) {
        payload.files = files
      }

      if (attachments && attachments.length > 0) {
        payload.attachments = attachments
      }

      const response = await fetch(`${baseURL}/chat/conversations/${conversationId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorBody = await response.text()
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const parsed = JSON.parse(errorBody)
          if (parsed.message) errorMessage = parsed.message
        } catch {
          // use default error message
        }
        throw new Error(errorMessage)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let currentEvent = ''
      let currentData = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process SSE lines
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim()
          } else if (line.startsWith('data:')) {
            currentData = line.slice(5).trim()
          } else if (line.trim() === '') {
            // Empty line = end of SSE event block
            if (currentEvent && currentData) {
              try {
                const parsed = JSON.parse(currentData)
                switch (currentEvent) {
                  case 'delta':
                    onMessage({
                      event: 'delta',
                      content: parsed.content ?? '',
                      taskId:
                        typeof parsed.taskId === 'string'
                          ? parsed.taskId
                          : typeof parsed.task_id === 'string'
                            ? parsed.task_id
                            : undefined,
                    })
                    break
                  case 'task':
                    onMessage({ event: 'task', taskId: parsed.taskId ?? parsed.task_id ?? '' })
                    break
                  case 'done':
                    onMessage({ event: 'done', conversationId: parsed.conversationId ?? '' })
                    break
                  case 'error':
                    onMessage({
                      event: 'error',
                      message: parsed.message ?? parsed.error ?? currentData,
                    })
                    break
                  case 'ping':
                    onMessage({ event: 'ping' })
                    break
                }
              } catch {
                // Data is not JSON, handle as raw text
                if (currentEvent === 'delta') {
                  onMessage({ event: 'delta', content: currentData })
                } else if (currentEvent === 'error') {
                  onMessage({ event: 'error', message: currentData })
                } else if (currentEvent === 'done') {
                  onMessage({ event: 'done', conversationId: currentData })
                }
              }
            }
            currentEvent = ''
            currentData = ''
          }
        }
      }
    })()

    return {
      promise,
      abort: () => controller.abort(),
    }
  },

  /**
   * Stop an in-progress chat message generation task.
   * POST /chat/messages/{taskId}/stop
   */
  async stopMessageGeneration(taskId: string): Promise<{ result: string }> {
    const response = await axiosInstance.post<{ result: string }>(
      `/chat/messages/${encodeURIComponent(taskId)}/stop`,
    )
    return response.data
  },

  // ==================== Share Endpoints ====================

  /**
   * Create share link for conversation
   * POST /chat/conversations/{id}/share
   */
  async createShare(conversationId: string): Promise<{ shareUrl: string }> {
    const response = await axiosInstance.post<{ shareUrl: string }>(
      `/chat/conversations/${conversationId}/share`,
    )
    return response.data
  },

  /**
   * Delete share link for conversation
   * DELETE /chat/conversations/{id}/share
   */
  async deleteShare(conversationId: string): Promise<void> {
    await axiosInstance.delete(`/chat/conversations/${conversationId}/share`)
  },

  // ==================== Admin Endpoints ====================

  /**
   * Get paginated user list (admin only)
   * GET /admin/user
   * @returns { users, pagination }
   */
  async getAdminUsers(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ users: User[]; pagination: Pagination }> {
    const response = await axiosInstance.get<{ users: User[]; pagination: Pagination }>(
      '/admin/user',
      { params: { page, limit } },
    )
    return response.data
  },

  /**
   * Create new user (admin only)
   * POST /admin/user/create
   */
  async createAdminUser(data: {
    username: string
    email: string
    password: string
    role?: 'user' | 'admin'
  }): Promise<User> {
    const response = await axiosInstance.post<User>('/admin/user/create', data)
    return response.data
  },

  /**
   * Delete user (admin only)
   * POST /admin/user/delete
   */
  async deleteAdminUser(userId: string): Promise<void> {
    await axiosInstance.post('/admin/user/delete', { id: userId })
  },

  /**
   * Reset user password (admin only)
   * POST /admin/user/{id}/password
   */
  async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    await axiosInstance.post(`/admin/user/${userId}/password`, { newPassword })
  },

  /**
   * Update user status (admin only)
   * POST /admin/user/{id}/status
   */
  async updateUserStatus(userId: string, isActive: boolean): Promise<void> {
    await axiosInstance.post(`/admin/user/${userId}/status`, { isActive })
  },

  /**
   * Get system settings (admin only)
   * GET /admin/settings
   * @returns { settings: SettingItem[] }
   */
  async getSystemSettings(): Promise<{ settings: SettingItem[] }> {
    const response = await axiosInstance.get<{ settings: SettingItem[] }>('/admin/settings')
    return response.data
  },

  /**
   * Update system settings (admin only)
   * PUT /admin/settings
   * @param settings - key-value pairs to update
   */
  async updateSystemSettings(settings: SystemSettings): Promise<void> {
    await axiosInstance.put('/admin/settings', settings)
  },
}

// Export API type for use in stores
export type Api = typeof api
