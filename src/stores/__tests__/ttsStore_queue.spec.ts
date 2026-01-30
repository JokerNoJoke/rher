import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTTSStore } from '@/stores/ttsStore'

describe('TTS Store Playback Queue', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        vi.clearAllMocks()
    })

    it('should initialize with an empty queue', () => {
        const store = useTTSStore()
        expect(store.queue).toEqual([])
        expect(store.currentChunkIndex).toBe(0)
    })

    it('should set the queue', () => {
        const store = useTTSStore()
        const chunks = ['Chunk 1', 'Chunk 2']
        store.setQueue(chunks)
        expect(store.queue).toEqual(chunks)
        expect(store.currentChunkIndex).toBe(0)
    })

    it('should move to the next chunk', () => {
        const store = useTTSStore()
        store.setQueue(['C1', 'C2', 'C3'])
        store.nextChunk()
        expect(store.currentChunkIndex).toBe(1)
        store.nextChunk()
        expect(store.currentChunkIndex).toBe(2)
    })

    it('should stop and reset when reaching the end of the queue', () => {
        const store = useTTSStore()
        store.setQueue(['C1'])
        store.play()
        store.nextChunk()
        expect(store.currentChunkIndex).toBe(0)
        expect(store.isPlaying).toBe(false)
    })

    it('should reset index on stop', () => {
        const store = useTTSStore()
        store.setQueue(['C1', 'C2'])
        store.nextChunk()
        expect(store.currentChunkIndex).toBe(1)
        store.stop()
        expect(store.currentChunkIndex).toBe(0)
        expect(store.isPlaying).toBe(false)
    })
})
