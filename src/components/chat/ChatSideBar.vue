<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  Languages,
  LogOut,
  MessageSquarePlus,
  PanelLeftClose,
  Search,
  Settings,
  Trash2,
} from 'lucide-vue-next'
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import SidebarMenuButtonChild from '@/components/ui/sidebar/SidebarMenuButtonChild.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import UserCard from '@/components/common/userCard.vue'
import ChatSettings from '@/components/chat/ChatSettings.vue'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { i18n } from '@/i18n'
import type { Conversation } from '@/lib/api'

interface Props {
  open: boolean
  mobile?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const chatStore = useChatStore()

const searchQuery = ref('')
const currentLocale = ref(i18n.global.locale.value)

// Active conversation ID from route
const activeId = computed(() => (route.params.id as string) || null)

// Fetch conversations on mount
onMounted(async () => {
  try {
    await chatStore.fetchConversations(1, 20)
  } catch (err) {
    console.error('Failed to fetch conversations:', err)
  }
})

// Filter conversations by search query
const filteredConversations = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return chatStore.conversations
  return chatStore.conversations.filter((c) => (c.title ?? '').toLowerCase().includes(q))
})

// Group conversations by date
const groupedConversations = computed(() => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const lastWeek = new Date(today.getTime() - 7 * 86400000)

  const groups = new Map<string, Conversation[]>()

  for (const conv of filteredConversations.value) {
    const date = new Date(conv.updatedAt || conv.createdAt)
    let group: string
    if (date >= today) {
      group = t('chat.today')
    } else if (date >= yesterday) {
      group = t('chat.yesterday')
    } else if (date >= lastWeek) {
      group = t('chat.lastWeek')
    } else {
      group = t('chat.older')
    }
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group)!.push(conv)
  }

  return groups
})

// User info from auth store
const currentUser = computed(() => ({
  name: authStore.user?.username || 'User',
  email: authStore.user?.email || 'user@example.com',
  avatar: '',
}))

// Format time for display
function formatConversationTime(conv: Conversation): string {
  const date = new Date(conv.updatedAt || conv.createdAt)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (date >= today) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

// Navigate to a conversation
function selectConversation(conversationId: string) {
  router.push({ name: 'ChatSession', params: { id: conversationId } })
  if (props.mobile) emit('close')
}

// Create a new chat
async function handleNewChat() {
  router.push({ name: 'Chat' })
  chatStore.clearCurrentConversation()
  if (props.mobile) emit('close')
}

// Delete a conversation
async function handleDeleteConversation(conversationId: string, event: Event) {
  event.stopPropagation()
  try {
    await chatStore.deleteConversation(conversationId)
    // If the deleted conversation was active, navigate to new chat
    if (activeId.value === conversationId) {
      router.push({ name: 'Chat' })
    }
  } catch (err) {
    console.error('Failed to delete conversation:', err)
  }
}

function switchLanguage(locale: 'zh-CN' | 'en') {
  i18n.global.locale.value = locale
  localStorage.setItem('nuobuddy-locale', locale)
  currentLocale.value = locale
}

function handleLogout() {
  authStore.logout()
}

const settingsOpen = ref(false)
</script>

<template>
  <aside
    class="flex flex-col overflow-hidden bg-sidebar transition-all duration-300"
    :class="[
      mobile
        ? [
            'absolute inset-y-0 left-0 z-20 h-full rounded-none',
            open
              ? 'w-full translate-x-0 opacity-100'
              : 'w-full -translate-x-full opacity-0 pointer-events-none',
          ]
        : ['relative h-full rounded-lg', open ? 'w-72 opacity-100 mr-2' : 'w-0 opacity-0'],
    ]"
  >
    <div class="flex min-w-64 flex-col h-full">
      <!-- Sidebar Header -->
      <SidebarHeader class="border-b border-sidebar-border px-2 py-0 h-14 justify-center">
        <div class="flex items-center gap-2">
          <!-- Logo -->
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary"
          >
            <span class="text-sm font-bold text-sidebar-primary-foreground">N</span>
          </div>
          <span class="flex-1 text-base font-semibold text-sidebar-foreground">NuoBuddy</span>

          <!-- Mobile close button -->
          <Button
            v-if="mobile"
            variant="ghost"
            size="icon"
            class="h-7 w-7 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            @click="emit('close')"
          >
            <PanelLeftClose class="h-4 w-4" />
          </Button>

          <!-- New chat button -->
          <Button
            variant="ghost"
            size="icon"
            class="h-7 w-7 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            :title="t('chat.newChat')"
            @click="handleNewChat"
          >
            <MessageSquarePlus class="h-4 w-4" />
          </Button>
        </div>
      </SidebarHeader>

      <!-- Search -->
      <div class="shrink-0 px-3 py-2">
        <div class="relative">
          <Search
            class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            v-model="searchQuery"
            :placeholder="t('chat.searchConversations')"
            class="pl-8 h-8 text-sm bg-background border-sidebar-border"
          />
        </div>
      </div>

      <!-- History List -->
      <SidebarContent class="px-0 py-0">
        <!-- Loading state -->
        <div v-if="chatStore.loading && chatStore.conversations.length === 0" class="px-4 py-4">
          <div class="space-y-3">
            <div v-for="i in 3" :key="i" class="h-12 rounded-md bg-muted/50 animate-pulse" />
          </div>
        </div>

        <template v-else-if="filteredConversations.length > 0">
          <SidebarGroup
            v-for="[group, items] in groupedConversations"
            :key="group"
            class="py-1 px-2"
          >
            <SidebarGroupLabel>{{ group }}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem v-for="conv in items" :key="conv.id">
                  <SidebarMenuButtonChild
                    :is-active="activeId === conv.id"
                    class="h-auto py-2 flex-col items-start gap-0.5 group/item"
                    @click="selectConversation(conv.id)"
                  >
                    <div class="flex w-full items-center justify-between gap-2">
                      <span class="truncate text-sm font-medium">{{
                        conv.title || t('chat.newChat')
                      }}</span>
                      <div class="flex items-center gap-1 shrink-0">
                        <span class="text-xs text-muted-foreground group-hover/item:hidden">{{
                          formatConversationTime(conv)
                        }}</span>
                        <button
                          class="hidden group-hover/item:flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          :title="t('chat.deleteConversation')"
                          @click="handleDeleteConversation(conv.id, $event)"
                        >
                          <Trash2 class="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </SidebarMenuButtonChild>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </template>
        <p v-else class="px-4 py-4 text-center text-sm text-muted-foreground">
          {{ t('chat.noConversations') }}
        </p>
      </SidebarContent>

      <!-- User Footer -->
      <SidebarFooter>
        <UserCard :user="currentUser" :mobile="mobile">
          <DropdownMenuContent
            :side="mobile ? 'top' : 'right'"
            :align="mobile ? 'center' : 'end'"
            class="w-48"
          >
            <DropdownMenuItem @click="settingsOpen = true">
              <Settings class="mr-2 h-4 w-4" />
              {{ t('sidebar.userMenu.chatSettings') }}
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Languages class="mr-2 h-4 w-4" />
                {{ t('sidebar.userMenu.switchLanguage') }}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem @click="switchLanguage('zh-CN')">
                  {{ t('common.chinese') }}
                </DropdownMenuItem>
                <DropdownMenuItem @click="switchLanguage('en')">
                  {{ t('common.english') }}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="text-destructive focus:text-destructive" @click="handleLogout">
              <LogOut class="mr-2 h-4 w-4" />
              {{ t('sidebar.userMenu.logout') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </UserCard>
      </SidebarFooter>
    </div>
  </aside>

  <ChatSettings v-model:open="settingsOpen" />
</template>
