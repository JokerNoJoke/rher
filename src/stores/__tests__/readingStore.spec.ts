import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useReadingStore } from '../readingStore'

describe('readingStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        // Clear localStorage mock if needed, or rely on fresh pinia instance
        localStorage.clear()
    })

    it('removes multiple items from history by path', () => {
        const store = useReadingStore()
        
        // Setup initial state
        store.history = [
            { path: '/book1.epub', title: 'Book 1', progress: 10, timestamp: 100 },
            { path: '/book2.epub', title: 'Book 2', progress: 20, timestamp: 200 },
            { path: '/book3.epub', title: 'Book 3', progress: 30, timestamp: 300 },
        ]

        store.removeItemsFromHistory(['/book1.epub', '/book3.epub'])

        expect(store.history).toHaveLength(1)
        expect(store.history[0].path).toBe('/book2.epub')
    })

    it('does nothing if paths do not exist', () => {
        const store = useReadingStore()
        store.history = [
            { path: '/book1.epub', title: 'Book 1', progress: 10, timestamp: 100 },
        ]

        store.removeItemsFromHistory(['/nonexistent.epub'])
        
        expect(store.history).toHaveLength(1)
        expect(store.history[0].path).toBe('/book1.epub')
    })
})
