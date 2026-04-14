<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowUp, Maximize2, Paperclip, Square } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

// Props & Emits
interface Props {
  modelValue?: string
  generating?: boolean
  disabled?: boolean
  placeholder?: string
  maxLength?: number
  attachmentName?: string | null
  attachmentPreviewUrl?: string | null
  attachmentUploading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  generating: false,
  disabled: false,
  placeholder: undefined,
  maxLength: undefined,
  attachmentName: null,
  attachmentPreviewUrl: null,
  attachmentUploading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  send: [message: string]
  stop: []
  fullscreen: []
  attach: [file: File]
  removeAttachment: []
}>()

// Composables
const { t } = useI18n()

// Reactive state
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// Computed
const inputValue = computed({
  get: () => props.modelValue,
  set: (val: string) => emit('update:modelValue', val),
})

const resolvedPlaceholder = computed(
  () =>
    props.placeholder ??
    (props.generating ? t('chat.inputPlaceholderDisabled') : t('chat.inputPlaceholder')),
)

const canSend = computed(
  () => !props.disabled && !props.generating && inputValue.value.trim().length > 0,
)

// Methods
function adjustHeight() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 240)}px`
}

function handleInput() {
  adjustHeight()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
}

function handleSend() {
  if (!canSend.value) return
  const message = inputValue.value.trim()
  emit('send', message)
  inputValue.value = ''
  nextTick(() => {
    adjustHeight()
  })
}

function handleStop() {
  emit('stop')
}

function handleFullscreen() {
  emit('fullscreen')
}

function handleAttach() {
  fileInputRef.value?.click()
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  emit('attach', file)
  target.value = ''
}

function handleRemoveAttachment() {
  emit('removeAttachment')
}

// Send button state classes
const sendButtonClass = computed(() =>
  cn(
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200',
    props.generating
      ? 'cursor-pointer bg-muted text-muted-foreground hover:bg-muted/80'
      : canSend.value
        ? 'cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90'
        : 'cursor-not-allowed bg-muted/60 text-muted-foreground/40',
  ),
)
</script>

<template>
  <div class="w-full max-w-4xl">
    <input ref="fileInputRef" type="file" class="hidden" @change="handleFileChange" />

    <div
      class="rounded-2xl border border-border bg-card px-4 pb-3 pt-4 shadow-sm transition-shadow focus-within:shadow-md"
    >
      <div
        v-if="attachmentName"
        class="mb-3 flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-2"
      >
        <div class="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
          <img
            v-if="attachmentPreviewUrl"
            :src="attachmentPreviewUrl"
            :alt="attachmentName"
            class="h-full w-full object-cover"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center text-xs text-muted-foreground"
          >
            <Paperclip class="h-4 w-4" />
          </div>
        </div>

        <div class="min-w-0 flex-1">
          <p class="truncate text-sm text-foreground">{{ attachmentName }}</p>
          <p v-if="attachmentUploading" class="text-xs text-muted-foreground">
            {{ t('chat.uploadingFile') }}
          </p>
        </div>

        <button
          type="button"
          class="shrink-0 text-xs text-muted-foreground transition-colors hover:text-foreground"
          @click="handleRemoveAttachment"
        >
          {{ t('chat.removeAttachment') }}
        </button>
      </div>

      <!-- Textarea -->
      <textarea
        ref="textareaRef"
        v-model="inputValue"
        :placeholder="resolvedPlaceholder"
        :disabled="disabled"
        :maxlength="maxLength"
        rows="1"
        class="block min-h-6 w-full resize-none border-none bg-transparent text-base leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed disabled:opacity-50"
        @input="handleInput"
        @keydown="handleKeydown"
      />

      <!-- Bottom Toolbar -->
      <div class="mt-3 flex items-center justify-end gap-3">
        <!-- Right: Utility Icons + Send Button -->
        <div class="flex shrink-0 items-center gap-2">
          <!-- Utility Icons -->
          <button
            type="button"
            :title="t('chat.fullscreen')"
            class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            @click="handleFullscreen"
          >
            <Maximize2 class="h-4 w-4" />
          </button>
          <button
            type="button"
            :title="t('chat.attachments')"
            class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            @click="handleAttach"
          >
            <Paperclip class="h-4 w-4" />
          </button>

          <!-- Divider -->
          <div class="h-5 w-px bg-border" />

          <!-- Send / Stop Button -->
          <button
            type="button"
            :class="sendButtonClass"
            :title="generating ? t('chat.stopGeneration') : t('chat.send')"
            :aria-label="generating ? t('chat.stopGeneration') : t('chat.send')"
            @click="generating ? handleStop() : handleSend()"
          >
            <Square v-if="generating" class="h-3.5 w-3.5 fill-current" />
            <ArrowUp v-else class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
