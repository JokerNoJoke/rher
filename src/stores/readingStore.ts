import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'

export interface BookRecord {
    path: string
    title: string
    lastReadCfi?: string // for epub
    lastReadLineIndex?: number // for txt
    progress: number // 0-100
    timestamp: number
    theme?: string
    fontSize?: number
}

export const useReadingStore = defineStore('reading', {
    state: () => ({
        history: useLocalStorage<BookRecord[]>('rher-reading-history', []),
        currentTheme: useLocalStorage('rher-theme', 'paper'),
        currentBook: null as BookRecord | null, // Transient state for current session
    }),
    actions: {
        addToHistory(book: BookRecord) {
            const index = this.history.findIndex(h => h.path === book.path)
            if (index > -1) {
                this.history[index] = { ...this.history[index], ...book, timestamp: Date.now() }
            } else {
                this.history.push({ ...book, timestamp: Date.now() })
            }
        },
        getHistory(path: string) {
            return this.history.find(h => h.path === path)
        },
        updateProgress(path: string, update: Partial<BookRecord>) {
            const index = this.history.findIndex(h => h.path === path)
            if (index > -1) {
                this.history[index] = { ...this.history[index], ...update, timestamp: Date.now() }
                // Also update currentBook if it matches, to keep UI in sync
                if (this.currentBook && this.currentBook.path === path) {
                     this.currentBook = { ...this.currentBook, ...update, timestamp: Date.now() }
                }
            }
        },
        setCurrentBook(book: BookRecord) {
            this.currentBook = book
        },
        updateBookPath(oldPath: string, newPath: string) {
            const index = this.history.findIndex(h => h.path === oldPath)
            if (index > -1) {
                const book = { ...this.history[index], path: newPath, timestamp: Date.now() }
                this.history[index] = book
                if (this.currentBook && this.currentBook.path === oldPath) {
                    this.currentBook = book
                }
            }
        },
        removeItemsFromHistory(paths: string[]) {
            this.history = this.history.filter(h => !paths.includes(h.path))
            if (this.currentBook && paths.includes(this.currentBook.path)) {
                this.currentBook = null
            }
        }
    }
})
