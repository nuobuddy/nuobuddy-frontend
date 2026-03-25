<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { PanelLeft, ChevronRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

interface BreadcrumbItem {
  title: string
  path?: string
}

const props = defineProps<{
  sidebarOpen: boolean
}>()

const emit = defineEmits<{
  'toggle-sidebar': []
}>()

const route = useRoute()

// Build breadcrumb from current route's matched hierarchy
const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const matched = route.matched.filter((r) => r.meta?.title)

  return matched.map((r, index) => {
    const isLast = index === matched.length - 1
    return {
      title: r.meta.title as string,
      path: isLast ? undefined : r.path,
    }
  })
})
</script>

<template>
  <header class="flex h-14 shrink-0 items-center gap-2 px-4 bg-white/80 backdrop-blur-xl">
    <!-- Sidebar toggle -->
    <Button
      variant="ghost"
      size="icon"
      class="h-8 w-8 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      @click="emit('toggle-sidebar')"
    >
      <PanelLeft class="h-4 w-4" />
    </Button>

    <!-- Breadcrumb -->
    <nav class="flex items-center gap-1.5 text-sm">
      <template v-for="(crumb, index) in breadcrumbs" :key="crumb.path || index">
        <RouterLink
          v-if="crumb.path"
          :to="crumb.path"
          class="text-muted-foreground hover:text-foreground transition-colors"
        >
          {{ crumb.title }}
        </RouterLink>
        <span v-else class="text-foreground font-medium">{{ crumb.title }}</span>

        <ChevronRight
          v-if="index < breadcrumbs.length - 1"
          class="h-4 w-4 text-muted-foreground shrink-0"
        />
      </template>
    </nav>
  </header>
</template>
