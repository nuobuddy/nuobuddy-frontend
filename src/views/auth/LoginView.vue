<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

const router = useRouter()

const form = ref({
  email: '',
  password: '',
})

const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

const canSubmit = computed(() => form.value.email.trim() && form.value.password.trim())

const titleText = 'Nuobuddy: Your AI Companion for UNNC Journy.'
const bodyText =
  'Feeling overwhelmed? Get instant, accurate answers about courses, policies, campus life, and more.\nLet NuoBuddy guide you.'
const typedTitle = ref('')
const typedBody = ref('')
let typingTimer: ReturnType<typeof setInterval> | null = null

async function handleLogin() {
  if (!canSubmit.value || loading.value) return
  loading.value = true
  error.value = ''
  try {
    const response = await api.login(form.value.email.trim(), form.value.password)
    localStorage.setItem('auth_token', response.data.token)
    localStorage.setItem('auth_user', JSON.stringify(response.data.user))
    router.push('/chat')
  } catch (err) {
    error.value =
      (err as Error).message || 'Login failed. Please check your credentials and try again.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  let idx = 0
  const fullText = `${titleText}\n${bodyText}`
  typingTimer = setInterval(() => {
    idx += 1
    const current = fullText.slice(0, idx)
    const [title, ...rest] = current.split('\n')
    typedTitle.value = title ?? ''
    typedBody.value = rest.join('\n')
    if (idx >= fullText.length && typingTimer) {
      clearInterval(typingTimer)
      typingTimer = null
    }
  }, 28)
})

onUnmounted(() => {
  if (typingTimer) {
    clearInterval(typingTimer)
    typingTimer = null
  }
})
</script>

<template>
  <div class="min-h-screen bg-background flex">
    <!-- Left: branding panel (hidden on small screens) -->
    <div class="hidden lg:flex lg:flex-1 bg-muted flex-col justify-between p-12">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span class="text-primary-foreground font-bold text-sm">N</span>
        </div>
        <span class="font-semibold text-foreground">NuoBuddy</span>
      </div>

      <div>
        <h2 class="text-2xl font-semibold text-foreground leading-snug min-h-[4.5rem]">
          {{ typedTitle }}
        </h2>
        <p class="mt-4 text-sm text-muted-foreground whitespace-pre-line min-h-[4.5rem]">
          {{ typedBody }}
        </p>
      </div>
    </div>

    <!-- Right: form panel -->
    <div class="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
      <!-- Mobile logo -->
      <div class="lg:hidden flex items-center gap-2 mb-8">
        <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span class="text-primary-foreground font-bold text-sm">N</span>
        </div>
        <span class="font-semibold text-foreground">NuoBuddy</span>
      </div>

      <div class="w-full max-w-sm">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h1>
          <p class="mt-1.5 text-sm text-muted-foreground">Sign in to your account to continue</p>
        </div>

        <!-- Form -->
        <form class="space-y-4" @submit.prevent="handleLogin">
          <!-- Email -->
          <div class="space-y-1.5">
            <label for="email" class="text-sm font-medium text-foreground">Email</label>
            <Input
              id="email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
              :disabled="loading"
            />
          </div>

          <!-- Password -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label for="password" class="text-sm font-medium text-foreground">Password</label>
              <RouterLink
                to="/forgot-password"
                class="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot password?
              </RouterLink>
            </div>
            <div class="relative">
              <Input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="••••••••"
                :disabled="loading"
                class="pr-9"
              />
              <button
                type="button"
                tabindex="-1"
                class="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground hover:text-foreground transition-colors"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Error -->
          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

          <!-- Submit -->
          <Button type="submit" class="w-full" :disabled="!canSubmit || loading">
            <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
            {{ loading ? 'Signing in...' : 'Sign in' }}
          </Button>
        </form>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <span class="w-full border-t border-border" />
          </div>
          <div class="relative flex justify-center">
            <span class="bg-background px-3 text-xs text-muted-foreground uppercase tracking-wide">
              or
            </span>
          </div>
        </div>

        <!-- Register link -->
        <p class="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?
          <RouterLink
            to="/register"
            class="font-medium text-foreground hover:underline underline-offset-4 transition-colors"
          >
            Create one
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
