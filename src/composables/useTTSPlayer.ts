import { ref, watch, onUnmounted } from 'vue'
import { useTTSStore } from '@/stores/ttsStore'
import { fetchAudio } from '@/utils/ttsEngine'

export function useTTSPlayer() {
    const store = useTTSStore()
    const audio = new Audio()
    const abortController = ref<AbortController | null>(null)

    // Handle Audio Events
    audio.onended = () => {
        store.nextChunk()
    }

    audio.onerror = (e) => {
        console.error('Audio playback error', e)
        store.setError('Audio playback failed')
    }

    // Playback Loop
    const playCurrentChunk = async () => {
        const text = store.queue[store.currentChunkIndex]
        if (!text) {
             store.stop()
             return
        }

        store.isLoading = true
        store.error = null

        try {
            // Check cache first
            let blobUrl = store.audioCache.get(store.currentChunkIndex)

            if (!blobUrl) {
                // Fetch if not in cache
                if (abortController.value) abortController.value.abort()
                abortController.value = new AbortController()

                const activeProfile = store.config.profiles.find(p => p.id === store.config.activeProfileId)
                if (!activeProfile) throw new Error('No active TTS profile')

                const blob = await fetchAudio(activeProfile, { text })
                blobUrl = URL.createObjectURL(blob)
                store.audioCache.set(store.currentChunkIndex, blobUrl)
            }

            if (!store.isPlaying) return // Stopped while fetching

            audio.src = blobUrl
            await audio.play()
            store.isLoading = false

            // Pre-fetch next chunk
            preloadNextChunk(store.currentChunkIndex + 1)

        } catch (err: any) {
            if (err.name === 'AbortError') return
            console.error(err)
            store.setError(err.message || 'Failed to load audio')
        } finally {
            if (store.error) store.isLoading = false
        }
    }

    const preloadNextChunk = async (index: number) => {
        if (index >= store.queue.length || store.audioCache.has(index)) return

        const text = store.queue[index]
        const activeProfile = store.config.profiles.find(p => p.id === store.config.activeProfileId)
        if (!activeProfile) return

        try {
            const blob = await fetchAudio(activeProfile, { text })
            const blobUrl = URL.createObjectURL(blob)
            store.audioCache.set(index, blobUrl)
        } catch (e) {
            console.warn('Preload failed', e)
        }
    }

    // Watchers
    watch(() => store.isPlaying, (playing) => {
        if (playing) {
            if (audio.paused) {
                // Resume or start
                if (audio.src) {
                    audio.play()
                } else {
                    playCurrentChunk()
                }
            }
        } else {
            audio.pause()
        }
    })

    watch(() => store.currentChunkIndex, (newIndex) => {
        if (store.isPlaying) {
            playCurrentChunk()
        }
    })

    // Cleanup
    onUnmounted(() => {
        audio.pause()
        audio.src = ''
        if (abortController.value) abortController.value.abort()
    })

    return {
        audio // Expose if needed for visualization later
    }
}
