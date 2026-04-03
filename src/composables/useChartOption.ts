import type { EChartsOption } from 'echarts'
import { chartDemoState, CHART_COLORS } from '@/state/chartDemoState'
import { calcBarLayoutStats } from '@/composables/calcBarLayoutStats'

function hash32(n: number): number {
  let x = n | 0
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d)
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b)
  return (x ^ (x >>> 16)) >>> 0
}

/**
 * 示例数据：dataSeed===0 时为确定性演示序列；否则为 12–95 的伪随机整数（同一种子下图表不变）。
 */
function buildSeriesValues(
  len: number,
  groupIndex: number,
  startIndex: number,
  dataSeed: number,
): number[] {
  if (dataSeed === 0) {
    return Array.from(
      { length: len },
      (_, i) => {
        const globalIndex = i + startIndex
        return 20 + ((globalIndex * 17 + 13 + groupIndex * 11) % 61)
      },
    )
  }
  return Array.from({ length: len }, (_, i) => {
    const globalIndex = i + startIndex
    const h = hash32(dataSeed + groupIndex * 0x1e35f + globalIndex * 0x9e3779b9)
    return 12 + (h % 84)
  })
}

export interface CategoryWindow {
  startIndex: number
  visibleCategoryCount: number
}

export function buildChartOption(
  _containerWidthPx: number,
  window?: Partial<CategoryWindow>,
): EChartsOption {
  const containerWidthPx = Math.max(1, _containerWidthPx)
  const totalCategoryCount = Math.max(1, chartDemoState.categoryCount)
  const groupCount = Math.max(1, Math.min(8, chartDemoState.groupCount))

  const requestedVisible = Math.max(
    1,
    Math.min(totalCategoryCount, window?.visibleCategoryCount ?? totalCategoryCount),
  )
  const requestedStart = window?.startIndex ?? 0
  const maxStart = Math.max(0, totalCategoryCount - requestedVisible)
  const startIndex = Math.min(Math.max(0, requestedStart), maxStart)
  const categoryLen = requestedVisible

  const { barWidthPx, barGapPx } = calcBarLayoutStats(containerWidthPx, {
    categoryCount: categoryLen,
  })
  // ECharts 的 barGap 不是 px，它按“相对 barWidth 的百分比”解析。
  // 因此把我们计算得到的 barGapPx 换算回 barGapPercent。
  const barGapPercent =
    groupCount > 1 && barWidthPx > 0 ? (barGapPx / barWidthPx) * 100 : 0
  const barGapValue = `${barGapPercent}%`

  const categories = Array.from({ length: categoryLen }, (_, i) => `类目 ${i + startIndex + 1}`)

  const series = Array.from({ length: groupCount }, (_, g) => {
    const name = `组 ${g + 1}`
    const color = CHART_COLORS[g % CHART_COLORS.length]
    const item = {
      name,
      type: 'bar' as const,
      // 与全局 color 轮询一致，并固定到系列上，避免 axis tooltip 色块与图例/柱体不一致。
      itemStyle: { color },
      // 关闭默认的“出现/更新动画”，避免柱子从下往上上浮。
      animation: false,
      data: buildSeriesValues(categoryLen, g, startIndex, chartDemoState.dataSeed),
      // 新算法不使用 barCategoryGap：固定为 0%，避免“类目 band 剩余宽度”口径不一致。
      barCategoryGap: '0%',
      // 这里用像素值强制控制占用宽度，保证“同一类目内所有柱子”不会超出可用区域。
      barWidth: barWidthPx,
      ...(groupCount > 1 ? { barGap: barGapValue } : {}),
    }
    return item
  })

  const legendNames = series.map((s) => s.name)

  const option: EChartsOption = {
    color: [...CHART_COLORS],
    // 关闭全局动画，避免 ECharts 默认逐帧渲染带来的柱子上浮感。
    animation: false,
    tooltip: {
      trigger: 'axis',
      // 默认按数值排序时，提示框内系列顺序会与图例/画布从左到右不一致。
      order: 'seriesAsc',
    },
    ...(groupCount > 1
      ? {
          legend: {
            data: legendNames,
            top: 4,
            icon: 'roundRect',
            itemWidth: 10,
            itemHeight: 10,
            itemStyle: {
              borderRadius: 1,
            },
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
