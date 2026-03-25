<script setup lang="ts">
import type { ChartConfig } from '@/components/ui/chart'
import {
  VisArea,
  VisAxis,
  VisCrosshair as ChartCrosshair,
  VisLine,
  VisTooltip as ChartTooltip,
  VisXYContainer,
} from '@unovis/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltipContent,
  componentToString,
} from '@/components/ui/chart'
import ConversationLineChart from '@/components/admin/charts/ConversationLineChart.vue'
import QuestionTypePieChart from '@/components/admin/charts/QuestionTypePieChart.vue'

const { t, locale } = useI18n()

// ─── User Growth Area Chart ────────────────────────────────────────────────
const userGrowthData = [
  { date: new Date('2025-10-01'), newUsers: 32 },
  { date: new Date('2025-10-08'), newUsers: 45 },
  { date: new Date('2025-10-15'), newUsers: 41 },
  { date: new Date('2025-10-22'), newUsers: 58 },
  { date: new Date('2025-10-29'), newUsers: 63 },
  { date: new Date('2025-11-05'), newUsers: 72 },
  { date: new Date('2025-11-12'), newUsers: 68 },
  { date: new Date('2025-11-19'), newUsers: 85 },
  { date: new Date('2025-11-26'), newUsers: 91 },
  { date: new Date('2025-12-03'), newUsers: 78 },
  { date: new Date('2025-12-10'), newUsers: 110 },
  { date: new Date('2025-12-17'), newUsers: 125 },
  { date: new Date('2025-12-24'), newUsers: 98 },
  { date: new Date('2025-12-31'), newUsers: 142 },
  { date: new Date('2026-01-07'), newUsers: 156 },
  { date: new Date('2026-01-14'), newUsers: 133 },
  { date: new Date('2026-01-21'), newUsers: 178 },
  { date: new Date('2026-01-28'), newUsers: 192 },
  { date: new Date('2026-02-04'), newUsers: 168 },
  { date: new Date('2026-02-11'), newUsers: 214 },
  { date: new Date('2026-02-18'), newUsers: 223 },
  { date: new Date('2026-02-25'), newUsers: 198 },
  { date: new Date('2026-03-04'), newUsers: 245 },
  { date: new Date('2026-03-11'), newUsers: 267 },
  { date: new Date('2026-03-18'), newUsers: 289 },
]
type UserData = (typeof userGrowthData)[number]

const userGrowthConfig = computed<ChartConfig>(() => ({
  newUsers: {
    label: t('admin.charts.userGrowthLabel'),
    color: 'var(--chart-1)',
  },
}))

const svgDefs = `
  <linearGradient id="fillNewUsers" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stop-color="var(--color-newUsers)" stop-opacity="0.8"/>
    <stop offset="95%" stop-color="var(--color-newUsers)" stop-opacity="0.1"/>
  </linearGradient>
`
</script>

<template>
  <div class="p-4 sm:p-6">
    <h1 class="text-2xl font-semibold text-foreground mb-6">
      {{ t('admin.dashboard') }}
    </h1>

    <!-- 8-col grid on PC, 2-col on mobile -->
    <div class="grid grid-cols-2 sm:grid-cols-8 gap-4">
      <!-- User Growth Area Chart: col-span-6 on PC, full-width on mobile -->
      <Card class="col-span-2 sm:col-span-6 pt-0">
        <CardHeader class="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div class="grid flex-1 gap-1">
            <CardTitle>{{ t('admin.charts.userGrowthTitle') }}</CardTitle>
            <CardDescription>{{ t('admin.charts.userGrowthDesc') }}</CardDescription>
          </div>
        </CardHeader>
        <CardContent class="px-2 pt-4 sm:px-6 sm:pt-6 pb-4">
          <ChartContainer
            :config="userGrowthConfig"
            class="aspect-auto h-55 w-full"
            :cursor="false"
          >
            <VisXYContainer :data="userGrowthData" :svg-defs="svgDefs" :margin="{ left: -40 }">
              <VisArea
                :x="(d: UserData) => d.date"
                :y="(d: UserData) => d.newUsers"
                color="url(#fillNewUsers)"
                :opacity="0.6"
              />
              <VisLine
                :x="(d: UserData) => d.date"
                :y="(d: UserData) => d.newUsers"
                :color="userGrowthConfig.newUsers?.color"
                :line-width="1.5"
              />
              <VisAxis
                type="x"
                :x="(d: UserData) => d.date"
                :tick-line="false"
                :domain-line="false"
                :grid-line="false"
                :num-ticks="6"
                :tick-format="
                  (d: number) =>
                    new Date(d).toLocaleDateString(locale, { month: 'short', day: 'numeric' })
                "
              />
              <VisAxis type="y" :num-ticks="3" :tick-line="false" :domain-line="false" />
              <ChartTooltip />
              <ChartCrosshair
                :template="
                  componentToString(userGrowthConfig, ChartTooltipContent, {
                    labelFormatter: (d) =>
                      new Date(d).toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
                  })
                "
                :color="userGrowthConfig.newUsers?.color"
              />
            </VisXYContainer>
            <ChartLegendContent />
          </ChartContainer>
        </CardContent>
      </Card>

      <!-- Pie Chart -->
      <QuestionTypePieChart />

      <!-- Conversation Line Chart (last 7 days) -->
      <ConversationLineChart />
    </div>
  </div>
</template>
