<script setup lang="ts">
import { computed } from 'vue'
import DeviceCanvas from '@/components/DeviceCanvas.vue'
import ControlPanel from '@/components/ControlPanel.vue'
import {
  chartDemoState,
  PANEL_COLLAPSED_STRIP_PX,
  PANEL_EXPANDED_WIDTH_PX,
} from '@/state/chartDemoState'
import { useEffectiveCanvasWidth } from '@/composables/useEffectiveCanvasWidth'

const { effectiveCanvasWidth, maxCanvasWidth } = useEffectiveCanvasWidth()

const mainStyle = computed(() => {
  const panel = chartDemoState.panelCollapsed
    ? PANEL_COLLAPSED_STRIP_PX
    : PANEL_EXPANDED_WIDTH_PX
  return {
    paddingRight: `${panel}px`,
  }
})
</script>

<template>
  <div class="app">
    <main class="main" :style="mainStyle">
      <DeviceCanvas
        :effective-width="effectiveCanvasWidth"
        :max-canvas-width="maxCanvasWidth"
      />
    </main>
    <ControlPanel />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background: var(--demo-bg);
}

.main {
  box-sizing: border-box;
  padding: 1.25rem 0 2rem 1.25rem;
  max-width: 100%;
}
</style>
