<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ConversationLineChart from '@/components/admin/charts/ConversationLineChart.vue'
import QuestionTypePieChart from '@/components/admin/charts/QuestionTypePieChart.vue'

const { t } = useI18n()

// ─── Keyword List ──────────────────────────────────────────────────────────
const keywords = [
  { keyword: '账号登录', count: 312, trend: 'up' },
  { keyword: '密码重置', count: 278, trend: 'up' },
  { keyword: '订单查询', count: 245, trend: 'down' },
  { keyword: '退款申请', count: 198, trend: 'up' },
  { keyword: '功能使用', count: 187, trend: 'stable' },
  { keyword: '价格咨询', count: 165, trend: 'down' },
  { keyword: '技术报错', count: 143, trend: 'up' },
  { keyword: 'API 接入', count: 128, trend: 'stable' },
  { keyword: '数据导出', count: 112, trend: 'down' },
  { keyword: '权限设置', count: 98, trend: 'up' },
]
const maxKeywordCount = computed(() => Math.max(...keywords.map((k) => k.count)))
</script>

<template>
  <div class="p-4 sm:p-6">
    <h1 class="text-2xl font-semibold text-foreground mb-6">
      {{ t('admin.conversationAnalysis') }}
    </h1>

    <!-- 8-col grid on PC, 2-col on mobile -->
    <div class="grid grid-cols-2 sm:grid-cols-8 gap-4">
      <!-- Conversation Line Chart (last 7 days) -->
      <ConversationLineChart />

      <!-- Pie Chart -->
      <QuestionTypePieChart />

      <!-- Keyword List: col-span-6 on PC, full-width on mobile -->
      <Card class="col-span-2 sm:col-span-6">
        <CardHeader>
          <CardTitle>{{ t('admin.charts.keywordTitle') }}</CardTitle>
          <CardDescription>{{ t('admin.charts.keywordDesc') }}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul class="space-y-2">
            <li
              v-for="(item, index) in keywords"
              :key="item.keyword"
              class="flex items-center gap-3"
            >
              <span class="w-5 shrink-0 text-right text-sm text-muted-foreground">{{
                index + 1
              }}</span>
              <span class="w-24 shrink-0 truncate text-sm font-medium">{{ item.keyword }}</span>
              <div class="relative flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  class="absolute inset-y-0 left-0 rounded-full bg-chart-2"
                  :style="{ width: `${(item.count / maxKeywordCount) * 100}%` }"
                />
              </div>
              <span class="w-10 shrink-0 text-right text-sm text-muted-foreground">{{
                item.count
              }}</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
