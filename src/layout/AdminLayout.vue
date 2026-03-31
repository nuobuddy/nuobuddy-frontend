<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import AdminSideBar from '@/components/admin/AdminSideBar.vue'
import AdminHeader from '@/components/admin/AdminHeader.vue'

// --- Mobile detection ---
const mobileQuery = window.matchMedia('(max-width: 767px)')
const isMobile = ref(mobileQuery.matches)

function onMediaChange(e: MediaQueryListEvent) {
  isMobile.value = e.matches
  if (e.matches) sidebarOpen.value = false
  else sidebarOpen.value = true
}

onMounted(() => mobileQuery.addEventListener('change', onMediaChange))
onUnmounted(() => mobileQuery.removeEventListener('change', onMediaChange))

// --- State ---
const sidebarOpen = ref(!mobileQuery.matches)
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
    <AdminSideBar :open="sidebarOpen" :mobile="isMobile" @close="sidebarOpen = false" />

    <!-- Main Content -->
    <div
      class="flex flex-col flex-1 bg-white overflow-hidden"
      :class="isMobile ? '' : 'rounded-lg shadow-md'"
    >
      <AdminHeader :sidebar-open="sidebarOpen" @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <RouterView class="flex-1 overflow-auto" />
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
