import { reactive } from 'vue'

export const BREAKPOINTS = [375, 390, 768, 1024, 1440, 1920] as const

export interface ChartDemoState {
  canvasWidth: number
  chartHeight: number
  categoryCount: number
  /** 同一类目下有几组柱子（分组柱状图） */
  groupCount: number
  /** 小屏柱宽过窄时的展示策略：拖拽连续（A）/按页翻页（B） */
  smallScreenStrategy: 'drag' | 'page'
  barWidthMode: 'pixel' | 'percent'
  barWidthPixel: number
  barWidthPercent: number
  useBarMaxWidth: boolean
  barMaxWidth: number
  useBarMinWidth: boolean
  barMinWidth: number
  barCategoryGap: string
  /** 多组时，同一类目下不同系列柱子的间距（ECharts barGap） */
  barGap: string
  gridLeft: string
  gridRight: string
  gridTop: string
  gridBottom: string
  /** ECharts 全局 color 色盘（按系列循环） */
  colorPalette: string[]
  panelCollapsed: boolean
}

/** 默认可视化色盘（与 ECharts 内置顺序接近） */
export const DEFAULT_COLOR_PALETTE = [
  '#5470c6',
  '#91cc75',
  '#fac858',
  '#ee6666',
  '#73c0de',
  '#3ba272',
  '#fc8452',
  '#9a60b4',
] as const

/** 快捷预设，键名用于按钮展示 */
export const PALETTE_PRESETS: Record<string, readonly string[]> = {
  default: DEFAULT_COLOR_PALETTE,
  warm: [
    '#c23531',
    '#d48265',
    '#e8c228',
    '#f6efa6',
    '#e098c7',
    '#8dc1a9',
    '#ea7e53',
    '#eedd78',
  ],
  cool: [
    '#3b82f6',
    '#06b6d4',
    '#6366f1',
    '#14b8a6',
    '#0ea5e9',
    '#8b5cf6',
    '#64748b',
    '#22d3ee',
  ],
  contrast: [
    '#e41a1c',
    '#377eb8',
    '#4daf4a',
    '#984ea3',
    '#ff7f00',
    '#ffff33',
    '#a65628',
    '#f781bf',
  ],
}

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
  smallScreenStrategy: 'page',
  barWidthMode: 'percent',
  barWidthPixel: 20,
  barWidthPercent: 40,
  useBarMaxWidth: false,
  barMaxWidth: 40,
  useBarMinWidth: false,
  barMinWidth: 4,
  barCategoryGap: '0%',
  barGap: '25%',
  ...DEFAULT_GRID,
  colorPalette: [...DEFAULT_COLOR_PALETTE],
  panelCollapsed: false,
})

export const PANEL_EXPANDED_WIDTH_PX = 300
export const PANEL_COLLAPSED_STRIP_PX = 44
