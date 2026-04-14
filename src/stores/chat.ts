import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ChatMessageFile,
  Conversation,
  ConversationDetail,
  Message,
  MessageAttachment,
  SSEEvent,
} from '@/lib/api'

export const useChatStore = defineStore('chat', () => {
  // State
  const conversations = ref<Conversation[]>([])
  const currentConversation = ref<ConversationDetail | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const streaming = ref(false)
  const streamingMessage = ref('')
  const streamingTaskId = ref<string | null>(null)

  // Pagination
  const currentPage = ref(1)
  const totalPages = ref(1)
  const totalItems = ref(0)
  const itemsPerPage = ref(10)

  // Abort controller for SSE streaming
  let abortStreaming: (() => void) | null = null

  // Computed
  const hasMore = computed(() => currentPage.value < totalPages.value)
  const isEmpty = computed(() => conversations.value.length === 0)

  // ==================== Conversation List ====================

  async function fetchConversations(page: number = 1, pageSize: number = 10) {
    loading.value = true
    error.value = null
    try {
      const { api } = await import('@/lib/api')
      const result = await api.getConversations(page, pageSize)

      if (page === 1) {
        conversations.value = result.conversations
      } else {
        conversations.value.push(...result.conversations)
      }

      currentPage.value = result.pagination.page
      totalPages.value = result.pagination.totalPages
      totalItems.value = result.pagination.total
      itemsPerPage.value = result.pagination.limit

      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch conversations'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function loadMoreConversations() {
    if (!hasMore.value || loading.value) return
    await fetchConversations(currentPage.value + 1, itemsPerPage.value)
  }

  async function createConversation(title?: string) {
    loading.value = true
    error.value = null
    try {
      const { api } = await import('@/lib/api')
      const conversation = await api.createConversation(title)

      // Add to beginning of list
      conversations.value.unshift(conversation)

      return conversation
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create conversation'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteConversation(conversationId: string) {
    loading.value = true
    error.value = null
    try {
      const { api } = await import('@/lib/api')
      await api.deleteConversation(conversationId)

      // Remove from list
      conversations.value = conversations.value.filter((c) => c.id !== conversationId)

      // Clear current conversation if deleted
      if (currentConversation.value?.id === conversationId) {
        currentConversation.value = null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete conversation'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ==================== Conversation Detail ====================

  async function fetchConversationDetail(conversationId: string, share: boolean = false) {
    loading.value = true
    error.value = null
    try {
      const { api } = await import('@/lib/api')
      const detail = await api.getConversationDetail(conversationId, share)
      currentConversation.value = detail
      return detail
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch conversation'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ==================== Chat Messaging (SSE) ====================

  function removePendingAssistantPlaceholder() {
    if (!currentConversation.value?.messages.length) return

    const lastIndex = currentConversation.value.messages.length - 1
    const lastMessage = currentConversation.value.messages[lastIndex]

    if (lastMessage?.role === 'assistant' && !lastMessage.content.trim()) {
      currentConversation.value.messages.splice(lastIndex, 1)
    }
  }

  async function sendMessage(
    conversationId: string,
    query: string,
    files?: ChatMessageFile[],
    attachment?: MessageAttachment,
  ) {
    streaming.value = true
    streamingMessage.value = ''
    streamingTaskId.value = null
    error.value = null

    try {
      const { api } = await import('@/lib/api')

      // Add user message to current conversation immediately
      if (currentConversation.value) {
        const userMessage: Message = {
          id: `temp-user-${Date.now()}`,
          role: 'user',
          content: query,
          timestamp: new Date().toISOString(),
          ...(attachment ? { attachments: [attachment] } : {}),
        }
        currentConversation.value.messages.push(userMessage)

        // Add placeholder for assistant response
        const assistantMessage: Message = {
          id: `temp-assistant-${Date.now()}`,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
        }
        currentConversation.value.messages.push(assistantMessage)
      }

      // Send message via SSE
      const { promise, abort } = api.sendMessage(
        conversationId,
        query,
        (event: SSEEvent) => {
          switch (event.event) {
            case 'delta':
              if (event.taskId) {
                streamingTaskId.value = event.taskId
              }
              streamingMessage.value += event.content
              // Update the last assistant message in real-time
              if (currentConversation.value?.messages.length) {
                const lastMsg =
                  currentConversation.value.messages[currentConversation.value.messages.length - 1]
                if (lastMsg?.role === 'assistant') {
                  lastMsg.content = streamingMessage.value
                }
              }
              break
            case 'task':
              if (event.taskId) {
                streamingTaskId.value = event.taskId
              }
              break
            case 'done': {
              streaming.value = false
              if (!streamingMessage.value.trim()) {
                removePendingAssistantPlaceholder()
              }
              streamingMessage.value = ''
              streamingTaskId.value = null
              // Update conversation's difyConversationId if returned
              if (event.conversationId && currentConversation.value) {
                currentConversation.value.difyConversationId = event.conversationId
              }
              // Refresh conversation in background to get proper message IDs from server
              // Use a silent fetch that doesn't reset loading state or wipe current messages
              ;(async () => {
                try {
                  const { api } = await import('@/lib/api')
                  const detail = await api.getConversationDetail(conversationId)
                  // Only update if we're not streaming again
                  if (!streaming.value) {
                    currentConversation.value = detail
                  }
                } catch {
                  // ignore background refresh errors
                }
              })()
              break
            }
            case 'error':
              error.value = event.message || 'An error occurred during streaming'
              streaming.value = false
              streamingMessage.value = ''
              streamingTaskId.value = null
              removePendingAssistantPlaceholder()
              break
            case 'ping':
              // Heartbeat, ignore
              break
          }
        },
        files,
        attachment ? [attachment] : undefined,
      )

      abortStreaming = abort
      await promise
    } catch (err) {
      // Ignore AbortError (user cancelled)
      if ((err as Error).name === 'AbortError') {
        streaming.value = false
        streamingMessage.value = ''
        streamingTaskId.value = null
        removePendingAssistantPlaceholder()
        return
      }
      error.value = err instanceof Error ? err.message : 'Failed to send message'
      streaming.value = false
      streamingMessage.value = ''
      streamingTaskId.value = null
      removePendingAssistantPlaceholder()
      throw err
    } finally {
      abortStreaming = null
    }
  }

  function stopStreaming() {
    if (abortStreaming) {
      abortStreaming()
      abortStreaming = null
    }
    streaming.value = false
    streamingMessage.value = ''
    streamingTaskId.value = null
    removePendingAssistantPlaceholder()
  }

  async function stopGeneration() {
    const taskId = streamingTaskId.value

    stopStreaming()

    if (!taskId) {
      return
    }

    try {
      const { api } = await import('@/lib/api')
      await api.stopMessageGeneration(taskId)
    } catch {
      // Local streaming is already stopped. Ignore remote stop failures.
    }
  }

  // ==================== Share ====================

  async function createShare(conversationId: string) {
    try {
      const { api } = await import('@/lib/api')
      const result = await api.createShare(conversationId)

      // Update share status
      const conv = conversations.value.find((c) => c.id === conversationId)
      if (conv) conv.share = true
      if (currentConversation.value?.id === conversationId) {
        currentConversation.value.share = true
      }

      return result.shareUrl
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create share'
      throw err
    }
  }

  async function deleteShare(conversationId: string) {
    try {
      const { api } = await import('@/lib/api')
      await api.deleteShare(conversationId)

      // Update share status
      const conv = conversations.value.find((c) => c.id === conversationId)
      if (conv) conv.share = false
      if (currentConversation.value?.id === conversationId) {
        currentConversation.value.share = false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete share'
      throw err
    }
  }

  // ==================== Utilities ====================

  function clearCurrentConversation() {
    currentConversation.value = null
    streamingMessage.value = ''
    stopStreaming()
  }

  function setCurrentConversation(detail: ConversationDetail) {
    currentConversation.value = detail
  }

  return {
    // State
    conversations,
    currentConversation,
    loading,
    error,
    streaming,
    streamingMessage,
    streamingTaskId,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    // Computed
    hasMore,
    isEmpty,
    // Actions
    fetchConversations,
    loadMoreConversations,
    createConversation,
    deleteConversation,
    fetchConversationDetail,
    sendMessage,
    stopStreaming,
    stopGeneration,
    createShare,
    deleteShare,
    clearCurrentConversation,
    setCurrentConversation,
  }
})
