<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Languages, LogOut, MessageSquarePlus, PanelLeftClose, Search, Settings } from 'lucide-vue-next'
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
import { i18n } from '@/i18n'

interface Props {
  open: boolean
  mobile?: boolean
}

defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()

// --- Types ---
interface Conversation {
  id: number
  title: string
  lastMessage: string
  time: string
  group: string
}

// --- Mock data ---
const conversations = ref<Conversation[]>([
  { id: 1, title: 'Getting started with Vue 3', lastMessage: 'How do I use Composition API?', time: '10:24', group: t('chat.today') },
  { id: 2, title: 'Tailwind CSS tips', lastMessage: 'What are the best practices?', time: '09:05', group: t('chat.today') },
  { id: 3, title: 'TypeScript generics', lastMessage: 'Can you explain mapped types?', time: 'Yesterday', group: t('chat.yesterday') },
  { id: 4, title: 'Pinia state management', lastMessage: 'How to persist state?', time: 'Mon', group: t('chat.lastWeek') },
])

const activeId = ref<number | null>(1)
const searchQuery = ref('')

const filteredConversations = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return conversations.value
  return conversations.value.filter(
    (c) => c.title.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q),
  )
})

// Group conversations by their group label, preserving order
const groupedConversations = computed(() => {
  const map = new Map<string, Conversation[]>()
  for (const c of filteredConversations.value) {
    if (!map.has(c.group)) map.set(c.group, [])
    map.get(c.group)!.push(c)
  }
  return map
})

const mockUser = {
  name: 'User Name',
  email: 'user@example.com',
  avatar: '',
}

const currentLocale = ref(i18n.global.locale.value)

function switchLanguage(locale: 'zh-CN' | 'en') {
  i18n.global.locale.value = locale
  localStorage.setItem('nuobuddy-locale', locale)
  currentLocale.value = locale
}

function handleLogout() {
  console.log('logout')
}

function handleChatSettings() {
  console.log('chat settings')
}
</script>

<template>
  <aside
    class="flex flex-col overflow-hidden bg-sidebar transition-all duration-300"
    :class="[
      mobile
        ? [
            'absolute inset-y-0 left-0 z-20 h-full rounded-none',
            open ? 'w-full translate-x-0 opacity-100' : 'w-full -translate-x-full opacity-0 pointer-events-none',
          ]
        : [
            'relative h-full rounded-lg',
            open ? 'w-72 opacity-100 mr-2' : 'w-0 opacity-0',
          ],
    ]"
  >
    <div class="flex min-w-64 flex-col h-full">
      <!-- Sidebar Header -->
      <SidebarHeader class="border-b border-sidebar-border px-2 py-0 h-14 justify-center">
        <div class="flex items-center gap-2">
          <!-- Logo -->
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
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
          >
            <MessageSquarePlus class="h-4 w-4" />
          </Button>
        </div>
      </SidebarHeader>

      <!-- Search -->
      <div class="shrink-0 px-3 py-2">
        <div class="relative">
          <Search class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            v-model="searchQuery"
            :placeholder="t('chat.searchConversations')"
            class="pl-8 h-8 text-sm bg-background border-sidebar-border"
          />
        </div>
      </div>

      <!-- History List -->
      <SidebarContent class="px-0 py-0">
        <template v-if="filteredConversations.length > 0">
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
                    class="h-auto py-2 flex-col items-start gap-0.5"
                    @click="activeId = conv.id"
                  >
                    <div class="flex w-full items-center justify-between gap-2">
                      <span class="truncate text-sm font-medium">{{ conv.title }}</span>
                      <span class="shrink-0 text-xs text-muted-foreground">{{ conv.time }}</span>
                    </div>
                    <p class="w-full truncate text-xs text-muted-foreground">{{ conv.lastMessage }}</p>
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
        <UserCard :user="mockUser" :mobile="mobile">
          <DropdownMenuContent
            :side="mobile ? 'top' : 'right'"
            :align="mobile ? 'center' : 'end'"
            class="w-48"
          >
            <DropdownMenuItem @click="handleChatSettings">
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
            <DropdownMenuItem @click="handleLogout" class="text-destructive focus:text-destructive">
              <LogOut class="mr-2 h-4 w-4" />
              {{ t('sidebar.userMenu.logout') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </UserCard>
      </SidebarFooter>
    </div>
  </aside>
</template>
