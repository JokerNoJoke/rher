import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TTSSettings from '../TTSSettings.vue'
import { useTTSStore } from '@/stores/ttsStore'

describe('TTSSettings.vue', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    it('renders active profile data', () => {
        const ttsStore = useTTSStore()
        const wrapper = mount(TTSSettings)
        
        const urlInput = wrapper.find('input[placeholder="http://127.0.0.1:9880/"]')
        expect((urlInput.element as HTMLInputElement).value).toBe(ttsStore.config.profiles[0].url)
    })

    it('updates profile url on input', async () => {
        const ttsStore = useTTSStore()
        const wrapper = mount(TTSSettings)
        
        const urlInput = wrapper.find('input[placeholder="http://127.0.0.1:9880/"]')
        await urlInput.setValue('http://new-url.com')
        
        expect(ttsStore.config.profiles[0].url).toBe('http://new-url.com')
    })

    it('updates responseType on input', async () => {
        const ttsStore = useTTSStore()
        const wrapper = mount(TTSSettings)
        
        const responseTypeInput = wrapper.find('input[list="mime-types"]')
        await responseTypeInput.setValue('audio/aac')
        
        expect(ttsStore.config.profiles[0].responseType).toBe('audio/aac')
    })

    it('emits close event', async () => {
        const wrapper = mount(TTSSettings)
        await wrapper.find('.close-btn').trigger('click')
        expect(wrapper.emitted()).toHaveProperty('close')
    })

    it('resets to defaults when reset button is clicked', async () => {
        const ttsStore = useTTSStore()
        const wrapper = mount(TTSSettings)
        
        // Mock resetToDefaults action
        ttsStore.resetToDefaults = vi.fn()
        
        const resetBtn = wrapper.find('.reset-btn')
        expect(resetBtn.exists()).toBe(true)
        
        await resetBtn.trigger('click')
        expect(ttsStore.resetToDefaults).toHaveBeenCalled()
    })

    it('shows visual feedback after reset', async () => {
        vi.useFakeTimers()
        const ttsStore = useTTSStore()
        const wrapper = mount(TTSSettings)
        ttsStore.resetToDefaults = vi.fn()
        
        const resetBtn = wrapper.find('.reset-btn')
        
        await resetBtn.trigger('click')
        
        // Check immediate feedback
        expect(resetBtn.text()).toContain('Restored!')
        expect(resetBtn.classes()).toContain('resetting')
        
        // Advance time
        vi.advanceTimersByTime(1000)
        await wrapper.vm.$nextTick()
        
        // Check reset state
        expect(resetBtn.text()).toContain('Reset to Defaults')
        expect(resetBtn.classes()).not.toContain('resetting')
        
        vi.useRealTimers()
    })
})
