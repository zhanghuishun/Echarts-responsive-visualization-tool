import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  chartDemoState,
  PANEL_COLLAPSED_STRIP_PX,
  PANEL_EXPANDED_WIDTH_PX,
} from '@/state/chartDemoState'

/** 与 App.vue `.main` 的左侧 padding（1.25rem，按 16px 根字号）对齐 */
export const MAIN_PADDING_LEFT_PX = 20

const MIN_CANVAS_WIDTH = 280

export function useEffectiveCanvasWidth() {
  const windowWidth = ref(
    typeof window !== 'undefined' ? window.innerWidth : 1200,
  )

  onMounted(() => {
    const handler = () => {
      windowWidth.value = window.innerWidth
    }
    window.addEventListener('resize', handler)
    onUnmounted(() => window.removeEventListener('resize', handler))
  })

  const panelWidthPx = computed(() =>
    chartDemoState.panelCollapsed
      ? PANEL_COLLAPSED_STRIP_PX
      : PANEL_EXPANDED_WIDTH_PX,
  )

  /** 当前视口下主内容区能容纳的画布最大宽度（滑块上限） */
  const maxCanvasWidth = computed(() =>
    Math.max(
      MIN_CANVAS_WIDTH,
      windowWidth.value - MAIN_PADDING_LEFT_PX - panelWidthPx.value,
    ),
  )

  /** 视口变窄或侧栏变化时，把模型宽度钳到合法区间 */
  watch(
    maxCanvasWidth,
    (max) => {
      if (chartDemoState.canvasWidth > max) {
        chartDemoState.canvasWidth = max
      }
    },
    { flush: 'sync' },
  )

  watch(
    () => chartDemoState.canvasWidth,
    (w) => {
      const max = maxCanvasWidth.value
      if (w > max) {
        chartDemoState.canvasWidth = max
      } else if (w < MIN_CANVAS_WIDTH) {
        chartDemoState.canvasWidth = MIN_CANVAS_WIDTH
      }
    },
    { flush: 'sync' },
  )

  const effectiveCanvasWidth = computed(() => chartDemoState.canvasWidth)

  return { effectiveCanvasWidth, maxCanvasWidth, windowWidth }
}
