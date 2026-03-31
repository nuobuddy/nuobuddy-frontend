<script setup lang="ts">
import type { ChartConfig } from '@/components/ui/chart'
import { Donut } from '@unovis/ts'
import { VisDonut, VisSingleContainer, VisTooltip as ChartTooltip } from '@unovis/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ChartContainer, ChartTooltipContent, componentToString } from '@/components/ui/chart'

const { t } = useI18n()

const questionTypeData = [
  { type: 'technical', count: 438 },
  { type: 'billing', count: 215 },
  { type: 'general', count: 312 },
  { type: 'feedback', count: 189 },
  { type: 'other', count: 124 },
]
type PieData = (typeof questionTypeData)[number]

const pieConfig = computed<ChartConfig>(() => ({
  count: { label: t('admin.charts.questionTypeCount'), color: undefined },
  technical: { label: t('admin.charts.questionTypeTechnical'), color: 'var(--chart-1)' },
  billing: { label: t('admin.charts.questionTypeBilling'), color: 'var(--chart-2)' },
  general: { label: t('admin.charts.questionTypeGeneral'), color: 'var(--chart-3)' },
  feedback: { label: t('admin.charts.questionTypeFeedback'), color: 'var(--chart-4)' },
  other: { label: t('admin.charts.questionTypeOther'), color: 'var(--chart-5)' },
}))

const totalConversations = computed(() =>
  questionTypeData.reduce((acc, curr) => acc + curr.count, 0),
)
</script>

<template>
  <Card class="col-span-2 flex flex-col">
    <CardHeader class="items-center pb-0">
      <CardTitle>{{ t('admin.charts.questionTypeTitle') }}</CardTitle>
      <CardDescription>{{ t('admin.charts.questionTypeDesc') }}</CardDescription>
    </CardHeader>
    <CardContent class="flex-1 pb-0">
      <ChartContainer
        :config="pieConfig"
        class="mx-auto aspect-square max-h-44"
        :style="{
          '--vis-donut-central-label-font-size': 'var(--text-2xl)',
          '--vis-donut-central-label-font-weight': 'var(--font-weight-bold)',
          '--vis-donut-central-label-text-color': 'var(--foreground)',
          '--vis-donut-central-sub-label-text-color': 'var(--muted-foreground)',
        }"
      >
        <VisSingleContainer :data="questionTypeData" :margin="{ top: 16, bottom: 16 }">
          <VisDonut
            :value="(d: PieData) => d.count"
            :color="(d: PieData) => pieConfig[d.type as keyof typeof pieConfig]?.color"
            :arc-width="28"
            :central-label-offset-y="10"
            :central-label="totalConversations.toLocaleString()"
            :central-sub-label="t('admin.charts.questionTypeTotal')"
          />
          <ChartTooltip
            :triggers="{
              [Donut.selectors.segment]: componentToString(pieConfig, ChartTooltipContent, {
                hideLabel: true,
              })!,
            }"
          />
        </VisSingleContainer>
      </ChartContainer>
    </CardContent>
    <!-- Legend -->
    <CardFooter class="flex-col gap-2 pb-4 pt-2">
      <div class="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        <div v-for="(_, key) in pieConfig" :key="key" class="flex items-center gap-1.5 text-xs">
          <template v-if="pieConfig[key]?.color">
            <span
              class="h-2 w-2 shrink-0 rounded-sm"
              :style="{ backgroundColor: pieConfig[key]?.color }"
            />
            <span class="text-muted-foreground">{{ pieConfig[key]?.label }}</span>
          </template>
        </div>
      </div>
    </CardFooter>
  </Card>
</template>
