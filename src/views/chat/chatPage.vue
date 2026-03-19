<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import ChatSideBar from '@/components/chat/ChatSideBar.vue'
import ChatHeader from '@/components/chat/ChatHeader.vue'
import ChatInput from '@/components/chat/ChatInput.vue'

const { t } = useI18n()

// --- Types ---
interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// --- Mobile detection ---
const mobileQuery = window.matchMedia('(max-width: 767px)')
const isMobile = ref(mobileQuery.matches)

function onMediaChange(e: MediaQueryListEvent) {
  isMobile.value = e.matches
  // Auto-collapse when switching to mobile
  if (e.matches) sidebarOpen.value = false
  else sidebarOpen.value = true
}

onMounted(() => mobileQuery.addEventListener('change', onMediaChange))
onUnmounted(() => mobileQuery.removeEventListener('change', onMediaChange))

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
  const assistantMsg: Message = { id: nextId++, role: 'assistant', content: '', timestamp: new Date() }
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
</script>

<template>
  <div class="relative flex flex-row h-dvh w-screen bg-stone-50" :class="isMobile ? 'p-0' : 'p-2'">
    <!-- Mobile overlay backdrop -->
    <Transition name="fade">
      <div
        v-if="isMobile && sidebarOpen"
        class="absolute inset-0 z-10 bg-black/40"
        @click="sidebarOpen = false"
      />
    </Transition>

    <!-- Sidebar -->
    <ChatSideBar :open="sidebarOpen" :mobile="isMobile" @close="sidebarOpen = false" />

    <!-- Main Content -->
    <div class="flex flex-col flex-1 bg-white overflow-hidden" :class="isMobile ? '' : 'rounded-lg shadow-md'">
      <ChatHeader :sidebar-open="sidebarOpen" :title="chatTitle" @toggle-sidebar="sidebarOpen = !sidebarOpen" />

      <!-- Message List -->
      <div ref="messageListRef" class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <!-- Welcome state -->
        <div v-if="messages.length === 0" class="flex flex-col items-center justify-center h-full text-center gap-3">
          <p class="text-2xl font-semibold text-foreground">{{ t('chat.welcomeTitle') }}</p>
          <p class="text-sm text-muted-foreground">{{ t('chat.welcomeSubtitle') }}</p>
        </div>

        <!-- Messages -->
        <template v-for="msg in messages" :key="msg.id">
          <!-- User message -->
          <div v-if="msg.role === 'user'" class="flex justify-end">
            <div class="max-w-[70%]">
              <div class="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
                {{ msg.content }}
              </div>
              <p class="mt-1 text-right text-xs text-muted-foreground">{{ formatTime(msg.timestamp) }}</p>
            </div>
          </div>

          <!-- Assistant message -->
          <div v-else class="flex justify-start">
            <div class="max-w-[70%]">
              <div class="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
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

      <!-- Input Area -->
      <div class="flex items-center justify-center px-6 py-4">
        <ChatInput
          v-model="inputValue"
          :generating="generating"
          @send="handleSend"
          @stop="handleStop"
        />
      </div>
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
