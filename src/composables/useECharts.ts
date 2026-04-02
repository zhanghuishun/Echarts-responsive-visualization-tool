import {
  onMounted,
  onBeforeUnmount,
  watch,
  type MaybeRefOrGetter,
  type Ref,
  toValue,
} from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

export function useECharts(
  containerRef: Ref<HTMLElement | null>,
  optionGetter: MaybeRefOrGetter<EChartsOption>,
): void {
  let chart: echarts.ECharts | null = null
  let ro: ResizeObserver | null = null

  const apply = () => {
    if (!chart) return
    chart.setOption(toValue(optionGetter), { notMerge: true })
  }

  onMounted(() => {
    const el = containerRef.value
    if (!el) return
    chart = echarts.init(el)
    apply()
    ro = new ResizeObserver(() => chart?.resize())
    ro.observe(el)
    watch(
      () => toValue(optionGetter),
      () => apply(),
    )
  })

  onBeforeUnmount(() => {
    ro?.disconnect()
    ro = null
    chart?.dispose()
    chart = null
  })
}
