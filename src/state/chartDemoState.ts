import { reactive } from 'vue'

export const BREAKPOINTS = [375, 390, 768, 1024, 1440, 1920] as const

export interface ChartDemoState {
  canvasWidth: number
  chartHeight: number
  categoryCount: number
  /** 同一类目下有几组柱子（分组柱状图） */
  groupCount: number
  /**
   * 示例数据随机种子。为 0 时使用内置确定性序列；非 0 时各柱高由种子派生，便于换一批随机值对比效果。
   */
  dataSeed: number
  /** 小屏柱宽过窄时的展示策略：拖拽连续（A）/按页翻页（B） */
  smallScreenStrategy: 'drag' | 'page'
  barWidthMode: 'pixel' | 'percent'
  barWidthPixel: number
  barWidthPercent: number
  useBarMaxWidth: boolean
  barMaxWidth: number
  useBarMinWidth: boolean
  barMinWidth: number
  /** 多组时，同一类目下不同系列柱子的间距（ECharts barGap） */
  barGap: string
  gridLeft: string
  gridRight: string
  gridTop: string
  gridBottom: string
  panelCollapsed: boolean
}

/** ECharts 全局 color（固定色盘，按系列循环；与界面青绿主色同系，易区分） */
export const CHART_COLORS = [
  '#0d9488',
  '#0e7490',
  '#6366f1',
  '#d97706',
] as const

/** Grid 默认边距（收起「高级调节」时恢复） */
export const DEFAULT_GRID: Pick<
  ChartDemoState,
  'gridLeft' | 'gridRight' | 'gridTop' | 'gridBottom'
> = {
  gridLeft: '12%',
  gridRight: '4%',
  gridTop: '10%',
  gridBottom: '15%',
}

export const chartDemoState = reactive<ChartDemoState>({
  canvasWidth: 800,
  chartHeight: 380,
  categoryCount: 12,
  groupCount: 1,
  dataSeed: 0,
  smallScreenStrategy: 'page',
  barWidthMode: 'percent',
  barWidthPixel: 20,
  barWidthPercent: 40,
  useBarMaxWidth: false,
  barMaxWidth: 40,
  useBarMinWidth: false,
  barMinWidth: 4,
  barGap: '25%',
  ...DEFAULT_GRID,
  panelCollapsed: false,
})

export const PANEL_EXPANDED_WIDTH_PX = 300
export const PANEL_COLLAPSED_STRIP_PX = 44
