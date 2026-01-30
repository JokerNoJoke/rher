import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTTSStore } from '@/stores/ttsStore'

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

describe('TTS Store Audio Cache', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        vi.clearAllMocks()
    })

    it('should initialize with an empty cache', () => {
        const store = useTTSStore()
        expect(store.audioCache.size).toBe(0)
    })

    it('should add to cache', () => {
        const store = useTTSStore()
        store.audioCache.set(0, 'blob:url-0')
        expect(store.audioCache.get(0)).toBe('blob:url-0')
    })

    it('should clear cache and revoke URLs', () => {
        const store = useTTSStore()
        store.audioCache.set(0, 'blob:url-0')
        store.audioCache.set(1, 'blob:url-1')
        
        store.clearCache()
        
        expect(store.audioCache.size).toBe(0)
        expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2)
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:url-0')
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:url-1')
    })

    it('should clear cache on stop', () => {
        const store = useTTSStore()
        store.audioCache.set(0, 'blob:url-0')
        store.stop()
        expect(store.audioCache.size).toBe(0)
    })
})
