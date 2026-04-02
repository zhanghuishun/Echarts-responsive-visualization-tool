import type { ChartDemoState } from '@/state/chartDemoState'

export const PRESETS_STORAGE_KEY = 'echarts-responsive-demo-presets-v1'

export interface PresetRecord {
  name: string
  state: ChartDemoState
}

export function loadPresets(): PresetRecord[] {
  try {
    const raw = localStorage.getItem(PRESETS_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (p): p is PresetRecord =>
        typeof p === 'object' &&
        p !== null &&
        'name' in p &&
        'state' in p &&
        typeof (p as PresetRecord).name === 'string',
    )
  } catch {
    return []
  }
}

export function savePresets(list: PresetRecord[]): void {
  localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(list))
}
