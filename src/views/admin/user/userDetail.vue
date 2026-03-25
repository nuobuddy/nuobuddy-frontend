<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()

const isCreateMode = computed(() => route.name === 'CreateUser')
</script>

<template>
  <div class="flex items-center justify-center h-full">
    <p class="text-2xl font-semibold text-foreground">
      {{ isCreateMode ? t('admin.createUser') : t('admin.userDetail') }}
    </p>
  </div>
</template>
