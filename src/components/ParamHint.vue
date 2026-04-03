<script setup lang="ts">
defineProps<{
  /** 气泡内说明文案 */
  text: string
}>()
</script>

<template>
  <span class="ph" @click.stop>
    <button
      type="button"
      class="ph-btn"
      tabindex="0"
      aria-label="参数说明"
    >
      i
    </button>
    <span class="ph-bubble" role="tooltip">{{ text }}</span>
  </span>
</template>

<style scoped>
.ph {
  position: relative;
  display: inline-flex;
  align-items: center;
  align-self: center;
  vertical-align: middle;
  flex: 0 0 auto;
}

.ph-btn {
  box-sizing: border-box;
  width: 1rem;
  height: 1rem;
  margin: 0;
  padding: 0;
  border: 1px solid color-mix(in oklab, var(--hint-border, var(--demo-border)) 92%, var(--demo-accent) 8%);
  border-radius: 50%;
  background: color-mix(in oklab, var(--hint-bg, var(--demo-bg-elevated)) 96%, var(--demo-accent) 4%);
  color: var(--hint-muted, var(--demo-muted));
  font-size: 0.58rem;
  font-weight: 700;
  font-style: italic;
  font-family: Georgia, 'Times New Roman', serif;
  line-height: 1;
  cursor: help;
}

.ph-btn:hover,
.ph-btn:focus-visible {
  border-color: var(--hint-accent, var(--demo-accent, #2563eb));
  color: var(--hint-accent, var(--demo-accent, #2563eb));
  outline: none;
}

.ph-bubble {
  position: absolute;
  left: 0;
  top: calc(100% + 6px);
  z-index: 100;
  width: max-content;
  max-width: min(280px, calc(100vw - 120px));
  padding: 0.5rem 0.6rem;
  font-size: 0.78rem;
  font-weight: 400;
  font-style: normal;
  line-height: 1.45;
  text-align: left;
  color: var(--hint-text, var(--demo-text, #18181b));
  background: var(--hint-surface, var(--demo-surface, #fff));
  border: 1px solid var(--hint-border, var(--demo-border, #e4e4e7));
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition:
    opacity 0.12s ease,
    visibility 0.12s ease;
}

.ph:hover .ph-bubble,
.ph:focus-within .ph-bubble {
  opacity: 1;
  visibility: visible;
}
</style>
