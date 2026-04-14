<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { PanelLeft, Share, Check, ClipboardPaste } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useChatStore } from '@/stores/chat'

const { t } = useI18n()
const chatStore = useChatStore()

interface Props {
  title?: string
  sidebarOpen: boolean
  conversationId?: string
  token?: string
  isShareMode?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'toggle-sidebar': []
}>()

// Share state
const shareDialogOpen = ref(false)
const shareLink = ref('')
const isShared = ref(false)
const copied = ref(false)
const shareLoading = ref(false)

// Check if current conversation is already shared
const currentShareStatus = computed(() => chatStore.currentConversation?.share ?? false)

// Generate local share link (fallback)
function generateShareLink(): string {
  if (!props.conversationId) return ''
  const baseUrl = window.location.origin
  return `${baseUrl}/chat/${props.conversationId}?share=1`
}

// Handle share button click
async function handleShareClick() {
  if (!props.conversationId) return

  shareLoading.value = true
  try {
    // Call API to create share link, then build the frontend URL from the conversation id
    await chatStore.createShare(props.conversationId)
    shareLink.value = generateShareLink()
    isShared.value = true
    toast.success(t('chat.share.shareCreated'))
  } catch (err) {
    console.error('Failed to create share:', err)
    shareLink.value = generateShareLink()
    isShared.value = currentShareStatus.value
  } finally {
    shareLoading.value = false
  }

  shareDialogOpen.value = true
}

// Handle cancel share
async function handleCancelShare() {
  if (!props.conversationId) return

  shareLoading.value = true
  try {
    await chatStore.deleteShare(props.conversationId)
    isShared.value = false
    shareDialogOpen.value = false
    toast.success(t('chat.share.shareCanceled'))
  } catch (err) {
    console.error('Failed to cancel share:', err)
  } finally {
    shareLoading.value = false
  }
}

// Copy to clipboard
async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(shareLink.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
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
    <h1 v-if="title" class="flex-1 truncate text-sm font-medium text-foreground">
      {{ title }}
    </h1>
    <div v-else class="flex-1" />

    <!-- Share button (hidden in share mode, only shown when a conversation exists) -->
    <Button
      v-if="!isShareMode && conversationId"
      variant="ghost"
      size="sm"
      class="h-8"
      :disabled="shareLoading"
      @click="handleShareClick"
    >
      <Share class="mr-2 h-4 w-4" />
      {{ t('chat.share.button') }}
    </Button>

    <!-- Share Dialog -->
    <Dialog v-model:open="shareDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ t('chat.share.dialogTitle') }}</DialogTitle>
          <DialogDescription>
            {{ t('chat.share.dialogDescription') }}
          </DialogDescription>
        </DialogHeader>

        <div class="flex items-center space-x-2">
          <div class="grid flex-1 gap-2">
            <div class="h-10 rounded-md border border-input bg-muted px-3 py-2 text-sm truncate">
              {{ shareLink }}
            </div>
          </div>
          <Button size="icon" class="px-3" @click="copyToClipboard">
            <span v-if="copied" class="flex items-center gap-1">
              <Check class="h-4 w-4" />
            </span>
            <span v-else class="flex items-center gap-1">
              <ClipboardPaste class="h-4 w-4" />
            </span>
          </Button>
        </div>

        <DialogFooter class="flex sm:flex-row gap-2">
          <Button
            v-if="isShared"
            variant="ghost"
            class="text-destructive hover:text-destructive hover:bg-destructive/10"
            :disabled="shareLoading"
            @click="handleCancelShare"
          >
            {{ t('chat.share.cancelShare') }}
          </Button>
          <Button variant="outline" @click="shareDialogOpen = false">
            {{ t('chat.share.close') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </header>
</template>
