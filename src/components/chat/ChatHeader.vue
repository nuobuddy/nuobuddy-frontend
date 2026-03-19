<script setup lang="ts">
import { PanelLeft } from 'lucide-vue-next'

interface Props {
  title?: string
  sidebarOpen: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'toggle-sidebar': []
}>()
</script>

<template>
  <header class="flex h-14 shrink-0 items-center gap-3 px-4">
    <!-- Sidebar toggle -->
    <button
      type="button"
      class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      @click="emit('toggle-sidebar')"
    >
      <PanelLeft class="h-4 w-4" />
    </button>

    <!-- Title -->
    <h1
      v-if="title"
      class="flex-1 truncate text-sm font-medium text-foreground"
    >
      {{ title }}
    </h1>
    <div v-else class="flex-1" />
  </header>
</template>
