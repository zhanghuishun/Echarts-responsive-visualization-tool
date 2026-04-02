<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ParamHint from '@/components/ParamHint.vue'
import {
  chartDemoState,
  DEFAULT_COLOR_PALETTE,
  DEFAULT_GRID,
  PALETTE_PRESETS,
  PANEL_COLLAPSED_STRIP_PX,
  PANEL_EXPANDED_WIDTH_PX,
  type ChartDemoState,
} from '@/state/chartDemoState'
import {
  loadPresets,
  savePresets,
  type PresetRecord,
} from '@/composables/presets'

const props = defineProps<{
  effectiveCanvasWidth: number
}>()

const presets = ref<PresetRecord[]>(loadPresets())
const presetName = ref('')
const copyStatus = ref<'idle' | 'ok' | 'err'>('idle')
/** Grid 高级调节：默认收起，收起时恢复 DEFAULT_GRID */
const gridSectionOpen = ref(false)

function toggleGridSection() {
  if (gridSectionOpen.value) {
    Object.assign(chartDemoState, DEFAULT_GRID)
  }
  gridSectionOpen.value = !gridSectionOpen.value
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

function applyPreset(p: PresetRecord) {
  const raw = JSON.parse(JSON.stringify(p.state)) as Partial<ChartDemoState>
  if (!raw.colorPalette?.length) {
    raw.colorPalette = [...DEFAULT_COLOR_PALETTE]
  }
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

const exportText = computed(() => {
  const payload = {
    effectiveCanvasWidth: props.effectiveCanvasWidth,
    canvasWidthModel: chartDemoState.canvasWidth,
    chart: cloneState(),
  }
  return JSON.stringify(payload, null, 2)
})

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

function applyPalettePreset(key: keyof typeof PALETTE_PRESETS) {
  const p = PALETTE_PRESETS[key]
  chartDemoState.colorPalette = [...p]
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
          <h2 class="h">全局配色</h2>
          <ParamHint
            text="对应 ECharts 全局 color：按系列顺序取色，多于色盘个数时循环。分组图每组对应一种颜色。"
          />
        </div>
        <div class="palette-presets">
          <button
            type="button"
            class="btn chip"
            @click="applyPalettePreset('default')"
          >
            默认
          </button>
          <button
            type="button"
            class="btn chip"
            @click="applyPalettePreset('warm')"
          >
            暖色
          </button>
          <button
            type="button"
            class="btn chip"
            @click="applyPalettePreset('cool')"
          >
            冷色
          </button>
          <button
            type="button"
            class="btn chip"
            @click="applyPalettePreset('contrast')"
          >
            高对比
          </button>
        </div>
        <div class="palette-grid">
          <label
            v-for="(_, index) in chartDemoState.colorPalette"
            :key="index"
            class="color-slot"
          >
            <span class="color-index">{{ index + 1 }}</span>
            <input
              v-model="chartDemoState.colorPalette[index]"
              class="color-input"
              type="color"
            />
          </label>
        </div>
      </section>

      <section class="block">
        <div class="section-head">
          <h2 class="h">数据墨水比（inkRatio）</h2>
          <ParamHint
            text="固定像素：柱宽为绝对像素。百分比（inkRatio）：控制“同一类目下所有柱子的合计宽度”占类目可用宽度的比例；系统会推导分组柱的柱宽与组内间距，并确保柱子不超出各自类目区域。"
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
          <span class="row-label">inkRatio (%)</span>
          <input
            v-model.number="chartDemoState.barWidthPercent"
            class="range-input"
            type="range"
            min="5"
            max="100"
            step="1"
          />
          <span class="mono">{{ chartDemoState.barWidthPercent }}%</span>
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

      <section class="block">
        <h2 class="h">类目间距</h2>
        <label class="row">
          <span class="row-label">
            barCategoryGap
            <ParamHint
              text="当前新算法不使用 barCategoryGap，为了保证口径一致，固定为 0%。"
            />
          </span>
          <input
            v-model="chartDemoState.barCategoryGap"
            class="input-text"
            type="text"
            disabled
          />
        </label>
        <label v-if="chartDemoState.groupCount > 1" class="row">
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
        <div class="grid-head-row">
          <button
            type="button"
            class="accordion-head"
            :aria-expanded="gridSectionOpen"
            @click="toggleGridSection"
          >
            <h2 class="h">Grid</h2>
            <span class="accordion-chev" aria-hidden="true">{{
              gridSectionOpen ? '▼' : '▶'
            }}</span>
          </button>
          <ParamHint :text="gridHintText" />
        </div>
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
          <button type="button" class="btn primary" @click="saveCurrentPreset">
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

      <section class="block">
        <div class="section-head">
          <h2 class="h">导出</h2>
          <ParamHint
            text="JSON 包含当前有效画布宽度、画布宽度模型与全部图表参数，便于交给开发复现。"
          />
        </div>
        <button type="button" class="btn primary" @click="copyExport">
          复制 JSON 到剪贴板
        </button>
        <p v-if="copyStatus === 'ok'" class="ok">已复制。</p>
        <p v-else-if="copyStatus === 'err'" class="err">复制失败，请手动全选下方文本。</p>
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

.grid-head-row {
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
  margin-bottom: 0.15rem;
}

.grid-head-row .accordion-head {
  flex: 1;
  min-width: 0;
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

.accordion-head .h {
  margin: 0;
  flex: 1;
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

.row-barwidth-pct .mono {
  flex: 0 0 auto;
}

.row.check {
  gap: 0.4rem;
}

.row.check input {
  flex: 0 0 auto;
}

.mono {
  font-variant-numeric: tabular-nums;
  font-size: 0.8rem;
  color: var(--demo-muted);
  min-width: 2.5rem;
  text-align: right;
}

.empty-hint {
  margin: 0.35rem 0 0;
  font-size: 0.78rem;
  color: var(--demo-muted);
}

.palette-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.55rem;
}

.btn.chip {
  padding: 0.28rem 0.55rem;
  font-size: 0.76rem;
}

.palette-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.45rem 0.5rem;
}

.color-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  margin: 0;
  cursor: pointer;
}

.color-index {
  font-size: 0.65rem;
  color: var(--demo-muted);
  font-variant-numeric: tabular-nums;
}

.color-input {
  box-sizing: border-box;
  width: 100%;
  max-width: 3.25rem;
  height: 1.85rem;
  padding: 0;
  border: 1px solid var(--demo-border);
  border-radius: 6px;
  cursor: pointer;
  background: var(--demo-bg);
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 3px;
}

.color-input::-webkit-color-swatch {
  border: none;
  border-radius: 4px;
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
  gap: 0.4rem;
  margin-bottom: 0.5rem;
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

.export {
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

.ok {
  margin: 0.35rem 0 0;
  font-size: 0.78rem;
  color: #15803d;
}

.err {
  margin: 0.35rem 0 0;
  font-size: 0.78rem;
  color: #b91c1c;
}
</style>
