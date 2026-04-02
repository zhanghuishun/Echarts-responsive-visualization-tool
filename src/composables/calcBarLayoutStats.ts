import { chartDemoState } from '@/state/chartDemoState'

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function parseOffsetToPx(raw: string, containerWidthPx: number): number {
  const s = raw.trim()
  if (!s) return 0
  if (s.endsWith('%')) {
    const pct = Number.parseFloat(s.slice(0, -1))
    if (Number.isNaN(pct)) return 0
    return (pct / 100) * containerWidthPx
  }
  const px = Number.parseFloat(s)
  return Number.isNaN(px) ? 0 : px
}

export interface BarLayoutStats {
  categoryBandPx: number
  barCategoryGapPx: number
  availableCategoryWidthPx: number
  inkRatio: number
  barWidthPx: number
  barGapPx: number
  groupCount: number
}

export interface CalcBarLayoutStatsOverrides {
  /** 用于小屏窗口渲染：只展示部分类目时，需要用该窗口类目数重新计算。 */
  categoryCount?: number
  /** 用于兼容扩展：如果未来需要联动展示策略，也可显式覆盖组数。 */
  groupCount?: number
}

/**
 * 计算当前布局下的关键像素量（用于显示参数数值）。
 * 注意：这是对 ECharts 分类/间距算法的“近似建模 + 安全系数”，目标是保证不溢出、可解释、和当前渲染尽量一致。
 */
export function calcBarLayoutStats(
  containerWidthPx: number,
  overrides?: CalcBarLayoutStatsOverrides,
): BarLayoutStats {
  const safeContainerWidthPx = Math.max(1, containerWidthPx)
  const categoryCount = Math.max(
    1,
    overrides?.categoryCount ?? chartDemoState.categoryCount,
  )
  const groupCount = Math.max(
    1,
    Math.min(8, overrides?.groupCount ?? chartDemoState.groupCount),
  )

  const gridLeftPx = parseOffsetToPx(chartDemoState.gridLeft, safeContainerWidthPx)
  const gridRightPx = parseOffsetToPx(chartDemoState.gridRight, safeContainerWidthPx)
  const gridWidthPx = Math.max(1, safeContainerWidthPx - gridLeftPx - gridRightPx)
  const categoryBandPx = gridWidthPx / Math.max(1, categoryCount)

  // 按你的口径：categoryBandPx 就是“类目 band 的平均区域宽度”；
  // 本算法不需要 barCategoryGap 概念，因此强制当作 0。
  const barCategoryGapPx = 0
  // 为了严格不溢出，这里仍保留安全系数（避免 ECharts 边界取整导致的 1px 偏差）。
  const SAFETY_FACTOR = 1
  const availableCategoryWidthPx = Math.max(1, categoryBandPx * SAFETY_FACTOR)

  const inkRatio = clamp(chartDemoState.barWidthPercent / 100, 0, 1)

  // 目标：同一类目下的“柱子合计宽度”不超过 availableCategoryWidthPx。
  let barWidthPx = 0
  let barGapPx = 0

  if (chartDemoState.barWidthMode === 'percent') {
    // 按你的口径：inkRatio 只分配给“柱子本身”的总宽度：
    // sumBarWidths = availableCategoryWidthPx * inkRatio
    // 分组时 groupCount * barWidthPx = sumBarWidths
    const sumBarWidthsPx = availableCategoryWidthPx * inkRatio
    barWidthPx = sumBarWidthsPx / groupCount

    if (chartDemoState.useBarMaxWidth) {
      barWidthPx = Math.min(barWidthPx, chartDemoState.barMaxWidth)
    }
    if (chartDemoState.useBarMinWidth) {
      barWidthPx = Math.max(barWidthPx, chartDemoState.barMinWidth)
      // minWidth 可能导致柱子本身超出 inkRatio 预算；再次压回，保证不溢出。
      barWidthPx = Math.min(barWidthPx, sumBarWidthsPx / groupCount)
    }

    if (groupCount > 1) {
      const barGapRaw = chartDemoState.barGap.trim()
      const gapIsPercent = barGapRaw.endsWith('%')
      const gapPct = gapIsPercent ? Number.parseFloat(barGapRaw.slice(0, -1)) : 0
      const gapPxConst = !gapIsPercent ? Number.parseFloat(barGapRaw) : 0
      const safeGapPct = Number.isNaN(gapPct) ? 0 : Math.max(0, gapPct)
      const safeGapPxConst = Number.isNaN(gapPxConst) ? 0 : Math.max(0, gapPxConst)

      const barGapWantedPx = gapIsPercent ? barWidthPx * (safeGapPct / 100) : safeGapPxConst

      // 剩余空间只能给到 gaps：
      // groupCount*barWidthPx + (groupCount-1)*barGapPx <= availableCategoryWidthPx
      const remainingPx = availableCategoryWidthPx - barWidthPx * groupCount
      const maxGapPx = remainingPx / (groupCount - 1)

      barGapPx = clamp(barGapWantedPx, 0, Math.min(8, Math.max(0, maxGapPx)))
    } else {
      barGapPx = 0
    }
  } else {
    // pixel 模式：barWidthPixel 作为柱宽目标；inkRatio 不参与。
    barWidthPx = chartDemoState.barWidthPixel

    if (chartDemoState.useBarMaxWidth) {
      barWidthPx = Math.min(barWidthPx, chartDemoState.barMaxWidth)
    }
    if (chartDemoState.useBarMinWidth) {
      barWidthPx = Math.max(barWidthPx, chartDemoState.barMinWidth)
    }

    // 不超过类目 band：groupCount*barWidthPx <= availableCategoryWidthPx
    barWidthPx = Math.min(barWidthPx, availableCategoryWidthPx / groupCount)

    if (groupCount > 1) {
      const barGapRaw = chartDemoState.barGap.trim()
      const gapIsPercent = barGapRaw.endsWith('%')
      const gapPct = gapIsPercent ? Number.parseFloat(barGapRaw.slice(0, -1)) : 0
      const gapPxConst = !gapIsPercent ? Number.parseFloat(barGapRaw) : 0
      const safeGapPct = Number.isNaN(gapPct) ? 0 : Math.max(0, gapPct)
      const safeGapPxConst = Number.isNaN(gapPxConst) ? 0 : Math.max(0, gapPxConst)

      const barGapWantedPx = gapIsPercent ? barWidthPx * (safeGapPct / 100) : safeGapPxConst

      const remainingPx = availableCategoryWidthPx - barWidthPx * groupCount
      const maxGapPx = remainingPx / (groupCount - 1)
      barGapPx = clamp(barGapWantedPx, 0, Math.min(8, Math.max(0, maxGapPx)))
    } else {
      barGapPx = 0
    }
  }

  return {
    categoryBandPx,
    barCategoryGapPx,
    availableCategoryWidthPx,
    inkRatio,
    barWidthPx,
    barGapPx,
    groupCount,
  }
}

