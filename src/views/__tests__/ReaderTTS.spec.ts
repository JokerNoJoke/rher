import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Reader from '../Reader.vue'
import { useReadingStore } from '@/stores/readingStore'
import { useTTSStore } from '@/stores/ttsStore'

// Mock Tauri modules
vi.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: vi.fn().mockResolvedValue('Some content')
}))

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn()
}))

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: 'Home' } }, { path: '/reader', component: Reader }]
})

describe('Reader.vue TTS Integration', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        const store = useReadingStore()
        store.currentBook = {
            path: 'test.txt',
            title: 'Test Book',
            progress: 0,
            timestamp: Date.now()
        }
    })

    it('shows the listen button and enables TTS on click', async () => {
        const wrapper = mount(Reader, {
            global: {
                plugins: [router]
            }
        })

        const ttsStore = useTTSStore()
        expect(ttsStore.config.enabled).toBe(false)

        const headsetBtn = wrapper.find('button[title="Listen (听书)"]')
        expect(headsetBtn.exists()).toBe(true)

        await headsetBtn.trigger('click')
        expect(ttsStore.config.enabled).toBe(true)
        
        // Check if TTSPlayerBar is rendered (it has .tts-player-bar class when enabled)
        expect(wrapper.find('.tts-player-bar').exists()).toBe(true)
    })
})
