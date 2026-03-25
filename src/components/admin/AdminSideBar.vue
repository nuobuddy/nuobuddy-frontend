<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Settings,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  Languages,
  LogOut,
} from 'lucide-vue-next'
import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import SidebarMenuButtonChild from '@/components/ui/sidebar/SidebarMenuButtonChild.vue'
import { Button } from '@/components/ui/button'
import UserCard from '@/components/common/userCard.vue'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import { i18n } from '@/i18n'

interface Props {
  open: boolean
  mobile?: boolean
}

defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const route = useRoute()

// --- Types ---
interface NavItem {
  id: string
  label: string
  icon: typeof LayoutDashboard
  children?: NavItem[]
  path?: string
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

// --- Navigation Tree ---
const navigationTree = computed<NavItem[]>(() => [
  {
    id: 'dashboard',
    label: t('admin.dashboard'),
    icon: LayoutDashboard,
    path: '/admin',
  },
  {
    id: 'userManagement',
    label: t('admin.userManagement'),
    icon: Users,
    children: [
      { id: 'userList', label: t('admin.userList'), icon: ChevronRight, path: '/admin/users' },
      { id: 'createUser', label: t('admin.createUser'), icon: ChevronRight, path: '/admin/users/create' },
    ],
  },
  {
    id: 'conversationManagement',
    label: t('admin.conversationManagement'),
    icon: MessageSquare,
    children: [
      { id: 'conversationAnalysis', label: t('admin.conversationAnalysis'), icon: ChevronRight, path: '/admin/conversations' },
      { id: 'conversationList', label: t('admin.conversationList'), icon: ChevronRight, path: '/admin/conversations/list' },
    ],
  },
  {
    id: 'systemSettings',
    label: t('admin.systemSettings'),
    icon: Settings,
    path: '/admin/settings',
  },
])

// --- Expanded state ---
const expandedItems = ref<Set<string>>(new Set(['userManagement', 'conversationManagement']))

function toggleExpand(id: string) {
  if (expandedItems.value.has(id)) {
    expandedItems.value.delete(id)
  } else {
    expandedItems.value.add(id)
  }
}

function isExpanded(id: string) {
  return expandedItems.value.has(id)
}

function isActive(path?: string) {
  if (!path) return false
  return route.path === path
}

// Auto-expand parent when child is active
function handleItemClick(item: NavItem) {
  if (item.children && item.children.length > 0) {
    if (!isExpanded(item.id)) {
      expandedItems.value.add(item.id)
    }
  }
}

// --- Mock user ---
const mockUser = {
  name: 'Admin User',
  email: 'admin@nuobuddy.com',
  avatar: '',
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
          <span class="flex-1 text-base font-semibold text-sidebar-foreground">NuoBuddy Admin</span>

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
        </div>
      </SidebarHeader>

      <!-- Navigation Tree -->
      <SidebarContent class="px-0 py-2">
        <SidebarMenu>
          <template v-for="item in navigationTree" :key="item.id">
            <!-- Parent item -->
            <SidebarMenuItem>
              <SidebarMenuButtonChild
                :is-active="isActive(item.path)"
                class="h-auto py-2"
                @click="item.path && !item.children ? $router.push(item.path) : handleItemClick(item)"
              >
                <div class="flex w-full items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <component :is="item.icon" class="h-4 w-4" />
                    <span class="text-sm font-medium">{{ item.label }}</span>
                  </div>
                  <ChevronDown
                    v-if="item.children && item.children.length > 0"
                    class="h-4 w-4 text-muted-foreground transition-transform duration-200 cursor-pointer"
                    :class="isExpanded(item.id) ? 'rotate-180' : ''"
                    @click.stop="toggleExpand(item.id)"
                  />
                </div>
              </SidebarMenuButtonChild>

              <!-- Children -->
              <SidebarMenu v-if="item.children && isExpanded(item.id)" class="ml-4 mt-1">
                <SidebarMenuItem v-for="child in item.children" :key="child.id">
                  <SidebarMenuButtonChild
                    :is-active="isActive(child.path)"
                    class="h-auto py-2"
                    @click="$router.push(child.path!)"
                  >
                    <div class="flex w-full items-center gap-2">
                      <component :is="child.icon" class="h-3 w-3 text-muted-foreground" />
                      <span class="text-sm">{{ child.label }}</span>
                    </div>
                  </SidebarMenuButtonChild>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarMenuItem>
          </template>
        </SidebarMenu>
      </SidebarContent>

      <!-- User Footer -->
      <SidebarFooter>
        <UserCard :user="mockUser" :mobile="mobile">
          <DropdownMenuContent
            :side="mobile ? 'top' : 'right'"
            :align="mobile ? 'center' : 'end'"
            class="w-48"
          >
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
