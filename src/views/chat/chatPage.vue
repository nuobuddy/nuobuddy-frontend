<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ChatSideBar from '@/components/chat/ChatSideBar.vue'
import ChatHeader from '@/components/chat/ChatHeader.vue'
import ChatInput from '@/components/chat/ChatInput.vue'

const { t } = useI18n()
const route = useRoute()

// --- Types ---
interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

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
  // Auto-collapse when switching to mobile
  if (e.matches) sidebarOpen.value = false
  else sidebarOpen.value = true
}

onMounted(() => {
  mobileQuery.addEventListener('change', onMediaChange)
  // Check access if in share mode
  if (isShareMode.value && conversationId.value) {
    checkShareAccess()
  }
})
onUnmounted(() => mobileQuery.removeEventListener('change', onMediaChange))

// --- Check share access ---
async function checkShareAccess() {
  loadingAccess.value = true
  try {
    // TODO: Replace with actual API call
    // const result = await api.getConversation(conversationId.value, true)
    // hasAccess.value = result.accessible

    // For now, simulate access check
    hasAccess.value = true
  } catch (error) {
    console.error('Failed to check share access:', error)
    hasAccess.value = false
  } finally {
    loadingAccess.value = false
  }
}

// --- State ---
const sidebarOpen = ref(!mobileQuery.matches)
const chatTitle = ref<string | undefined>(undefined)
const inputValue = ref('')
const generating = ref(false)
const messages = ref<Message[]>([])
const messageListRef = ref<HTMLDivElement | null>(null)
let nextId = 1

// --- Helpers ---
function scrollToBottom() {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

// --- Handlers ---
async function handleSend(message: string) {
  if (!message.trim() || generating.value) return

  if (!chatTitle.value) chatTitle.value = message.slice(0, 60)
  messages.value.push({ id: nextId++, role: 'user', content: message, timestamp: new Date() })
  scrollToBottom()

  generating.value = true

  // Placeholder assistant message for streaming effect
  const assistantMsg: Message = {
    id: nextId++,
    role: 'assistant',
    content: '',
    timestamp: new Date(),
  }
  messages.value.push(assistantMsg)

  // Simulate streaming response (replace with real API call)
  const reply = t('chat.thinking')
  let charIndex = 0
  const interval = setInterval(() => {
    if (charIndex < reply.length) {
      assistantMsg.content += reply[charIndex++]
      scrollToBottom()
    } else {
      clearInterval(interval)
      generating.value = false
    }
  }, 40)
}

function handleStop() {
  generating.value = false
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Get token from localStorage (if available)
const token = computed(() => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem('token') || undefined
  }
  return undefined
})
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
            class="flex flex-col items-center justify-center h-full text-center gap-3"
          >
            <p class="text-2xl font-semibold text-foreground">{{ t('chat.welcomeTitle') }}</p>
            <p class="text-sm text-muted-foreground">{{ t('chat.welcomeSubtitle') }}</p>
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
                <div
                  class="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                >
                  <span v-if="msg.content">{{ msg.content }}</span>
                  <span v-else class="inline-flex items-center gap-1 text-muted-foreground">
                    <span class="animate-bounce">·</span>
                    <span class="animate-bounce [animation-delay:0.15s]">·</span>
                    <span class="animate-bounce [animation-delay:0.3s]">·</span>
                  </span>
                </div>
                <p class="mt-1 text-xs text-muted-foreground">{{ formatTime(msg.timestamp) }}</p>
              </div>
            </div>
          </template>
        </div>

        <!-- Input Area (hidden in share mode) -->
        <div v-if="!isShareMode" class="flex items-center justify-center px-6 py-4">
          <ChatInput
            v-model="inputValue"
            :generating="generating"
            @send="handleSend"
            @stop="handleStop"
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
