import * as echarts from 'echarts'

let getChartDom: (() => HTMLElement | null) | null = null

export function registerChartDom(fn: () => HTMLElement | null) {
  getChartDom = fn
}

export function unregisterChartDom(fn: () => HTMLElement | null) {
  if (getChartDom === fn) getChartDom = null
}

/** 将当前 ECharts 实例导出为 PNG data URL，白底，尺寸与图表容器一致 */
export function getChartPngDataUrl(): string | null {
  const el = getChartDom?.() ?? null
  if (!el) return null
  const chart = echarts.getInstanceByDom(el)
  if (!chart) return null
  return chart.getDataURL({
    type: 'png',
    backgroundColor: '#ffffff',
    pixelRatio: Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 2),
  })
}
