<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVModel } from '@vueuse/core'
import { Loader2 } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const dialogOpen = useVModel(props, 'open', emit)

const { t } = useI18n()
const authStore = useAuthStore()

const username = ref(authStore.user?.username ?? '')
const email = computed(() => authStore.user?.email ?? '')

const profileSaving = ref(false)
const profileSuccess = ref(false)
const profileError = ref('')

const newPassword = ref('')
const confirmNewPassword = ref('')
const passwordSaving = ref(false)
const passwordSuccess = ref(false)
const passwordError = ref('')

const passwordMismatch = computed(
  () => confirmNewPassword.value.length > 0 && newPassword.value !== confirmNewPassword.value,
)

let profileSuccessTimer: ReturnType<typeof setTimeout> | null = null
let passwordSuccessTimer: ReturnType<typeof setTimeout> | null = null

onUnmounted(() => {
  if (profileSuccessTimer) clearTimeout(profileSuccessTimer)
  if (passwordSuccessTimer) clearTimeout(passwordSuccessTimer)
})

// Reset form and fetch fresh profile each time the dialog opens
watch(dialogOpen, async (val) => {
  if (!val) return

  profileSuccess.value = false
  profileError.value = ''
  passwordSuccess.value = false
  passwordError.value = ''
  newPassword.value = ''
  confirmNewPassword.value = ''

  if (authStore.user) {
    username.value = authStore.user.username
  }

  try {
    const profile = await authStore.fetchProfile()
    if (profile) {
      username.value = profile.username
    }
  } catch {
    // silently ignore — store data is still valid
  }
})

async function handleSaveProfile() {
  if (!username.value.trim()) return

  profileSaving.value = true
  profileSuccess.value = false
  profileError.value = ''

  try {
    await authStore.updateProfile({ username: username.value.trim() })
    profileSuccess.value = true
    if (profileSuccessTimer) clearTimeout(profileSuccessTimer)
    profileSuccessTimer = setTimeout(() => {
      profileSuccess.value = false
    }, 3000)
  } catch (err) {
    profileError.value = err instanceof Error ? err.message : t('common.error')
  } finally {
    profileSaving.value = false
  }
}

async function handleSavePassword() {
  if (!newPassword.value) return

  if (newPassword.value.length < 6) {
    passwordError.value = t('settings.passwordMinLength')
    return
  }

  if (newPassword.value !== confirmNewPassword.value) {
    passwordError.value = t('settings.passwordMismatch')
    return
  }

  passwordSaving.value = true
  passwordSuccess.value = false
  passwordError.value = ''

  try {
    await authStore.updateProfile({ password: newPassword.value })
    passwordSuccess.value = true
    if (passwordSuccessTimer) clearTimeout(passwordSuccessTimer)
    passwordSuccessTimer = setTimeout(() => {
      passwordSuccess.value = false
    }, 2000)
  } catch (err) {
    passwordError.value = err instanceof Error ? err.message : t('common.error')
  } finally {
    passwordSaving.value = false
    newPassword.value = ''
    confirmNewPassword.value = ''
  }
}
</script>

<template>
  <Dialog v-model:open="dialogOpen">
    <DialogContent
      class="flex flex-col gap-0 p-0 overflow-hidden sm:max-w-lg max-sm:max-w-none max-sm:w-full max-sm:h-full max-sm:rounded-none max-sm:top-0 max-sm:left-0 max-sm:translate-x-0 max-sm:translate-y-0"
    >
      <DialogHeader class="px-6 pt-6 pb-2 shrink-0">
        <DialogTitle>{{ t('settings.title') }}</DialogTitle>
        <DialogDescription>{{ t('settings.subtitle') }}</DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        <section class="space-y-4">
          <h2 class="text-base font-medium">{{ t('settings.profileSection') }}</h2>

          <div class="space-y-2">
            <Label for="settings-email">{{ t('settings.email') }}</Label>
            <Input
              id="settings-email"
              :model-value="email"
              disabled
              class="bg-muted text-muted-foreground"
            />
            <p class="text-xs text-muted-foreground">{{ t('settings.emailReadOnly') }}</p>
          </div>

          <div class="space-y-2">
            <Label for="settings-username">{{ t('settings.username') }}</Label>
            <Input
              id="settings-username"
              v-model="username"
              :placeholder="t('settings.usernamePlaceholder')"
            />
          </div>

          <div class="flex items-center gap-3">
            <Button :disabled="profileSaving || !username.trim()" @click="handleSaveProfile">
              <Loader2 v-if="profileSaving" class="mr-2 h-4 w-4 animate-spin" />
              {{ profileSaving ? t('settings.saving') : t('settings.saveProfile') }}
            </Button>
            <span v-if="profileSuccess" class="text-sm text-green-600">
              {{ t('settings.profileSaved') }}
            </span>
            <span v-if="profileError" class="text-sm text-destructive">
              {{ profileError }}
            </span>
          </div>
        </section>

        <Separator />

        <section class="space-y-4">
          <h2 class="text-base font-medium">{{ t('settings.passwordSection') }}</h2>

          <div class="space-y-2">
            <Label for="settings-new-password">{{ t('settings.newPassword') }}</Label>
            <Input
              id="settings-new-password"
              v-model="newPassword"
              type="password"
              :placeholder="t('settings.newPasswordPlaceholder')"
            />
          </div>

          <div class="space-y-2">
            <Label for="settings-confirm-password">{{ t('settings.confirmNewPassword') }}</Label>
            <Input
              id="settings-confirm-password"
              v-model="confirmNewPassword"
              type="password"
              :placeholder="t('settings.newPasswordPlaceholder')"
              :class="passwordMismatch ? 'border-destructive focus-visible:ring-destructive' : ''"
            />
            <p v-if="passwordMismatch" class="text-xs text-destructive">
              {{ t('settings.passwordMismatch') }}
            </p>
          </div>

          <div class="flex items-center gap-3">
            <Button
              :disabled="passwordSaving || !newPassword || passwordMismatch"
              @click="handleSavePassword"
            >
              <Loader2 v-if="passwordSaving" class="mr-2 h-4 w-4 animate-spin" />
              {{ passwordSaving ? t('settings.saving') : t('settings.savePassword') }}
            </Button>
            <span v-if="passwordSuccess" class="text-sm text-green-600">
              {{ t('settings.passwordSaved') }}
            </span>
            <span v-if="passwordError" class="text-sm text-destructive">
              {{ passwordError }}
            </span>
          </div>
        </section>
      </div>
    </DialogContent>
  </Dialog>
</template>
