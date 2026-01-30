import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TTSPlayerBar from '../TTSPlayerBar.vue'
import { useTTSStore } from '@/stores/ttsStore'

describe('TTSPlayerBar.vue', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    it('is hidden when tts is disabled', () => {
        const ttsStore = useTTSStore()
        ttsStore.config.enabled = false
        const wrapper = mount(TTSPlayerBar)
        expect(wrapper.find('.tts-player-bar').exists()).toBe(false)
    })

    it('shows controls when enabled', () => {
        const ttsStore = useTTSStore()
        ttsStore.config.enabled = true
        const wrapper = mount(TTSPlayerBar)
        expect(wrapper.find('.tts-player-bar').exists()).toBe(true)
        expect(wrapper.find('.main-action').exists()).toBe(true)
    })

    it('toggles play/pause state', async () => {
        const ttsStore = useTTSStore()
        ttsStore.config.enabled = true
        const wrapper = mount(TTSPlayerBar)
        
        const mainBtn = wrapper.find('.main-action')
        await mainBtn.trigger('click')
        expect(ttsStore.isPlaying).toBe(true)

        await mainBtn.trigger('click')
        expect(ttsStore.isPlaying).toBe(false)
    })

    it('stops playback and closes on close button', async () => {
        const ttsStore = useTTSStore()
        ttsStore.config.enabled = true
        ttsStore.play()
        
        const wrapper = mount(TTSPlayerBar)
        await wrapper.find('.close-btn').trigger('click')
        
        expect(ttsStore.isPlaying).toBe(false)
        expect(ttsStore.config.enabled).toBe(false)
    })
})
