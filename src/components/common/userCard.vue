<script setup lang="ts">
import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar'
import SidebarMenuButtonChild from '@/components/ui/sidebar/SidebarMenuButtonChild.vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface User {
  name: string
  email: string
  avatar: string
}

interface Props {
  user: User
  mobile?: boolean
}

defineProps<Props>()

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButtonChild size="lg" class="w-full">
            <Avatar class="h-8 w-8 rounded-lg">
              <AvatarImage :src="user.avatar" :alt="user.name" />
              <AvatarFallback class="rounded-lg">{{ getInitials(user.name) }}</AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">{{ user.name }}</span>
              <span class="truncate text-xs text-muted-foreground">{{ user.email }}</span>
            </div>
          </SidebarMenuButtonChild>
        </DropdownMenuTrigger>
        <slot />
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
