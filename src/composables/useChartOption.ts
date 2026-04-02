import type { EChartsOption } from 'echarts'
import { chartDemoState } from '@/state/chartDemoState'

/** 稳定可复现的示例数据，组索引不同则数值略有差异 */
function buildSeriesValues(len: number, groupIndex: number): number[] {
  return Array.from(
    { length: len },
    (_, i) => 20 + ((i * 17 + 13 + groupIndex * 11) % 61),
  )
}

export function buildChartOption(_containerWidthPx: number): EChartsOption {
  void _containerWidthPx
  const categoryLen = Math.max(1, chartDemoState.categoryCount)
  const groupCount = Math.max(1, Math.min(8, chartDemoState.groupCount))

  const categories = Array.from(
    { length: categoryLen },
    (_, i) => `类目 ${i + 1}`,
  )

  const barWidthProps = {
    ...(chartDemoState.barWidthMode === 'pixel'
      ? { barWidth: chartDemoState.barWidthPixel }
      : { barWidth: `${chartDemoState.barWidthPercent}%` }),
    ...(chartDemoState.useBarMaxWidth
      ? { barMaxWidth: chartDemoState.barMaxWidth }
      : {}),
    ...(chartDemoState.useBarMinWidth
      ? { barMinWidth: chartDemoState.barMinWidth }
      : {}),
  }

  const series = Array.from({ length: groupCount }, (_, g) => {
    const name = `组 ${g + 1}`
    const item = {
      name,
      type: 'bar' as const,
      data: buildSeriesValues(categoryLen, g),
      barCategoryGap: chartDemoState.barCategoryGap,
      ...barWidthProps,
      ...(groupCount > 1 ? { barGap: chartDemoState.barGap } : {}),
    }
    return item
  })

  const legendNames = series.map((s) => s.name)

  const palette = chartDemoState.colorPalette.filter(Boolean)
  const colors =
    palette.length > 0 ? [...palette] : ['#5470c6', '#91cc75', '#fac858']

  const option: EChartsOption = {
    color: colors,
    tooltip: { trigger: 'axis' },
    ...(groupCount > 1
      ? {
          legend: {
            data: legendNames,
            top: 4,
          },
        }
      : {}),
    grid: {
      left: chartDemoState.gridLeft,
      right: chartDemoState.gridRight,
      top: chartDemoState.gridTop,
      bottom: chartDemoState.gridBottom,
    },
    xAxis: {
      type: 'category',
      data: categories,
    },
    yAxis: { type: 'value' },
    series,
  }
  return option
}
