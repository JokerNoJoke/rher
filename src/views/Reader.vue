<template>
  <div class="reader-container" :data-theme="store.currentTheme">
    <TocSidebar 
      v-if="showSidebar" 
      :chapters="chapters" 
      :currentLine="currentProgress"
      @close="showSidebar = false" 
      @select="onChapterSelect"
    />
    
    <main class="reader-main">
      <div class="controls-overlay">
        <button class="icon-btn" @click="router.push('/')" title="Back to Library">
          <component :is="ArrowLeftIcon" />
        </button>
        <div class="spacer"></div>
        <button class="icon-btn" @click="toggleTheme" title="Toggle Theme">
          <component :is="SunIcon" />
        </button>
        <button class="icon-btn" @click="ttsStore.updateConfig({ enabled: true })" title="Listen (听书)">
          <component :is="HeadsetIcon" />
        </button>
        <button class="icon-btn" @click="showSidebar = !showSidebar" title="Table of Contents">
          <component :is="ListIcon" />
        </button>
      </div>

      <div class="content-wrapper" v-if="book">
        <div class="loading" v-if="loading">Loading...</div>
        
        <div v-if="errorStatus" class="error">
          <p>{{ errorStatus }}</p>
          <button v-if="isPermissionError" class="relocate-btn" @click="relocateFile">
            Relocate File
          </button>
          <button v-else class="back-btn" @click="router.push('/')">
            Go Back
          </button>
        </div>

        <keep-alive v-else>
          <TxtReader 
            v-if="fileType === 'txt' && txtContent"
            ref="txtReaderRef"
            :content="txtContent" 
            :initialLine="book.lastReadLineIndex || 0"
            :fontSize="fontSize"
            @update:progress="onTxtProgress"
          />
        
          <EpubReader 
            v-else-if="fileType === 'epub'"
            ref="epubReaderRef"
            :path="book.path"
            :initialCfi="book.lastReadCfi"
            :fontSize="fontSize"
            @update:location="onEpubLocation"
            @toc-loaded="onEpubToc"
            @ready="loading = false"
          />
        </keep-alive>
      </div>
      <div v-else class="error">No book loaded</div>

      <TTSPlayerBar />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useReadingStore } from '@/stores/readingStore'
import { ArrowLeft as ArrowLeftIcon, List as ListIcon, Sun as SunIcon, Headset as HeadsetIcon } from 'lucide-vue-next'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { open } from '@tauri-apps/plugin-dialog'
import { useDebounceFn } from '@vueuse/core'

import TocSidebar from '@/components/reader/TocSidebar.vue'
import TxtReader from '@/components/reader/TxtReader.vue'
import EpubReader from '@/components/reader/EpubReader.vue'
import TTSPlayerBar from '@/components/reader/TTSPlayerBar.vue'
import { parseChapters, type Chapter } from '@/utils/txtParser'
import { useTTSStore } from '@/stores/ttsStore'
import { useTTSPlayer } from '@/composables/useTTSPlayer'
import { splitIntoChunks } from '@/utils/textChunker'

const router = useRouter()
const store = useReadingStore()
const ttsStore = useTTSStore()

// Initialize TTS Player Logic
useTTSPlayer()

const book = computed(() => store.currentBook)
const fileType = computed(() => book.value?.path.split('.').pop()?.toLowerCase())

const showSidebar = ref(false)
const loading = ref(true)
const txtContent = ref('')
const chapters = ref<Chapter[]>([])
const currentProgress = ref(0)
const fontSize = ref(18)

const errorStatus = ref<string | null>(null)
const isPermissionError = ref(false)

const txtReaderRef = ref<any>(null)
const epubReaderRef = ref<any>(null)

const loadTxtFile = async (path: string) => {
  loading.value = true
  errorStatus.value = null
  isPermissionError.value = false
  try {
    txtContent.value = await readTextFile(path)
    
    // Parse chapters in background
    parseChapters(txtContent.value).then((res: Chapter[]) => {
      chapters.value = res
    }).catch((err: unknown) => console.error(err))
    
    loading.value = false
  } catch (e: any) {
    console.error(e)
    const errorMsg = e.message || String(e)
    if (errorMsg.includes('forbidden path') || errorMsg.includes('Access is denied')) {
      errorStatus.value = 'Permission denied. The application cannot access this file anymore.'
      isPermissionError.value = true
    } else {
      errorStatus.value = 'Failed to read file: ' + errorMsg
    }
    loading.value = false
  }
}

// TTS Queue Management
watch(() => ttsStore.config.enabled, (enabled) => {
    if (enabled && ttsStore.queue.length === 0) {
        if (fileType.value === 'txt' && txtContent.value) {
            // For TXT, chunk the whole content for now (naive approach)
            // TODO: Optimize to only chunk current chapter or window
            const chunks = splitIntoChunks(txtContent.value)
            
            // Find start index based on current line? 
            // Mapping lineIndex to chunkIndex is complex without a map. 
            // For now, start from beginning or just let user navigate.
            ttsStore.setQueue(chunks)
        } else {
             // EPUB or empty
             // Pending EPUB text extraction implementation
             ttsStore.setQueue(['EPUB TTS support is coming soon.'])
        }
    }
})

onMounted(async () => {
  if (!book.value) {
    router.push('/')
    return
  }
  
  // Apply theme body class or attribute
  document.body.setAttribute('data-theme', store.currentTheme)

  if (fileType.value === 'txt') {
    await loadTxtFile(book.value.path)
  } else if (fileType.value === 'epub') {
    // EpubReader handles loading
    // We just wait for events
  }
})

const relocateFile = async () => {
  try {
    const selected = await open({
      multiple: false,
      defaultPath: book.value?.path,
      filters: [{
        name: 'Books',
        extensions: [fileType.value || 'txt']
      }]
    })
    
    if (selected && typeof selected === 'string' && book.value) {
      // Update store history with new path if it changed
      if (selected !== book.value.path) {
          store.updateBookPath(book.value.path, selected)
      }
      // Re-load
      await loadTxtFile(selected)
    }
  } catch (err) {
    console.error('Failed to relocate file:', err)
  }
}

// TXT Handlers
const onTxtProgress = useDebounceFn((lineIndex: number) => {
    currentProgress.value = lineIndex
    if (book.value) {
        store.updateProgress(book.value.path, {
            lastReadLineIndex: lineIndex,
            progress: txtContent.value ? lineIndex / (txtContent.value.length / 30) : 0 // Rough estimate
        })
    }
}, 300)

// EPUB Handlers
const onEpubLocation = (cfi: string) => {
    if (book.value) {
        store.updateProgress(book.value.path, {
            lastReadCfi: cfi,
             // progress calc for epub is harder without knowing total pages, epubjs location obj has percentage
        })
    }
}

const onEpubToc = (toc: any[]) => {
    // Adapter for our generic Chapter interface
    // EpubJS TOC: { label, href }
    // We need to map it or adapt Sidebar
    // For now assuming Sidebar handles raw title/lineIndex logic.
    // We'll adapt here:
    chapters.value = toc.map((t) => ({
        title: t.title,
        lineIndex: 0, // Not used for epub jump usually (uses cfi or href)
        href: t.href // We need to extend our Chapter type or cast
    })) as any
}

// Shared
const onChapterSelect = (chapter: any) => { // generic type
    if (fileType.value === 'txt') {
        if (txtReaderRef.value) {
            txtReaderRef.value.scrollTo(chapter.lineIndex)
        } else {
            console.warn('txtReaderRef not found')
        }
    } else {
        epubReaderRef.value?.jumpTo(chapter.href) // or chapter.cfi if available
    }
    
    if (window.innerWidth < 640) {
        showSidebar.value = false
    }
}

const toggleTheme = () => {
    const themes = ['paper', 'dark', 'sepia']
    const current = store.currentTheme
    const next = themes[(themes.indexOf(current) + 1) % themes.length]
    store.currentTheme = next
    document.body.setAttribute('data-theme', next)
}

watch(() => store.currentTheme, (val) => {
     document.body.setAttribute('data-theme', val)
})
</script>

<style scoped>
.reader-container {
  height: 100vh;
  display: flex;
  position: relative;
  overflow: hidden;
}

.reader-main {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
}

.controls-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  z-index: 100;
  opacity: 0;
  transition: opacity 0.3s;
  background: linear-gradient(to bottom, var(--bg-color) 0%, transparent 100%);
}

.reader-main:hover .controls-overlay {
  opacity: 1;
}

.content-wrapper {
  flex: 1;
  height: 100%;
  position: relative;
}

.icon-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  color: var(--text-color);
  opacity: 0.6;
  transition: opacity 0.2s;
}
.icon-btn:hover {
  opacity: 1;
}

.spacer {
  flex: 1;
}

.loading, .error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.25rem;
  color: var(--text-color);
  text-align: center;
  max-width: 80%;
}

.error p {
  margin-bottom: 1.5rem;
  opacity: 0.8;
}

.relocate-btn, .back-btn {
  padding: 0.75rem 1.5rem;
  background: var(--text-color);
  color: var(--bg-color);
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
}

.relocate-btn:hover, .back-btn:hover {
  opacity: 0.9;
}
</style>
