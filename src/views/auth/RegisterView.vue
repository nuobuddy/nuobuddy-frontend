<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const router = useRouter()

const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const error = ref('')

const passwordRules = computed(() => [
  { label: 'At least 8 characters', met: form.value.password.length >= 8 },
  { label: 'Contains a number', met: /\d/.test(form.value.password) },
  { label: 'Contains uppercase', met: /[A-Z]/.test(form.value.password) },
])

const passwordsMatch = computed(
  () => form.value.password && form.value.confirmPassword === form.value.password,
)

const canSubmit = computed(
  () =>
    form.value.username.trim() &&
    form.value.email.trim() &&
    passwordRules.value.every((r) => r.met) &&
    passwordsMatch.value,
)

const titleText = 'Nuobuddy: Your AI Companion for UNNC Journy.'
const bodyText =
  'Feeling overwhelmed? Get instant, accurate answers about courses, policies, campus life, and more.\nLet NuoBuddy guide you.'
const typedTitle = ref('')
const typedBody = ref('')
let typingTimer: ReturnType<typeof setInterval> | null = null

async function handleRegister() {
  if (!canSubmit.value || loading.value) return
  loading.value = true
  error.value = ''
  try {
    // TODO: connect to real API
    await new Promise((resolve) => setTimeout(resolve, 1000))
    router.push('/chat')
  } catch {
    error.value = 'Registration failed. Please try again.'
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
    <!-- Left: branding panel -->
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
          <h1 class="text-2xl font-semibold tracking-tight text-foreground">Create an account</h1>
          <p class="mt-1.5 text-sm text-muted-foreground">
            Get started for free — no credit card required
          </p>
        </div>

        <!-- Form -->
        <form class="space-y-4" @submit.prevent="handleRegister">
          <!-- Username -->
          <div class="space-y-1.5">
            <label for="username" class="text-sm font-medium text-foreground">Username</label>
            <Input
              id="username"
              v-model="form.username"
              type="text"
              autocomplete="username"
              placeholder="johndoe"
              :disabled="loading"
            />
          </div>

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
            <label for="password" class="text-sm font-medium text-foreground">Password</label>
            <div class="relative">
              <Input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
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

            <!-- Password rules -->
            <ul v-if="form.password" class="space-y-1 mt-2">
              <li
                v-for="rule in passwordRules"
                :key="rule.label"
                class="flex items-center gap-1.5 text-xs transition-colors"
                :class="rule.met ? 'text-foreground' : 'text-muted-foreground'"
              >
                <Check v-if="rule.met" class="w-3.5 h-3.5 text-foreground" />
                <X v-else class="w-3.5 h-3.5" />
                {{ rule.label }}
              </li>
            </ul>
          </div>

          <!-- Confirm password -->
          <div class="space-y-1.5">
            <label for="confirm-password" class="text-sm font-medium text-foreground">
              Confirm password
            </label>
            <div class="relative">
              <Input
                id="confirm-password"
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="••••••••"
                :disabled="loading"
                class="pr-9"
                :aria-invalid="form.confirmPassword && !passwordsMatch ? true : undefined"
              />
              <button
                type="button"
                tabindex="-1"
                class="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground hover:text-foreground transition-colors"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <EyeOff v-if="showConfirmPassword" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>
            <p v-if="form.confirmPassword && !passwordsMatch" class="text-xs text-destructive">
              Passwords do not match
            </p>
          </div>

          <!-- Error -->
          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

          <!-- Submit -->
          <Button type="submit" class="w-full" :disabled="!canSubmit || loading">
            <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
            {{ loading ? 'Creating account...' : 'Create account' }}
          </Button>
        </form>

        <!-- Login link -->
        <p class="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?
          <RouterLink
            to="/login"
            class="font-medium text-foreground hover:underline underline-offset-4 transition-colors"
          >
            Sign in
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
