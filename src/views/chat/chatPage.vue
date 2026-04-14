<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import ChatSideBar from '@/components/chat/ChatSideBar.vue'
import ChatHeader from '@/components/chat/ChatHeader.vue'
import ChatInput from '@/components/chat/ChatInput.vue'
import RecommandCard from '@/components/chat/RecommandCard.vue'
import type { RecommendQuestion } from '@/components/chat/RecommandCard.vue'
import { api } from '@/lib/api'
import type { ChatMessageFile, MessageAttachment, UploadedChatFile } from '@/lib/api'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'

const md = new MarkdownIt({ breaks: true, linkify: true })

function renderMarkdown(content: string): string {
  return DOMPurify.sanitize(md.render(content))
}

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()
const authStore = useAuthStore()

// --- Share mode detection ---
const isShareMode = computed(() => route.query.share === '1')
const conversationId = computed(() => route.params.id as string | undefined)
const hasAccess = ref(true)
const loadingAccess = ref(false)

// --- Mobile detection ---
const mobileQuery = window.matchMedia('(max-width: 767px)')
const isMobile = ref(mobileQuery.matches)

function onMediaChange(e: MediaQueryListEvent) {
  isMobile.value = e.matches
  if (e.matches) sidebarOpen.value = false
  else sidebarOpen.value = true
}

onMounted(() => {
  mobileQuery.addEventListener('change', onMediaChange)

  // Load conversation data
  if (isShareMode.value && conversationId.value) {
    checkShareAccess()
  } else if (conversationId.value) {
    loadConversationDetail(conversationId.value)
  } else {
    // New chat - clear current conversation
    chatStore.clearCurrentConversation()
  }
})

onUnmounted(() => {
  mobileQuery.removeEventListener('change', onMediaChange)
  chatStore.stopStreaming()
  revokeAttachmentPreviewUrl()
  Object.values(messageAttachmentPreviewUrls.value).forEach((url) => {
    URL.revokeObjectURL(url)
  })
  messageAttachmentPreviewUrls.value = {}
})

// Watch for route changes (switching between conversations)
watch(
  () => route.params.id,
  (newId) => {
    if (suppressNextRouteWatch) {
      suppressNextRouteWatch = false
      return
    }
    if (newId && typeof newId === 'string') {
      if (isShareMode.value) {
        checkShareAccess()
      } else {
        loadConversationDetail(newId)
      }
    } else {
      chatStore.clearCurrentConversation()
    }
  },
)

// --- Load conversation detail ---
async function loadConversationDetail(id: string) {
  try {
    await chatStore.fetchConversationDetail(id)
    scrollToBottom()
  } catch (err) {
    console.error('Failed to load conversation:', err)
  }
}

// --- Check share access ---
async function checkShareAccess() {
  if (!conversationId.value) return
  loadingAccess.value = true
  try {
    await chatStore.fetchConversationDetail(conversationId.value, true)
    hasAccess.value = chatStore.currentConversation?.accessible !== false
    scrollToBottom()
  } catch {
    hasAccess.value = false
  } finally {
    loadingAccess.value = false
  }
}

// --- State ---
const sidebarOpen = ref(!mobileQuery.matches)
const inputValue = ref('')
const messageListRef = ref<HTMLDivElement | null>(null)
const pendingAttachment = ref<UploadedChatFile | null>(null)
const pendingAttachmentName = ref<string | null>(null)
const attachmentPreviewUrl = ref<string | null>(null)
const attachmentUploading = ref(false)
const attachmentError = ref<string | null>(null)
const messageAttachmentPreviewUrls = ref<Record<string, string>>({})
const messageAttachmentPreviewLoading = ref<Record<string, boolean>>({})
// Flag to suppress route watcher when we programmatically navigate after creating a conversation
let suppressNextRouteWatch = false

// Computed from store
const messages = computed(() => chatStore.currentConversation?.messages ?? [])
const generating = computed(() => chatStore.streaming)
const chatTitle = computed(() => chatStore.currentConversation?.title ?? undefined)
const inputAttachmentName = computed(
  () => pendingAttachment.value?.name ?? pendingAttachmentName.value,
)

// --- Helpers ---
function scrollToBottom() {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

function revokeAttachmentPreviewUrl() {
  if (!attachmentPreviewUrl.value) return
  URL.revokeObjectURL(attachmentPreviewUrl.value)
  attachmentPreviewUrl.value = null
}

function getMessageAttachmentPreviewUrl(fileId: string): string | null {
  return messageAttachmentPreviewUrls.value[fileId] ?? null
}

async function ensureMessageAttachmentPreview(attachment: MessageAttachment): Promise<void> {
  if (attachment.fileType !== 'image') return
  if (messageAttachmentPreviewUrls.value[attachment.id]) return
  if (messageAttachmentPreviewLoading.value[attachment.id]) return

  messageAttachmentPreviewLoading.value = {
    ...messageAttachmentPreviewLoading.value,
    [attachment.id]: true,
  }

  try {
    const blob = await api.getChatFilePreview(attachment.id)
    const objectUrl = URL.createObjectURL(blob)
    messageAttachmentPreviewUrls.value = {
      ...messageAttachmentPreviewUrls.value,
      [attachment.id]: objectUrl,
    }
  } catch {
    // Ignore preview failures and keep filename fallback UI.
  } finally {
    messageAttachmentPreviewLoading.value = {
      ...messageAttachmentPreviewLoading.value,
      [attachment.id]: false,
    }
  }
}

// Auto-scroll when streaming message updates
watch(
  () => chatStore.streamingMessage,
  () => {
    scrollToBottom()
  },
)

watch(
  () => messages.value,
  (list) => {
    list.forEach((message) => {
      const attachments = message.attachments ?? []
      attachments.forEach((attachment) => {
        void ensureMessageAttachmentPreview(attachment)
      })
    })
  },
  { immediate: true, deep: true },
)

// --- Handlers ---
async function handleSend(message: string) {
  if (!message.trim() || generating.value) return

  let targetConversationId = conversationId.value

  // If no current conversation, create one first
  if (!targetConversationId) {
    try {
      const conversation = await chatStore.createConversation(message.slice(0, 60))
      targetConversationId = conversation.id

      // Initialize currentConversation for message display
      chatStore.setCurrentConversation({
        ...conversation,
        messages: [],
      })

      // Navigate to the new conversation URL (without reloading)
      // Suppress the route watcher so it doesn't reload and wipe the pending messages
      suppressNextRouteWatch = true
      router.replace({ name: 'ChatSession', params: { id: conversation.id } })
    } catch (err) {
      console.error('Failed to create conversation:', err)
      return
    }
  } else if (!chatStore.currentConversation) {
    // Conversation ID exists but detail not loaded - this shouldn't happen normally
    // but handle gracefully
    try {
      await chatStore.fetchConversationDetail(targetConversationId)
    } catch (err) {
      console.error('Failed to load conversation:', err)
      return
    }
  }

  const files: ChatMessageFile[] = pendingAttachment.value
    ? [
        {
          type: pendingAttachment.value.fileType,
          transfer_method: 'local_file',
          upload_file_id: pendingAttachment.value.id,
        },
      ]
    : []

  const attachmentForMessage: MessageAttachment | undefined = pendingAttachment.value
    ? {
        id: pendingAttachment.value.id,
        name: pendingAttachment.value.name,
        size: pendingAttachment.value.size,
        mimeType: pendingAttachment.value.mimeType,
        fileType: pendingAttachment.value.fileType,
      }
    : undefined

  if (
    attachmentForMessage &&
    attachmentForMessage.fileType === 'image' &&
    attachmentPreviewUrl.value
  ) {
    messageAttachmentPreviewUrls.value = {
      ...messageAttachmentPreviewUrls.value,
      [attachmentForMessage.id]: attachmentPreviewUrl.value,
    }
  }

  pendingAttachment.value = null
  pendingAttachmentName.value = null
  attachmentPreviewUrl.value = null
  attachmentError.value = null

  // Send message via SSE
  try {
    await chatStore.sendMessage(
      targetConversationId,
      message,
      files.length > 0 ? files : undefined,
      attachmentForMessage,
    )
  } catch (err) {
    console.error('Failed to send message:', err)
  }
}

function handleStop() {
  void chatStore.stopGeneration()
}

async function handleAttach(file: File) {
  attachmentUploading.value = true
  attachmentError.value = null
  pendingAttachmentName.value = file.name
  pendingAttachment.value = null

  revokeAttachmentPreviewUrl()
  if (file.type.startsWith('image/')) {
    attachmentPreviewUrl.value = URL.createObjectURL(file)
  }

  try {
    const uploadedFile = await api.uploadChatFile(file)
    pendingAttachment.value = uploadedFile
    pendingAttachmentName.value = null
  } catch (err) {
    pendingAttachment.value = null
    pendingAttachmentName.value = null
    revokeAttachmentPreviewUrl()
    attachmentError.value = err instanceof Error ? err.message : t('chat.uploadFailed')
  } finally {
    attachmentUploading.value = false
  }
}

function handleRemoveAttachment() {
  pendingAttachment.value = null
  pendingAttachmentName.value = null
  revokeAttachmentPreviewUrl()
  attachmentError.value = null
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Get token for ChatHeader
const token = computed(() => authStore.token ?? undefined)

// --- Recommend questions ---
const allRecommendQuestions: RecommendQuestion[] = [
  { title: 'How do I connect to eduroam Wi-Fi on campus?', category: 'Campus IT' },
  { title: 'How do I apply for financial aid or scholarships?', category: 'Financial Aid' },
  { title: 'How do I add or drop a course?', category: 'Registration' },
  { title: 'What mental health support is available on campus?', category: 'Wellness' },
  { title: 'How do I change my major or minor?', category: 'Academics' },
  { title: 'Where can I find on-campus jobs?', category: 'Career' },
  { title: 'How do I join student clubs or organizations?', category: 'Campus Life' },
  { title: 'How do I appeal a grade?', category: 'Academics' },
]

const maxCards = computed(() => (isMobile.value ? 3 : 5))

const recommendQuestions = computed(() => allRecommendQuestions.slice(0, maxCards.value))

function handleRecommendSelect(question: string) {
  inputValue.value = question
  handleSend(question)
}
</script>

<template>
  <div class="relative flex flex-row h-dvh w-screen bg-stone-50" :class="isMobile ? 'p-0' : 'p-2'">
    <!-- Mobile overlay backdrop -->
    <Transition name="fade">
      <div
        v-if="isMobile && sidebarOpen && !isShareMode"
        class="absolute inset-0 z-10 bg-black/40"
        @click="sidebarOpen = false"
      />
    </Transition>

    <!-- Sidebar (hidden in share mode) -->
    <ChatSideBar
      v-if="!isShareMode"
      :open="sidebarOpen"
      :mobile="isMobile"
      @close="sidebarOpen = false"
    />

    <!-- Main Content -->
    <div
      class="flex flex-col flex-1 bg-white overflow-hidden"
      :class="isMobile ? '' : 'rounded-lg shadow-md'"
    >
      <ChatHeader
        :sidebar-open="sidebarOpen"
        :title="chatTitle"
        :conversation-id="conversationId"
        :token="token"
        :is-share-mode="isShareMode"
        @toggle-sidebar="sidebarOpen = !sidebarOpen"
      />

      <!-- Loading state -->
      <div v-if="loadingAccess" class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
          ></div>
          <p class="mt-2 text-sm text-muted-foreground">{{ t('chat.share.loading') }}</p>
        </div>
      </div>

      <!-- No access state -->
      <div
        v-else-if="isShareMode && !hasAccess"
        class="flex-1 flex items-center justify-center px-6"
      >
        <div class="text-center max-w-md">
          <div
            class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted"
          >
            <svg
              class="h-6 w-6 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-foreground">{{ t('chat.share.noAccessTitle') }}</h3>
          <p class="mt-2 text-sm text-muted-foreground">
            {{ t('chat.share.noAccessMessage') }}
          </p>
        </div>
      </div>

      <!-- Message List -->
      <template v-else>
        <div ref="messageListRef" class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <!-- Welcome state -->
          <div
            v-if="messages.length === 0 && !isShareMode"
            class="flex flex-col items-center justify-center h-full gap-6"
          >
            <div class="text-center gap-3">
              <p class="text-2xl font-semibold text-foreground">{{ t('chat.welcomeTitle') }}</p>
              <p class="text-sm text-muted-foreground mt-1">{{ t('chat.welcomeSubtitle') }}</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-5 gap-3 w-full max-w-3xl px-2">
              <RecommandCard
                v-for="(q, i) in recommendQuestions"
                :key="i"
                :question="q"
                @select="handleRecommendSelect"
              />
            </div>
          </div>

          <!-- Share mode empty state -->
          <div
            v-else-if="messages.length === 0 && isShareMode"
            class="flex flex-col items-center justify-center h-full text-center gap-3"
          >
            <p class="text-2xl font-semibold text-foreground">{{ t('chat.share.noMessages') }}</p>
            <p class="text-sm text-muted-foreground">{{ t('chat.share.noMessagesDesc') }}</p>
          </div>

          <!-- Messages -->
          <template v-for="msg in messages" :key="msg.id">
            <!-- User message -->
            <div v-if="msg.role === 'user'" class="flex justify-end">
              <div class="max-w-[70%]">
                <!-- Attachment preview above the message bubble -->
                <div
                  v-if="msg.attachments && msg.attachments.length > 0"
                  class="mb-1.5 flex justify-end"
                >
                  <div class="grid grid-cols-1 gap-2">
                    <template v-for="attachment in msg.attachments" :key="attachment.id">
                      <div
                        v-if="
                          attachment.fileType === 'image' &&
                          getMessageAttachmentPreviewUrl(attachment.id)
                        "
                        class="h-16 w-16 overflow-hidden rounded-md shadow-md"
                      >
                        <img
                          :src="getMessageAttachmentPreviewUrl(attachment.id) ?? undefined"
                          :alt="attachment.name"
                          class="h-full w-full object-cover"
                        />
                      </div>
                      <div
                        v-else-if="attachment.fileType === 'image'"
                        class="flex h-16 w-16 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground shadow-md"
                      >
                        ...
                      </div>
                    </template>
                  </div>
                </div>
                <div
                  class="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                >
                  {{ msg.content }}
                </div>
                <p class="mt-1 text-right text-xs text-muted-foreground">
                  {{ formatTime(msg.timestamp) }}
                </p>
              </div>
            </div>

            <!-- Assistant message -->
            <div v-else class="flex justify-start">
              <div class="max-w-[70%]">
                <div class="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm leading-relaxed">
                  <!-- eslint-disable-next-line vue/no-v-html -->
                  <div
                    v-if="msg.content"
                    class="prose prose-sm max-w-none"
                    v-html="renderMarkdown(msg.content)"
                  />
                  <span v-else class="inline-flex items-center gap-1 text-muted-foreground">
                    <span class="animate-bounce">.</span>
                    <span class="animate-bounce [animation-delay:0.15s]">.</span>
                    <span class="animate-bounce [animation-delay:0.3s]">.</span>
                  </span>
                </div>
                <p class="mt-1 text-xs text-muted-foreground">{{ formatTime(msg.timestamp) }}</p>
              </div>
            </div>
          </template>

          <!-- Error message -->
          <div v-if="chatStore.error" class="flex justify-center">
            <p class="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-2">
              {{ chatStore.error }}
            </p>
          </div>
        </div>

        <!-- Input Area (hidden in share mode) -->
        <div
          v-if="!isShareMode"
          class="flex w-full flex-col items-center justify-center gap-2 px-6 py-4"
        >
          <div v-if="attachmentError" class="w-full max-w-4xl text-sm text-destructive">
            {{ attachmentError }}
          </div>

          <ChatInput
            v-model="inputValue"
            :generating="generating"
            :disabled="attachmentUploading"
            :attachment-name="inputAttachmentName"
            :attachment-preview-url="attachmentPreviewUrl"
            :attachment-uploading="attachmentUploading"
            @send="handleSend"
            @stop="handleStop"
            @attach="handleAttach"
            @remove-attachment="handleRemoveAttachment"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
