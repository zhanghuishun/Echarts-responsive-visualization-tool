<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useECharts } from '@/composables/useECharts'
import { buildChartOption } from '@/composables/useChartOption'
import { calcBarLayoutStats } from '@/composables/calcBarLayoutStats'
import { chartDemoState } from '@/state/chartDemoState'

const props = defineProps<{
  effectiveWidth: number
}>()

const el = ref<HTMLElement | null>(null)

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

const isSmallScreenStrategyDrag = computed(
  () => chartDemoState.smallScreenStrategy === 'drag',
)

const shouldUseSmallScreenStrategy = computed(() => {
  // 只有当 minWidth 语义启用时，才触发“小屏策略”。
  if (!chartDemoState.useBarMinWidth) return false
  if (chartDemoState.categoryCount <= 1) return false
  const allStats = calcBarLayoutStats(props.effectiveWidth)
  return allStats.barWidthPx < chartDemoState.barMinWidth
})

const visibleCategoryCount = computed(() => {
  if (!shouldUseSmallScreenStrategy.value) return chartDemoState.categoryCount

  // 尽量在满足 barMinWidth 的前提下，找到“可显示的最大类目数”。
  const total = Math.max(1, chartDemoState.categoryCount)
  const minWidth = chartDemoState.barMinWidth

  for (let c = total; c >= 1; c--) {
    const s = calcBarLayoutStats(props.effectiveWidth, { categoryCount: c })
    if (s.barWidthPx >= minWidth) return c
  }

  return 1
})

const maxStartIndex = computed(() =>
  Math.max(0, chartDemoState.categoryCount - visibleCategoryCount.value),
)

const startIndex = ref(0)
watch(maxStartIndex, (v) => {
  startIndex.value = Math.min(startIndex.value, v)
})

const startIndexClamped = computed(() =>
  Math.min(Math.max(0, startIndex.value), maxStartIndex.value),
)

const windowCategoryBandPx = computed(() => {
  if (!shouldUseSmallScreenStrategy.value) return 1
  return calcBarLayoutStats(props.effectiveWidth, {
    categoryCount: visibleCategoryCount.value,
  }).categoryBandPx
})

const pageRangeText = computed(() => {
  if (!shouldUseSmallScreenStrategy.value) {
    return `全部类目：1-${chartDemoState.categoryCount}`
  }
  const from = startIndexClamped.value + 1
  const to = Math.min(
    chartDemoState.categoryCount,
    startIndexClamped.value + visibleCategoryCount.value,
  )
  return `显示类目：${from}-${to}`
})

const option = computed(() => {
  if (!shouldUseSmallScreenStrategy.value) {
    return buildChartOption(props.effectiveWidth)
  }
  return buildChartOption(props.effectiveWidth, {
    startIndex: startIndexClamped.value,
    visibleCategoryCount: visibleCategoryCount.value,
  })
})

function prevPage() {
  startIndex.value = Math.max(0, startIndex.value - visibleCategoryCount.value)
}

function nextPage() {
  startIndex.value = Math.min(
    maxStartIndex.value,
    startIndex.value + visibleCategoryCount.value,
  )
}

// B：按页翻页（左/右滑动）——只在 pointerup 时判断滑动方向，减少抖动。
const swipeStart = ref<{ x: number; y: number; pointerId: number } | null>(null)
const SWIPE_THRESHOLD_PX = 28

// A：拖拽连续查看——在 pointermove 阶段把 dx 映射为 startIndex 的离散变化。
const dragState = ref<{
  startX: number
  startY: number
  pointerId: number
  startIndexBase: number
} | null>(null)

let rafId: number | null = null
let pendingIndex: number | null = null

watch(isSmallScreenStrategyDrag, () => {
  swipeStart.value = null
  dragState.value = null
})

function scheduleSetStartIndex(nextIdx: number) {
  pendingIndex = nextIdx
  if (rafId != null) return
  rafId = window.requestAnimationFrame(() => {
    rafId = null
    if (pendingIndex == null) return
    startIndex.value = clamp(pendingIndex, 0, maxStartIndex.value)
    pendingIndex = null
  })
}

function onPointerDown(e: PointerEvent) {
  if (!shouldUseSmallScreenStrategy.value) return

  if (isSmallScreenStrategyDrag.value) {
    dragState.value = {
      startX: e.clientX,
      startY: e.clientY,
      pointerId: e.pointerId,
      startIndexBase: startIndexClamped.value,
    }
    // 获取指针捕获，确保在拖拽过程中能持续收到 move 事件。
    ;(e.currentTarget as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
    return
  }

  swipeStart.value = { x: e.clientX, y: e.clientY, pointerId: e.pointerId }
}

function onPointerMove(e: PointerEvent) {
  if (!shouldUseSmallScreenStrategy.value) return
  if (!isSmallScreenStrategyDrag.value) return
  if (!dragState.value) return
  if (dragState.value.pointerId !== e.pointerId) return

  const dx = e.clientX - dragState.value.startX
  const dy = e.clientY - dragState.value.startY

  // 只处理水平为主的拖拽，避免和纵向滚动冲突。
  if (Math.abs(dx) < Math.abs(dy)) return

  const bandPx = windowCategoryBandPx.value
  if (bandPx <= 0.01) return

  // 拖到左边（dx<0）=> startIndex 增大（显示后面的类目）。
  const raw = dragState.value.startIndexBase - dx / bandPx
  const nextIdx = Math.round(raw)
  scheduleSetStartIndex(nextIdx)
}

function onPointerUp(e: PointerEvent) {
  if (!shouldUseSmallScreenStrategy.value) return

  if (isSmallScreenStrategyDrag.value) {
    if (!dragState.value) return
    if (dragState.value.pointerId !== e.pointerId) return
    dragState.value = null
    return
  }

  if (!swipeStart.value) return
  if (swipeStart.value.pointerId !== e.pointerId) return

  const dx = e.clientX - swipeStart.value.x
  const dy = e.clientY - swipeStart.value.y
  swipeStart.value = null

  if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return
  if (Math.abs(dx) < Math.abs(dy)) return

  if (dx < 0) nextPage()
  else prevPage()
}

function onPointerCancel() {
  swipeStart.value = null
  dragState.value = null
}

useECharts(el, option)
</script>

<template>
  <div
    class="chart-wrap"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
  >
    <div ref="el" class="chart-stage" />
    <div
      v-if="shouldUseSmallScreenStrategy && !isSmallScreenStrategyDrag"
      class="pager-overlay"
    >
      <button
        type="button"
        class="pager-btn"
        :disabled="startIndexClamped === 0"
        aria-label="上一页"
        @click="prevPage"
      >
        ‹
      </button>
      <span class="pager-text" aria-live="polite">{{ pageRangeText }}</span>
      <button
        type="button"
        class="pager-btn"
        :disabled="startIndexClamped === maxStartIndex"
        aria-label="下一页"
        @click="nextPage"
      >
        ›
      </button>
    </div>

    <div
      v-if="shouldUseSmallScreenStrategy && isSmallScreenStrategyDrag"
      class="drag-overlay"
      aria-live="polite"
    >
      <span class="pager-text">{{ pageRangeText }}</span>
      <span class="drag-hint">拖拽查看</span>
    </div>
  </div>
</template>

<style scoped>
.chart-stage {
  width: 100%;
  height: 100%;
  min-height: 120px;
}

.chart-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  touch-action: pan-y; /* 横向手势由我们处理 */
}

.pager-overlay {
  position: absolute;
  left: 0.5rem;
  right: 0.5rem;
  bottom: 0.45rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.25rem 0.35rem;
  border-radius: 10px;
  background: color-mix(in oklab, var(--demo-surface) 65%, transparent);
  border: 1px solid var(--demo-border);
  pointer-events: auto;
}

.pager-btn {
  flex: 0 0 auto;
  width: 2rem;
  height: 1.75rem;
  border-radius: 8px;
  border: 1px solid var(--demo-border);
  background: var(--demo-surface);
  color: var(--demo-text);
  cursor: pointer;
  font-size: 1rem;
}

.pager-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pager-text {
  flex: 1 1 auto;
  text-align: center;
  font-size: 0.75rem;
  color: var(--demo-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drag-overlay {
  position: absolute;
  left: 0.5rem;
  right: 0.5rem;
  bottom: 0.45rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.25rem 0.35rem;
  border-radius: 10px;
  background: color-mix(in oklab, var(--demo-surface) 65%, transparent);
  border: 1px solid var(--demo-border);
  pointer-events: none; /* 交互交给 chart-wrap */
}

.drag-hint {
  flex: 0 0 auto;
  font-size: 0.75rem;
  color: var(--demo-muted);
}
</style>
