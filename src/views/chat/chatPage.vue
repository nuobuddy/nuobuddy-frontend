<script setup lang="ts">
import { ref } from 'vue'
import ChatInput from '@/components/chat/ChatInput.vue'

const message = ref('')
const generating = ref(false)
const disabled = ref(false)
const log = ref<string[]>([])

function handleSend(msg: string) {
  log.value.unshift(`[${new Date().toLocaleTimeString()}] 发送: ${msg}`)
  generating.value = true
  setTimeout(() => {
    generating.value = false
    log.value.unshift(`[${new Date().toLocaleTimeString()}] AI 回复完成`)
  }, 3000)
}

function handleStop() {
  generating.value = false
  log.value.unshift(`[${new Date().toLocaleTimeString()}] 已停止生成`)
}

function handleFullscreen() {
  log.value.unshift(`[${new Date().toLocaleTimeString()}] 全屏按钮点击`)
}

function handleAttach() {
  log.value.unshift(`[${new Date().toLocaleTimeString()}] 附件按钮点击`)
}
</script>

<template>
  <div class="min-h-screen bg-background p-6">
    <div class="mx-auto max-w-4xl space-y-8">
      <!-- Header -->
      <div class="space-y-1">
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">ChatInput 组件测试</h1>
        <p class="text-sm text-muted-foreground">测试消息输入框组件的各种状态与交互</p>
      </div>

      <!-- Controls -->
      <div class="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
        <span class="text-sm font-medium text-foreground">控制面板</span>
        <label class="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input v-model="generating" type="checkbox" class="cursor-pointer accent-primary" />
          generating（生成中）
        </label>
        <label class="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input v-model="disabled" type="checkbox" class="cursor-pointer accent-primary" />
          disabled（禁用）
        </label>
        <button
          type="button"
          class="rounded-md border border-border bg-muted px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
          @click="log = []"
        >
          清空日志
        </button>
      </div>

      <!-- Component Under Test -->
      <div class="flex justify-center">
        <ChatInput
          v-model="message"
          :generating="generating"
          :disabled="disabled"
          @send="handleSend"
          @stop="handleStop"
          @fullscreen="handleFullscreen"
          @attach="handleAttach"
        />
      </div>

      <!-- Event Log -->
      <div class="rounded-xl border border-border bg-card p-4">
        <p class="mb-3 text-sm font-medium text-foreground">事件日志</p>
        <div class="min-h-24 space-y-1">
          <p v-if="log.length === 0" class="text-sm text-muted-foreground/60">
            暂无事件，请与组件交互...
          </p>
          <p v-for="(entry, i) in log" :key="i" class="font-mono text-xs text-muted-foreground">
            {{ entry }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
