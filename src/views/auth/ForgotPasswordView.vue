<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

const router = useRouter()

const form = ref({
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const submitting = ref(false)
const error = ref('')

// Verification code countdown
const codeSent = ref(false)
const countdown = ref(0)
const sendingCode = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

const validEmail = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email))

const passwordsMatch = computed(
  () => form.value.newPassword && form.value.confirmPassword === form.value.newPassword,
)

const canSubmit = computed(
  () =>
    validEmail.value &&
    form.value.code.trim().length > 0 &&
    form.value.newPassword.length >= 6 &&
    passwordsMatch.value,
)

async function sendCode() {
  if (!validEmail.value || sendingCode.value || countdown.value > 0) return
  sendingCode.value = true
  error.value = ''
  try {
    await api.sendCode(form.value.email.trim(), 'forgot-password')
    codeSent.value = true
    countdown.value = 30
    timer = setInterval(() => {
      countdown.value -= 1
      if (countdown.value <= 0) {
        clearInterval(timer!)
        timer = null
      }
    }, 1000)
  } catch (err) {
    error.value = (err as Error).message || 'Failed to send verification code.'
  } finally {
    sendingCode.value = false
  }
}

async function handleSubmit() {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true
  error.value = ''
  try {
    await api.resetPassword(form.value.email.trim(), form.value.code.trim(), form.value.newPassword)
    router.push('/login')
  } catch (err) {
    error.value = (err as Error).message || 'Something went wrong. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center px-6 py-12">
    <div class="w-full max-w-sm">
      <!-- Back -->
      <RouterLink
        to="/login"
        class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft class="w-4 h-4" />
        Back to sign in
      </RouterLink>

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">Reset password</h1>
        <p class="mt-1.5 text-sm text-muted-foreground">
          Enter your email to receive a verification code.
        </p>
      </div>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <!-- Email -->
        <div class="space-y-1.5">
          <label for="email" class="text-sm font-medium text-foreground">Email</label>
          <Input
            id="email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
            :disabled="submitting"
          />
        </div>

        <!-- Verification code -->
        <div class="space-y-1.5">
          <label for="code" class="text-sm font-medium text-foreground">Verification code</label>
          <div class="flex gap-2">
            <Input
              id="code"
              v-model="form.code"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              placeholder="Enter code"
              :disabled="submitting"
              class="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              class="shrink-0 w-32 text-sm"
              :disabled="!validEmail || sendingCode || countdown > 0 || submitting"
              @click="sendCode"
            >
              <Loader2 v-if="sendingCode" class="w-4 h-4 animate-spin" />
              <template v-else>
                {{ countdown > 0 ? `Resend (${countdown}s)` : codeSent ? 'Resend' : 'Send code' }}
              </template>
            </Button>
          </div>
        </div>

        <!-- New password -->
        <div class="space-y-1.5">
          <label for="new-password" class="text-sm font-medium text-foreground">New password</label>
          <div class="relative">
            <Input
              id="new-password"
              v-model="form.newPassword"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="••••••••"
              :disabled="submitting"
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

        <!-- Confirm new password -->
        <div class="space-y-1.5">
          <label for="confirm-password" class="text-sm font-medium text-foreground">
            Confirm new password
          </label>
          <div class="relative">
            <Input
              id="confirm-password"
              v-model="form.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="••••••••"
              :disabled="submitting"
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

        <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

        <Button type="submit" class="w-full" :disabled="!canSubmit || submitting">
          <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
          {{ submitting ? 'Resetting...' : 'Reset password' }}
        </Button>
      </form>
    </div>
  </div>
</template>
