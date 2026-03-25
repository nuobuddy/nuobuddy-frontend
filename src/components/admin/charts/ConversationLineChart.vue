<script setup lang="ts">
import type { ChartConfig } from '@/components/ui/chart'
import {
  VisAxis,
  VisCrosshair as ChartCrosshair,
  VisLine,
  VisTooltip as ChartTooltip,
  VisXYContainer,
} from '@unovis/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltipContent, componentToString } from '@/components/ui/chart'

const { t, locale } = useI18n()

// Last 7 days daily mock data (fixed values)
const today = new Date('2026-03-26')
const mockCounts = [142, 198, 167, 221, 183, 249, 205]
const conversationData = mockCounts.map((count, i) => {
  const d = new Date(today)
  d.setDate(today.getDate() - (6 - i))
  return { date: d, count }
})

type ConvData = (typeof conversationData)[number]

const conversationConfig = computed<ChartConfig>(() => ({
  count: {
    label: t('admin.charts.convCountLabel'),
    color: 'var(--chart-2)',
  },
}))
</script>

<template>
  <Card class="col-span-2 sm:col-span-6 py-4 sm:py-0">
    <CardHeader class="flex flex-col items-stretch border-b p-0! sm:flex-row">
      <div class="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 pt-4 sm:py-6">
        <CardTitle>{{ t('admin.charts.convCountTitle') }}</CardTitle>
        <CardDescription>{{ t('admin.charts.convCountDesc') }}</CardDescription>
      </div>
    </CardHeader>
    <CardContent class="px-2 sm:p-6">
      <ChartContainer :config="conversationConfig" class="aspect-auto h-55 w-full" cursor>
        <VisXYContainer :data="conversationData" :margin="{ left: -24 }" :y-domain="[0, undefined]">
          <VisLine
            :x="(d: ConvData) => d.date"
            :y="(d: ConvData) => d.count"
            :color="conversationConfig.count?.color"
          />
          <VisAxis
            type="x"
            :x="(d: ConvData) => d.date"
            :tick-line="false"
            :domain-line="false"
            :grid-line="false"
            :num-ticks="7"
            :tick-format="
              (d: number) =>
                new Date(d).toLocaleDateString(locale, { month: 'short', day: 'numeric' })
            "
          />
          <VisAxis type="y" :num-ticks="3" :tick-line="false" :domain-line="false" />
          <ChartTooltip />
          <ChartCrosshair
            :template="
              componentToString(conversationConfig, ChartTooltipContent, {
                labelFormatter: (d) =>
                  new Date(d).toLocaleDateString(locale, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }),
              })
            "
            :color="conversationConfig.count?.color"
          />
        </VisXYContainer>
      </ChartContainer>
    </CardContent>
  </Card>
</template>
