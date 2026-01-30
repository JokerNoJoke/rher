import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTTSStore } from '@/stores/ttsStore'
import { DEFAULT_TTS_PROFILE, DEFAULT_TTS_CONFIG } from '@/types/ttsConfig'

describe('TTS Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default configuration', () => {
    const store = useTTSStore()
    expect(store.config.profiles).toHaveLength(1)
    expect(store.config.activeProfileId).toBe(DEFAULT_TTS_PROFILE.id)
    expect(store.isPlaying).toBe(false)
  })

  it('can update configuration', () => {
    const store = useTTSStore()
    store.updateConfig({ enabled: true })
    expect(store.config.enabled).toBe(true)
  })

  it('can toggle playback state', () => {
    const store = useTTSStore()
    store.play()
    expect(store.isPlaying).toBe(true)
    store.pause()
    expect(store.isPlaying).toBe(false)
  })

  it('can stop playback', () => {
    const store = useTTSStore()
    store.play()
    store.stop()
    expect(store.isPlaying).toBe(false)
    // Additional stop logic (resetting index) might be added later
  })

  it('resets configuration to defaults', () => {
    const store = useTTSStore()
    // Modify config first
    store.updateConfig({
        enabled: !DEFAULT_TTS_CONFIG.enabled,
        activeProfileId: 'modified'
    })

    store.resetToDefaults()

    expect(store.config).toEqual(DEFAULT_TTS_CONFIG)
  })
})
