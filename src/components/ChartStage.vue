<script setup lang="ts">
import { computed, ref } from 'vue'
import { useECharts } from '@/composables/useECharts'
import { buildChartOption } from '@/composables/useChartOption'

const props = defineProps<{
  effectiveWidth: number
}>()

const el = ref<HTMLElement | null>(null)
const option = computed(() => buildChartOption(props.effectiveWidth))
useECharts(el, option)
</script>

<template>
  <div ref="el" class="chart-stage" />
</template>

<style scoped>
.chart-stage {
  width: 100%;
  height: 100%;
  min-height: 120px;
}
</style>
