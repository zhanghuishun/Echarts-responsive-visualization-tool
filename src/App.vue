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
  background-image: radial-gradient(
    ellipse 120% 80% at 10% -20%,
    color-mix(in oklab, var(--demo-accent) 8%, transparent),
    transparent 55%
  );
}

.main {
  box-sizing: border-box;
  padding: clamp(1rem, 2.5vw, 1.75rem) clamp(0.75rem, 2.5vw, 1.5rem)
    clamp(1.5rem, 4vw, 2.5rem);
  max-width: 100%;
}
</style>
