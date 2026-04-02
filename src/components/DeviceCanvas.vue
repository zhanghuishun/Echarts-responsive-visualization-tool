<script setup lang="ts">
import { chartDemoState, BREAKPOINTS } from '@/state/chartDemoState'
import ChartStage from './ChartStage.vue'
import ParamHint from '@/components/ParamHint.vue'

const props = defineProps<{
  effectiveWidth: number
  maxCanvasWidth: number
}>()

function setBreakpoint(w: number) {
  chartDemoState.canvasWidth = Math.min(w, props.maxCanvasWidth)
}
</script>

<template>
  <div class="device">
    <header class="device-toolbar">
      <h1 class="title">ECharts 条形图 · 响应式调参</h1>
      <div class="toolbar-row">
        <label class="field">
          <span class="label">
            画布宽度
            <ParamHint
              text="模拟视口内容区宽度；受浏览器窗口与右侧栏占位影响，滑块最大值为「可调上限」。"
            />
          </span>
          <input
            v-model.number="chartDemoState.canvasWidth"
            class="input-num"
            type="number"
            min="280"
            :max="maxCanvasWidth"
            step="1"
          />
          <span class="unit">px</span>
        </label>
        <input
          v-model.number="chartDemoState.canvasWidth"
          class="range"
          type="range"
          min="280"
          :max="maxCanvasWidth"
          step="1"
        />
        <label class="field">
          <span class="label">
            图表高度
            <ParamHint text="图表绘制区域高度（像素），即 ECharts 容器高度。" />
          </span>
          <input
            v-model.number="chartDemoState.chartHeight"
            class="input-num input-num-wide"
            type="number"
            min="200"
            max="900"
            step="10"
          />
          <span class="unit">px</span>
        </label>
        <span class="effective">
          当前渲染
          <strong>{{ Math.round(effectiveWidth) }}</strong>
          px · 可调上限
          <strong>{{ Math.round(maxCanvasWidth) }}</strong>
          px
          <ParamHint
            text="「当前渲染」为图表实际使用的宽度；「可调上限」为当前窗口下主内容区允许设置的最大画布宽度。"
          />
        </span>
      </div>
      <div class="toolbar-row breakpoints">
        <span class="hint breakpoints-label">
          断点
          <ParamHint
            text="一键将画布宽度设为常见设备宽度；若超过当前可调上限，会自动取上限。"
          />
          ：
        </span>
        <button
          v-for="w in BREAKPOINTS"
          :key="w"
          type="button"
          class="bp"
          @click="setBreakpoint(w)"
        >
          {{ w }}
        </button>
      </div>
    </header>

    <div
      class="device-frame"
      :style="{ width: `${Math.round(effectiveWidth)}px`, maxWidth: '100%' }"
    >
      <div
        class="chart-host"
        :style="{ height: `${chartDemoState.chartHeight}px` }"
      >
        <ChartStage :effective-width="effectiveWidth" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.device {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-start;
  width: 100%;
}

.device-toolbar {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  width: 100%;
  max-width: 100%;
}

.title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--demo-text);
}

.toolbar-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1rem;
}

.field {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: var(--demo-muted);
}

.label {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
}

.breakpoints-label {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.input-num-wide {
  width: 4.25rem;
}

.input-num {
  width: 4.5rem;
  padding: 0.25rem 0.4rem;
  border: 1px solid var(--demo-border);
  border-radius: 6px;
  background: var(--demo-surface);
  color: var(--demo-text);
}

.range {
  flex: 1 1 200px;
  min-width: 160px;
  max-width: 420px;
  accent-color: var(--demo-accent);
}

.unit {
  font-size: 0.8rem;
  color: var(--demo-muted);
}

.effective {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: var(--demo-muted);
}

.effective strong {
  color: var(--demo-text);
  font-variant-numeric: tabular-nums;
}

.breakpoints {
  align-items: center;
}

.hint {
  font-size: 0.8rem;
  color: var(--demo-muted);
}

.bp {
  padding: 0.2rem 0.55rem;
  font-size: 0.78rem;
  border: 1px solid var(--demo-border);
  border-radius: 6px;
  background: var(--demo-surface-2);
  color: var(--demo-text);
  cursor: pointer;
}

.bp:hover {
  border-color: var(--demo-accent);
  color: var(--demo-accent);
}

.device-frame {
  box-sizing: border-box;
  border: 1px solid var(--demo-border);
  border-radius: 12px;
  background: var(--demo-surface);
  box-shadow: var(--demo-shadow);
  overflow: hidden;
}

.chart-host {
  width: 100%;
}
</style>
