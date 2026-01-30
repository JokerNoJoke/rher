<template>
  <div class="epub-reader" ref="scrollContainer" @scroll="handleScroll">
    <div id="epub-area" ref="container"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, onUnmounted } from 'vue'
import ePub from 'epubjs'
import { loadEpub } from '@/utils/epubLoader'

const props = defineProps({
  path: String,
  initialCfi: String,
  fontSize: Number
})

const emit = defineEmits(['update:location', 'toc-loaded', 'ready', 'scroll', 'load-more'])

const container = ref<HTMLElement | null>(null)
const scrollContainer = ref<HTMLElement | null>(null)
let book: any = null
const renditionMap = new Map<number, any>()
const chapters = ref<any[]>([])
const currentChapterIndex = ref(0)
const lastLoadedIndex = ref(0)
const isLoading = ref(false)
const isPrepending = ref(false)
let observer: IntersectionObserver | null = null

const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement
    const { scrollTop, scrollHeight, clientHeight } = target
    
    emit('scroll', {
        scrollTop,
        scrollHeight,
        clientHeight
    })
    
    if (!isLoading.value && scrollHeight - scrollTop - clientHeight < 500) {
        emit('load-more')
        loadNextChapter()
    }
    
    if (!isLoading.value && !isPrepending.value && scrollTop < 500) {
        loadPrevChapter()
    }
}

const setupIntersectionObserver = () => {
    if (observer) observer.disconnect()
    
    observer = new IntersectionObserver((entries) => {
        const visibleEntries = entries.filter(e => e.isIntersecting)
        if (visibleEntries.length === 0) return
        
        visibleEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        
        const viewportHeight = scrollContainer.value?.clientHeight || window.innerHeight
        const activeEntry = visibleEntries.find(e => 
            e.boundingClientRect.top <= viewportHeight * 0.5 && 
            e.boundingClientRect.bottom >= viewportHeight * 0.5
        ) || visibleEntries[0] 
            
        if (activeEntry) {
            const indexStr = (activeEntry.target as HTMLElement).dataset.index
            if (indexStr) {
                const index = parseInt(indexStr)
                if (!isNaN(index) && index !== currentChapterIndex.value) {
                    currentChapterIndex.value = index
                    console.log('Active chapter changed to:', index, chapters.value[index]?.title)
                    
                    if (chapters.value[index]) {
                         const r = renditionMap.get(index)
                         if (r) {
                             try {
                                 const loc = r.currentLocation()
                                 if (loc && loc.start) {
                                     emit('update:location', loc.start.cfi)
                                     return
                                 }
                             } catch (e) { /* ignore */ }
                         }
                         emit('update:location', chapters.value[index].href)
                    }
                }
            }
        }
    }, {
        root: scrollContainer.value,
        threshold: [0, 0.1, 0.5]
    })
}

const cleanupExtraRenditions = () => {
    if (container.value) {
        const children = Array.from(container.value.children)
        for (let i = 1; i < children.length; i++) {
            container.value.removeChild(children[i])
        }
    }
    renditionMap.clear()
}

const syncCurrentChapterIndex = () => {
    for (const [index, r] of renditionMap.entries()) {
        try {
            const location = r.currentLocation()
            if (location && location.start && location.start.href) {
                const currentHref = location.start.href
                const chapterIndex = chapters.value.findIndex(c => {
                    const cHref = c.href.split('#')[0]
                    const lHref = currentHref.split('#')[0]
                    return lHref.endsWith(cHref) || cHref.endsWith(lHref)
                })
                
                if (chapterIndex !== -1) {
                    currentChapterIndex.value = chapterIndex
                    if (renditionMap.size === 1) {
                        lastLoadedIndex.value = chapterIndex
                    }
                    console.log('Synced current chapter index to:', chapterIndex, chapters.value[chapterIndex].title)
                    return
                }
            }
        } catch (e) { /* ignore */ }
    }
}

const loadPrevChapter = async () => {
    const loadedIndices = Array.from(renditionMap.keys()).sort((a, b) => a - b)
    const firstLoadedIndex = loadedIndices[0]
    
    if (isLoading.value || firstLoadedIndex === undefined || firstLoadedIndex <= 0) return

    isPrepending.value = true
    const prevIndex = firstLoadedIndex - 1
    const prevChapter = chapters.value[prevIndex]
    
    console.log('Prepending previous chapter:', prevChapter.title)

    const chapterContainer = document.createElement('div')
    chapterContainer.className = 'chapter-container'
    chapterContainer.dataset.index = prevIndex.toString()
    chapterContainer.style.minHeight = '100px'
    
    const header = document.createElement('h2')
    header.className = 'chapter-header'
    header.textContent = prevChapter.title
    header.style.padding = '20px'
    header.style.textAlign = 'center'
    header.style.borderBottom = '1px solid #ccc'
    chapterContainer.appendChild(header)
    
    if (container.value && container.value.firstChild) {
        container.value.insertBefore(chapterContainer, container.value.firstChild)
    } else {
        container.value?.appendChild(chapterContainer)
    }
    
    if (observer) observer.observe(chapterContainer)

    const rendition = book.renderTo(chapterContainer, {
        width: '100%',
        flow: 'scrolled',
        allowScriptedContent: true,
    })
    
    const oldScrollHeight = scrollContainer.value?.scrollHeight || 0
    const oldScrollTop = scrollContainer.value?.scrollTop || 0

    try {
        await rendition.display(prevChapter.href)
        renditionMap.set(prevIndex, rendition)
        
        if (scrollContainer.value) {
            const newScrollHeight = scrollContainer.value.scrollHeight
            const diff = newScrollHeight - oldScrollHeight
            scrollContainer.value.scrollTop = oldScrollTop + diff
        }

        rendition.on('relocated', (location: any) => {
            if (currentChapterIndex.value === prevIndex) {
                 emit('update:location', location.start.cfi)
            }
        })
    } catch (e) {
        console.error('Failed to load prev chapter', e)
    } finally {
        isPrepending.value = false
    }
}

const loadNextChapter = async () => {
    if (isLoading.value || !book || !container.value) return
    if (lastLoadedIndex.value >= chapters.value.length - 1) return

    isLoading.value = true
    const nextIndex = lastLoadedIndex.value + 1
    const nextChapter = chapters.value[nextIndex]
    
    console.log('Loading next chapter:', nextChapter.title)

    const chapterContainer = document.createElement('div')
    chapterContainer.className = 'chapter-container'
    chapterContainer.dataset.index = nextIndex.toString()
    chapterContainer.style.minHeight = '100px'
    
    const header = document.createElement('h2')
    header.className = 'chapter-header'
    header.textContent = nextChapter.title
    header.style.padding = '20px'
    header.style.textAlign = 'center'
    header.style.borderBottom = '1px solid #ccc'
    chapterContainer.appendChild(header)
    
    container.value.appendChild(chapterContainer)
    
    if (observer) observer.observe(chapterContainer)

    const rendition = book.renderTo(chapterContainer, {
        width: '100%',
        flow: 'scrolled',
        allowScriptedContent: true,
    })
    
    try {
        await rendition.display(nextChapter.href)
        renditionMap.set(nextIndex, rendition)
        lastLoadedIndex.value = nextIndex
        
        rendition.on('relocated', (location: any) => {
            if (currentChapterIndex.value === nextIndex) {
                 emit('update:location', location.start.cfi)
            }
        })
    } catch (e) {
        console.error('Failed to load next chapter', e)
    } finally {
        isLoading.value = false
    }
}

onMounted(async () => {
    if (!props.path) return
    
    setupIntersectionObserver()
    
    const bookData = await loadEpub(props.path)
    book = ePub(bookData)
    
    book.ready.then(() => {
        console.log('Book ready. Metadata:', book.package.metadata)
    })

    const initialDiv = document.createElement('div')
    initialDiv.className = 'chapter-container'
    initialDiv.dataset.index = '0' 
    if (container.value) container.value.appendChild(initialDiv)
    
    if (observer) observer.observe(initialDiv)
    
    const mainRendition = book.renderTo(initialDiv, {
        width: '100%',
        flow: 'scrolled',
        allowScriptedContent: true,
    })
    
    renditionMap.set(0, mainRendition)
    
    await mainRendition.display(props.initialCfi)
    
    mainRendition.on('relocated', (location: any) => {
        emit('update:location', location.start.cfi)
    })
    
    book.loaded.navigation.then((nav: any) => {
        let foundFirstChapter = false
        const parsedChapters = nav.toc.map((item: any, index: number) => {
            let title = (item.label || '').trim()
            if (title.length > 60) {
                if (title.match(/(作者：|来源：|书名：|简介：)/)) {
                    title = '前言'
                } else {
                    const chapterMatch = title.match(/(第\s*[一二三四五六七八九十百千万\d]+\s*[章节回部卷]\s*[^\s\n\r\t]*)/)
                    const bookTitleMatch = title.match(/《[^》]+》/)
                    if (chapterMatch) {
                        title = chapterMatch[0]
                        foundFirstChapter = true
                    } else if (bookTitleMatch) {
                        title = bookTitleMatch[0]
                    } else {
                        if (!foundFirstChapter && index === 0) {
                            title = '前言'
                        } else {
                            title = title.split(/[\n\r]/)[0].substring(0, 50).trim() + '...'
                        }
                    }
                }
            } else if (!foundFirstChapter) {
                if (title.match(/(第\s*[一二三四五六七八九十百千万\d]+\s*[章节回部卷])/)) {
                    foundFirstChapter = true
                }
            }
            return { title: title || 'Untitled', href: item.href, id: item.id }
        })
        chapters.value = parsedChapters
        emit('toc-loaded', parsedChapters)
        
        syncCurrentChapterIndex()
        
        const currentIndex = currentChapterIndex.value
        if (initialDiv) {
            initialDiv.dataset.index = currentIndex.toString()
            if (currentIndex !== 0) {
                renditionMap.set(currentIndex, mainRendition)
                renditionMap.delete(0)
            }
            
            const currentChapter = parsedChapters[currentIndex]
            if (currentChapter) {
                 const header = document.createElement('h2')
                 header.className = 'chapter-header'
                 header.textContent = currentChapter.title
                 header.style.padding = '20px'
                 header.style.textAlign = 'center'
                 header.style.borderBottom = '1px solid #ccc'
                 initialDiv.prepend(header)
            }
        }
    })
    
    emit('ready')
})

watch(() => props.fontSize, (val) => {
    if (renditionMap.size && val) {
        renditionMap.forEach(r => r.themes.fontSize(`${val}px`))
    }
})

defineExpose({
    jumpTo: async (cfi: string) => {
        cleanupExtraRenditions()
        const initialDiv = container.value?.firstElementChild as HTMLElement
        if (initialDiv) {
            initialDiv.innerHTML = ''
            const mainRendition = book.renderTo(initialDiv, {
                width: '100%',
                flow: 'scrolled',
                allowScriptedContent: true,
            })
            await mainRendition.display(cfi)
            renditionMap.set(0, mainRendition) 
            syncCurrentChapterIndex()
            const newIndex = currentChapterIndex.value
            initialDiv.dataset.index = newIndex.toString()
            renditionMap.set(newIndex, mainRendition)
            if (newIndex !== 0) renditionMap.delete(0)
            
            const currentChapter = chapters.value[newIndex]
            if (currentChapter) {
                 const header = document.createElement('h2')
                 header.className = 'chapter-header'
                 header.textContent = currentChapter.title
                 header.style.padding = '20px'
                 header.style.textAlign = 'center'
                 header.style.borderBottom = '1px solid #ccc'
                 initialDiv.prepend(header)
            }
            if (observer) observer.observe(initialDiv)
            mainRendition.on('relocated', (location: any) => {
                emit('update:location', location.start.cfi)
            })
        }
    },
    next: () => {
        const r = renditionMap.get(currentChapterIndex.value)
        r?.next()
    },
    prev: () => {
        const r = renditionMap.get(currentChapterIndex.value)
        r?.prev()
    },
    scrollContainer,
    loadNextChapter
})

onUnmounted(() => {
    if (book) book.destroy()
    if (observer) observer.disconnect()
})
</script>

<style scoped>
.epub-reader {
    height: 100%;
    width: 100%;
    overflow-y: auto;
    overflow-x: hidden;
}
</style>