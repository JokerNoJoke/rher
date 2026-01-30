<template>
  <div class="home-container">
    <div class="hero">
      <h1 class="title">Rher</h1>
      <p class="subtitle">A minimal, distraction-free reader.</p>
      
      <button class="open-btn" @click="openFile">
        <component :is="BookOpenIcon" :size="20" />
        Open Book
      </button>
    </div>

    <div class="recent-list" v-if="history.length">
      <div class="list-header">
        <h2>Recent Reads</h2>
        <button class="manage-btn" @click="toggleManageMode">
          {{ isManageMode ? 'Done' : 'Manage' }}
        </button>
      </div>
      
      <div v-for="book in history" :key="book.path" 
        :class="['book-card', { 'selected': selectedPaths.has(book.path), 'manage-mode': isManageMode }]" 
        @click="handleBookClick(book)">
        <div class="book-info">
          <div class="title-row">
            <div v-if="isManageMode" class="book-checkbox">
              <component :is="CheckIcon" v-if="selectedPaths.has(book.path)" :size="14" />
            </div>
            <span class="book-title">{{ book.title }}</span>
          </div>
          <span class="book-path">{{ book.path }}</span>
        </div>
        <div class="book-progress" v-if="book.progress > 0">
          {{ Math.round(book.progress * 100) }}%
        </div>
      </div>

      <div v-if="isManageMode" class="bulk-actions">
        <button class="select-all-btn" @click="toggleSelectAll">
          {{ selectedPaths.size === history.length ? 'Deselect All' : 'Select All' }}
        </button>
        <button class="delete-btn" :disabled="selectedPaths.size === 0" @click="deleteSelected">
          <component :is="TrashIcon" :size="16" />
          Delete Selected ({{ selectedPaths.size }})
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useReadingStore, type BookRecord } from '@/stores/readingStore'
import { open } from '@tauri-apps/plugin-dialog'
import { BookOpen as BookOpenIcon, Check as CheckIcon, Trash2 as TrashIcon } from 'lucide-vue-next'

const router = useRouter()
const store = useReadingStore()

const isManageMode = ref(false)
const selectedPaths = ref<Set<string>>(new Set())

const history = computed(() => [...store.history].sort((a: BookRecord, b: BookRecord) => b.timestamp - a.timestamp))

const toggleManageMode = () => {
    isManageMode.value = !isManageMode.value
    if (!isManageMode.value) {
        selectedPaths.value.clear()
    }
}

const handleBookClick = (book: BookRecord) => {
    if (isManageMode.value) {
        if (selectedPaths.value.has(book.path)) {
            selectedPaths.value.delete(book.path)
        } else {
            selectedPaths.value.add(book.path)
        }
    } else {
        openHistory(book)
    }
}

const toggleSelectAll = () => {
    if (selectedPaths.value.size === history.value.length) {
        selectedPaths.value.clear()
    } else {
        history.value.forEach(book => selectedPaths.value.add(book.path))
    }
}

const deleteSelected = () => {
    if (selectedPaths.value.size > 0) {
        store.removeItemsFromHistory(Array.from(selectedPaths.value))
        isManageMode.value = false
        selectedPaths.value.clear()
    }
}

const openFile = async () => {
    try {
        const selected = await open({
            multiple: false,
            filters: [{
                name: 'Books',
                extensions: ['txt', 'epub']
            }]
        })
        
        if (selected && typeof selected === 'string') { // v2 open returns string | string[] | null
            // Check if already in history
            let book = store.getHistory(selected)
            if (!book) {
                // Determine title from filename
                const title = selected.split(/[\\/]/).pop() || 'Unknown'
                book = {
                    path: selected,
                    title,
                    progress: 0,
                    timestamp: Date.now()
                }
                store.addToHistory(book)
            }
            
            store.setCurrentBook(book)
            router.push('/read')
        }
    } catch (err) {
        console.error('Failed to open file:', err)
    }
}

const openHistory = (book: BookRecord) => {
    store.setCurrentBook(book)
    router.push('/read')
}
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.hero {
  text-align: center;
  margin-bottom: 4rem;
}

.title {
  font-size: 4rem;
  font-weight: 800;
  margin-bottom: 1rem;
  letter-spacing: -0.05em;
  background: linear-gradient(135deg, var(--text-color), var(--accent-color));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.subtitle {
  font-size: 1.25rem;
  color: var(--text-color);
  opacity: 0.7;
  margin-bottom: 2rem;
}

.open-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--text-color);
  color: var(--bg-color);
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  transition: transform 0.2s, opacity 0.2s;
}

.open-btn:hover {
  transform: translateY(-2px);
  opacity: 0.9;
}

.recent-list {
  width: 100%;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
}

.list-header h2 {
  font-size: 1.5rem;
  margin-bottom: 0;
  border-bottom: none;
  padding-bottom: 0;
}

.manage-btn {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--accent-color);
  background: none;
  border: 1px solid var(--accent-color);
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.manage-btn:hover {
  background: var(--accent-color);
  color: white;
}

.book-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--sidebar-bg);
  border-radius: 8px;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: transform 0.1s, border-color 0.2s, background-color 0.2s;
  border: 2px solid transparent;
}

.book-card.selected {
  border-color: var(--accent-color);
  background: color-mix(in srgb, var(--accent-color), transparent 90%);
}

.book-card:hover {
  transform: scale(1.01);
}

.book-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex: 1;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}

.book-checkbox {
  width: 18px;
  height: 18px;
  border: 2px solid var(--text-color);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.5;
}

.book-card.selected .book-checkbox {
  background: var(--accent-color);
  border-color: var(--accent-color);
  opacity: 1;
  color: white;
}

.book-title {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bulk-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.select-all-btn {
  background: none;
  border: none;
  color: var(--text-color);
  opacity: 0.7;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.5rem;
}

.select-all-btn:hover {
  opacity: 1;
  text-decoration: underline;
}

.delete-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.delete-btn:disabled {
  background: var(--border-color);
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-btn:not(:disabled):hover {
  opacity: 0.9;
}
</style>
