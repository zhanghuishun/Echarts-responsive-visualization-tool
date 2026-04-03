<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ParamHint from '@/components/ParamHint.vue'
import {
  chartDemoState,
  DEFAULT_GRID,
  PANEL_COLLAPSED_STRIP_PX,
  PANEL_EXPANDED_WIDTH_PX,
  type ChartDemoState,
} from '@/state/chartDemoState'
import {
  loadPresets,
  savePresets,
  type PresetRecord,
} from '@/composables/presets'
import { getChartPngDataUrl } from '@/chartExportRegistry'

const presets = ref<PresetRecord[]>(loadPresets())
const presetName = ref('')
const copyStatus = ref<'idle' | 'ok' | 'err'>('idle')
const pngStatus = ref<'idle' | 'ok' | 'err'>('idle')
/** Grid 高级调节：默认收起，收起时恢复 DEFAULT_GRID */
const gridSectionOpen = ref(false)

function toggleGridSection() {
  if (gridSectionOpen.value) {
    Object.assign(chartDemoState, DEFAULT_GRID)
  }
  gridSectionOpen.value = !gridSectionOpen.value
}

/** 百分比 barWidth：与滑块共用状态，输入框失焦/变更时限制在 5–100 */
function clampBarWidthPercent() {
  const raw = chartDemoState.barWidthPercent
  const n = typeof raw === 'number' && !Number.isNaN(raw) ? raw : 40
  chartDemoState.barWidthPercent = Math.min(100, Math.max(5, Math.round(n)))
}

const gridHintText = computed(
  () =>
    `默认边距为 left ${DEFAULT_GRID.gridLeft}、right ${DEFAULT_GRID.gridRight}、top ${DEFAULT_GRID.gridTop}、bottom ${DEFAULT_GRID.gridBottom}。展开可自定义，收起后恢复默认。`,
)

watch(
  presets,
  (v) => {
    savePresets(v)
  },
  { deep: true },
)

const panelWidthStyle = computed(() =>
  chartDemoState.panelCollapsed
    ? `${PANEL_COLLAPSED_STRIP_PX}px`
    : `${PANEL_EXPANDED_WIDTH_PX}px`,
)

function cloneState(): ChartDemoState {
  return JSON.parse(JSON.stringify(chartDemoState)) as ChartDemoState
}

/** 交给业务开发复现时仅需的配置项（不含画布尺寸、面板状态等演示字段） */
function getChartParamsForExport(): Pick<
  ChartDemoState,
  | 'categoryCount'
  | 'groupCount'
  | 'smallScreenStrategy'
  | 'barWidthMode'
  | 'barWidthPixel'
  | 'barWidthPercent'
  | 'useBarMaxWidth'
  | 'barMaxWidth'
  | 'useBarMinWidth'
  | 'barMinWidth'
  | 'barGap'
  | 'gridLeft'
  | 'gridRight'
  | 'gridTop'
  | 'gridBottom'
> {
  const s = chartDemoState
  return {
    categoryCount: s.categoryCount,
    groupCount: s.groupCount,
    smallScreenStrategy: s.smallScreenStrategy,
    barWidthMode: s.barWidthMode,
    barWidthPixel: s.barWidthPixel,
    barWidthPercent: s.barWidthPercent,
    useBarMaxWidth: s.useBarMaxWidth,
    barMaxWidth: s.barMaxWidth,
    useBarMinWidth: s.useBarMinWidth,
    barMinWidth: s.barMinWidth,
    barGap: s.barGap,
    gridLeft: s.gridLeft,
    gridRight: s.gridRight,
    gridTop: s.gridTop,
    gridBottom: s.gridBottom,
  }
}

function applyPreset(p: PresetRecord) {
  const raw = JSON.parse(JSON.stringify(p.state)) as Partial<ChartDemoState> & {
    colorPalette?: unknown
    barCategoryGap?: unknown
  }
  delete raw.colorPalette
  delete raw.barCategoryGap
  Object.assign(chartDemoState, raw as ChartDemoState)
}

function saveCurrentPreset() {
  const name = presetName.value.trim()
  if (!name) return
  const state = cloneState()
  const idx = presets.value.findIndex((x) => x.name === name)
  const row: PresetRecord = { name, state }
  if (idx >= 0) presets.value.splice(idx, 1, row)
  else presets.value.push(row)
  presetName.value = ''
}

function removePreset(name: string) {
  presets.value = presets.value.filter((p) => p.name !== name)
}

const exportText = computed(() =>
  JSON.stringify(getChartParamsForExport(), null, 2),
)

async function copyExport() {
  copyStatus.value = 'idle'
  try {
    await navigator.clipboard.writeText(exportText.value)
    copyStatus.value = 'ok'
    setTimeout(() => {
      copyStatus.value = 'idle'
    }, 2000)
  } catch {
    copyStatus.value = 'err'
  }
}

function exportPng() {
  pngStatus.value = 'idle'
  const url = getChartPngDataUrl()
  if (!url) {
    pngStatus.value = 'err'
    return
  }
  const name = `bar-chart-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  pngStatus.value = 'ok'
  setTimeout(() => {
    pngStatus.value = 'idle'
  }, 2000)
}

</script>

<template>
  <aside
    class="panel"
    :class="{ collapsed: chartDemoState.panelCollapsed }"
    :style="{ width: panelWidthStyle }"
  >
    <button
      type="button"
      class="collapse-btn"
      :title="chartDemoState.panelCollapsed ? '展开参数' : '收起参数'"
      @click="chartDemoState.panelCollapsed = !chartDemoState.panelCollapsed"
    >
      <span class="chev" aria-hidden="true">{{ chartDemoState.panelCollapsed ? '‹' : '›' }}</span>
      <span v-if="!chartDemoState.panelCollapsed" class="collapse-label">收起</span>
    </button>

    <div v-show="!chartDemoState.panelCollapsed" class="panel-body">
      <section class="block">
        <h2 class="h">数据</h2>
        <label class="row">
          <span class="row-label">
            类目数量
            <ParamHint text="横轴类目个数，即柱子组数（每个类目一根柱或一组柱）。" />
          </span>
          <input
            v-model.number="chartDemoState.categoryCount"
            type="number"
            min="1"
            max="48"
          />
        </label>
        <label class="row">
          <span class="row-label">
            组数量
            <ParamHint
              text="每组对应一条 ECharts 系列；大于 1 时为分组柱状图，同一类目下多根柱子并排。"
            />
          </span>
          <input
            v-model.number="chartDemoState.groupCount"
            type="number"
            min="1"
            max="8"
          />
        </label>
      </section>

      <section class="block">
        <div class="section-head">
          <h2 class="h">柱宽</h2>
          <ParamHint
            text="固定像素：柱宽为绝对像素。百分比（barWidth）：控制“同一类目下所有柱子的合计宽度”占类目可用宽度的比例；系统会推导分组柱的柱宽与组内间距，并确保柱子不超出各自类目区域。"
          />
        </div>
        <div class="segmented">
          <button
            type="button"
            :class="{ on: chartDemoState.barWidthMode === 'pixel' }"
            @click="chartDemoState.barWidthMode = 'pixel'"
          >
            固定像素
          </button>
          <button
            type="button"
            :class="{ on: chartDemoState.barWidthMode === 'percent' }"
            @click="chartDemoState.barWidthMode = 'percent'"
          >
            百分比
          </button>
        </div>
        <label v-if="chartDemoState.barWidthMode === 'pixel'" class="row">
          <span class="row-label">barWidth (px)</span>
          <input
            v-model.number="chartDemoState.barWidthPixel"
            type="number"
            min="1"
            max="120"
          />
        </label>
        <label v-else class="row row-barwidth-pct">
          <span class="row-label">barWidth (%)</span>
          <input
            v-model.number="chartDemoState.barWidthPercent"
            class="range-input"
            type="range"
            min="5"
            max="100"
            step="1"
            @change="clampBarWidthPercent"
          />
          <input
            v-model.number="chartDemoState.barWidthPercent"
            class="barwidth-pct-num"
            type="number"
            min="5"
            max="100"
            step="1"
            @change="clampBarWidthPercent"
            @blur="clampBarWidthPercent"
          />
          <span class="pct-unit">%</span>
        </label>
        <label class="row check">
          <input v-model="chartDemoState.useBarMaxWidth" type="checkbox" />
          <span class="row-label">barMaxWidth</span>
        </label>
        <label v-if="chartDemoState.useBarMaxWidth" class="row">
          <span class="row-label">px</span>
          <input
            v-model.number="chartDemoState.barMaxWidth"
            type="number"
            min="1"
            max="200"
          />
        </label>
        <label class="row check">
          <input v-model="chartDemoState.useBarMinWidth" type="checkbox" />
          <span class="row-label">barMinWidth</span>
        </label>
        <div v-if="chartDemoState.useBarMinWidth" class="strategy-row">
          <div class="strategy-label">
            小屏策略
            <ParamHint text="当柱宽低于 barMinWidth 时，选择拖拽连续查看（A）或按页翻页（B）。" />
          </div>
          <div class="segmented">
            <button
              type="button"
              :class="{ on: chartDemoState.smallScreenStrategy === 'drag' }"
              @click="chartDemoState.smallScreenStrategy = 'drag'"
            >
              拖拽连续
            </button>
            <button
              type="button"
              :class="{ on: chartDemoState.smallScreenStrategy === 'page' }"
              @click="chartDemoState.smallScreenStrategy = 'page'"
            >
              左滑翻页
            </button>
          </div>
        </div>
        <label v-if="chartDemoState.useBarMinWidth" class="row">
          <span class="row-label">px</span>
          <input
            v-model.number="chartDemoState.barMinWidth"
            type="number"
            min="1"
            max="80"
          />
        </label>
      </section>

      <section v-if="chartDemoState.groupCount > 1" class="block">
        <h2 class="h">组内间距</h2>
        <label class="row">
          <span class="row-label">
            barGap
            <ParamHint
              text="同一类目下、不同系列（组）柱子之间的间距，例如 20%、30%。仅多组时生效。"
            />
          </span>
          <input v-model="chartDemoState.barGap" class="input-text" type="text" />
        </label>
      </section>

      <section class="block block-accordion">
        <button
          type="button"
          class="accordion-head"
          :aria-expanded="gridSectionOpen"
          @click="toggleGridSection"
        >
          <span class="accordion-title-cluster">
            <h2 class="h">Grid</h2>
            <ParamHint :text="gridHintText" />
          </span>
          <span class="accordion-chev" aria-hidden="true">{{
            gridSectionOpen ? '▼' : '▶'
          }}</span>
        </button>
        <div v-show="gridSectionOpen" class="accordion-body">
          <label class="row">
            <span class="row-label">left</span>
            <input v-model="chartDemoState.gridLeft" class="input-text" type="text" />
          </label>
          <label class="row">
            <span class="row-label">right</span>
            <input v-model="chartDemoState.gridRight" class="input-text" type="text" />
          </label>
          <label class="row">
            <span class="row-label">top</span>
            <input v-model="chartDemoState.gridTop" class="input-text" type="text" />
          </label>
          <label class="row">
            <span class="row-label">bottom</span>
            <input v-model="chartDemoState.gridBottom" class="input-text" type="text" />
          </label>
        </div>
      </section>

      <section class="block">
        <div class="section-head">
          <h2 class="h">预设</h2>
          <ParamHint
            text="填写名称后点击「保存当前」或按回车，将当前全部参数写入本地存储；点击名称可载入。"
          />
        </div>
        <div class="preset-add">
          <input
            v-model="presetName"
            class="input-text"
            type="text"
            placeholder="预设名称"
            @keydown.enter.prevent="saveCurrentPreset"
          />
          <button type="button" class="link preset-save-link" @click="saveCurrentPreset">
            保存当前
          </button>
        </div>
        <ul v-if="presets.length" class="preset-list">
          <li v-for="p in presets" :key="p.name" class="preset-item">
            <button type="button" class="link" @click="applyPreset(p)">
              {{ p.name }}
            </button>
            <button
              type="button"
              class="link danger"
              title="删除"
              @click="removePreset(p.name)"
            >
              删除
            </button>
          </li>
        </ul>
        <p v-else class="empty-hint">暂无预设</p>
      </section>

      <section class="block block-export">
        <div class="export-row">
          <h2 class="h">导出</h2>
          <ParamHint
            text="JSON 仅包含图表配置参数（类目数、柱宽策略、grid、barGap 等），不含画布宽度、画布高度等演示用字段。「导出 PNG」为当前预览图表区域白底位图，尺寸与预览一致。"
          />
          <div class="export-actions">
            <button type="button" class="link export-action" @click="copyExport">
              复制 JSON
            </button>
            <button type="button" class="link export-action" @click="exportPng">
              导出 PNG
            </button>
            <ParamHint text="PNG 使用白底，内容与当前图表预览一致（不含右侧参数面板）。" />
          </div>
          <span v-if="copyStatus === 'ok'" class="export-feedback export-ok">已复制。</span>
          <span v-else-if="copyStatus === 'err'" class="export-feedback export-err">复制失败，请手动全选下方文本或检查剪贴板权限。</span>
          <span v-if="pngStatus === 'ok'" class="export-feedback export-ok">已下载 PNG。</span>
          <span v-if="pngStatus === 'err'" class="export-feedback export-err">导出失败，请确认图表已显示。</span>
        </div>
        <textarea class="export" readonly rows="8" :value="exportText" />
      </section>
    </div>
  </aside>
</template>

<style scoped>
.panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-left: 1px solid var(--demo-border);
  background: var(--demo-surface);
  box-shadow: -8px 0 24px rgba(15, 23, 42, 0.06);
}

.panel.collapsed {
  overflow: hidden;
}

.collapse-btn {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  width: 100%;
  padding: 0.65rem 0.5rem;
  border: none;
  border-bottom: 1px solid var(--demo-border);
  background: var(--demo-surface-2);
  color: var(--demo-text);
  cursor: pointer;
  font-size: 0.85rem;
}

.collapse-btn:hover {
  background: color-mix(in oklab, var(--demo-accent) 12%, var(--demo-surface-2));
}

.chev {
  font-size: 1.1rem;
  line-height: 1;
}

.collapse-label {
  font-weight: 500;
}

.panel-body {
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
  min-width: 0;
  padding: 0.75rem 0.9rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.block {
  padding-bottom: 0.65rem;
  border-bottom: 1px solid var(--demo-border);
}

.block:last-of-type {
  border-bottom: none;
}

.section-head {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.5rem;
}

.section-head .h {
  margin: 0;
}

.accordion-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.1rem 0;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  color: inherit;
}

.accordion-title-cluster {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex: 1;
  min-width: 0;
}

.accordion-head .h {
  margin: 0;
  flex: 0 0 auto;
}

.accordion-chev {
  flex: 0 0 auto;
  font-size: 0.65rem;
  color: var(--demo-muted);
}

.accordion-body {
  padding-top: 0.35rem;
}

.h {
  margin: 0 0 0.5rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--demo-muted);
}

.row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.45rem;
  font-size: 0.84rem;
  color: var(--demo-text);
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.row-label {
  flex: 0 0 7.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
  color: var(--demo-muted);
  font-size: 0.8rem;
}

.row input[type='number'],
.row input[type='text'],
.input-text {
  flex: 1;
  min-width: 0;
  padding: 0.3rem 0.45rem;
  border: 1px solid var(--demo-border);
  border-radius: 6px;
  background: var(--demo-bg);
  color: var(--demo-text);
  font-size: 0.84rem;
}

/* range 默认 min-width 较大，易撑出横向滚动条，限制滑轨长度 */
.row input[type='range'],
.range-input {
  flex: 1 1 0;
  min-width: 0;
  max-width: 5.25rem;
  width: 100%;
  height: 1.35rem;
  accent-color: var(--demo-accent);
}

.row-barwidth-pct .pct-unit {
  flex: 0 0 auto;
  font-size: 0.8rem;
  color: var(--demo-muted);
}

.row-barwidth-pct input[type='number'].barwidth-pct-num {
  flex: 0 0 3.25rem;
  min-width: 3rem;
  max-width: 4rem;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.row.check {
  gap: 0.4rem;
}

.row.check input {
  flex: 0 0 auto;
}

.empty-hint {
  margin: 0.35rem 0 0;
  font-size: 0.78rem;
  color: var(--demo-muted);
}

.segmented {
  display: flex;
  gap: 0;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--demo-border);
}

.strategy-row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.5rem;
}

.strategy-label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.84rem;
  color: var(--demo-muted);
}

.segmented button {
  flex: 1;
  padding: 0.35rem 0.4rem;
  font-size: 0.78rem;
  border: none;
  background: var(--demo-bg);
  color: var(--demo-muted);
  cursor: pointer;
}

.segmented button.on {
  background: color-mix(in oklab, var(--demo-accent) 18%, var(--demo-bg));
  color: var(--demo-text);
  font-weight: 600;
}

.preset-add {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}

.preset-save-link {
  flex: 0 0 auto;
  font-size: 0.84rem;
  white-space: nowrap;
}

.btn {
  padding: 0.35rem 0.6rem;
  font-size: 0.82rem;
  border-radius: 8px;
  border: 1px solid var(--demo-border);
  background: var(--demo-surface);
  cursor: pointer;
  color: var(--demo-text);
}

.btn.primary {
  background: var(--demo-accent);
  border-color: var(--demo-accent);
  color: #fff;
  font-weight: 600;
  white-space: nowrap;
}

.preset-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.preset-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.25rem 0;
  font-size: 0.84rem;
}

.link {
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  color: var(--demo-accent);
  text-align: left;
}

.link.danger {
  color: #b91c1c;
  flex: 0 0 auto;
  font-size: 0.78rem;
}

.block-export {
  padding-top: 0.15rem;
}

.export-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.65rem;
}

.block-export .h {
  margin: 0;
}

.export-actions {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  margin-left: auto;
}

.export-action {
  font-size: 0.84rem;
  white-space: nowrap;
}

.export-feedback {
  font-size: 0.78rem;
  white-space: nowrap;
}

.export-ok {
  color: #15803d;
}

.export-err {
  color: #b91c1c;
}

.export {
  box-sizing: border-box;
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.45rem;
  font-size: 0.72rem;
  line-height: 1.35;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  border-radius: 8px;
  border: 1px solid var(--demo-border);
  background: var(--demo-bg);
  color: var(--demo-text);
  resize: vertical;
}
</style>
