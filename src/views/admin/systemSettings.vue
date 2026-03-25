<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="flex items-center justify-center h-full">
    <p class="text-2xl font-semibold text-foreground">{{ t('admin.systemSettings') }}</p>
  </div>
</template>
