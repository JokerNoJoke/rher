import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { DEFAULT_TTS_CONFIG, type TTSConfig } from '@/types/ttsConfig'

export const useTTSStore = defineStore('tts', {
    state: () => ({
        config: useLocalStorage<TTSConfig>('rher-tts-config', DEFAULT_TTS_CONFIG),
        isPlaying: false,
        isLoading: false,
        error: null as string | null,
        currentChunkIndex: 0,
        queue: [] as string[],
        audioCache: new Map<number, string>(), // chunkIndex -> objectUrl
    }),
    actions: {
        play() {
            this.isPlaying = true
            this.error = null
        },
        pause() {
            this.isPlaying = false
        },
        stop() {
            this.isPlaying = false
            this.currentChunkIndex = 0
            this.error = null
            this.clearCache()
        },
        setError(msg: string | null) {
            this.error = msg
            this.isPlaying = false
            this.isLoading = false
        },
        setQueue(chunks: string[]) {
            this.queue = chunks
            this.currentChunkIndex = 0
            this.clearCache()
        },
        nextChunk() {
            if (this.currentChunkIndex < this.queue.length - 1) {
                this.currentChunkIndex++
            } else {
                this.stop()
            }
        },
        clearCache() {
            this.audioCache.forEach(url => URL.revokeObjectURL(url))
            this.audioCache.clear()
        },
        updateConfig(update: Partial<TTSConfig>) {
            this.config = { ...this.config, ...update }
        },
        resetToDefaults() {
            this.config = JSON.parse(JSON.stringify(DEFAULT_TTS_CONFIG))
        }
    }
})
