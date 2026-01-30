import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Reader from '../Reader.vue'
import { useReadingStore } from '@/stores/readingStore'

// Mocks
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

vi.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: vi.fn().mockResolvedValue('Chapter 1\nContent...')
}))

vi.mock('@/utils/txtParser', () => ({
  parseChapters: vi.fn().mockResolvedValue([
    { title: 'Chapter 1', lineIndex: 0 },
    { title: 'Chapter 2', lineIndex: 10 }
  ])
}))

describe('Reader.vue Responsive Sidebar', () => {
  let wrapper: any

  beforeEach(() => {
    setActivePinia(createPinia())
    const store = useReadingStore()
    store.currentBook = { path: '/test.txt', title: 'Test Book', progress: 0, timestamp: Date.now() }
  })

  const mountReader = (width: number) => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width })
    
    wrapper = mount(Reader, {
      global: {
        stubs: {
            TxtReader: {
                template: '<div></div>',
                methods: {
                    scrollTo: () => {}
                }
            },
            EpubReader: true,
            TocSidebar: {
                name: 'TocSidebar',
                template: '<div class="toc-sidebar-stub"></div>',
                props: ['chapters', 'currentLine'],
                emits: ['close', 'select']
            },
            // Icon mocks (lucide-vue-next components)
            ArrowLeftIcon: true,
            ListIcon: true,
            SunIcon: true,
            HeadsetIcon: true
        }
      }
    })
  }

  it('closes sidebar on mobile (< 640px) when chapter is selected', async () => {
    mountReader(400) // Mobile width
    
    // Open sidebar first
    const btns = wrapper.findAll('.icon-btn')
    if (btns.length < 3) {
        console.log(wrapper.html())
    }
    const sidebarBtn = btns[3] 
    await sidebarBtn.trigger('click')
    expect(wrapper.vm.showSidebar).toBe(true)

    // Simulate chapter selection
    const sidebar = wrapper.findComponent({ name: 'TocSidebar' })
    sidebar.vm.$emit('select', { title: 'Chapter 1', lineIndex: 0 })

    expect(wrapper.vm.showSidebar).toBe(false)
  })

  it('keeps sidebar open on desktop (>= 640px) when chapter is selected', async () => {
    mountReader(800) // Desktop width
    
    // Open sidebar first
    const sidebarBtn = wrapper.findAll('.icon-btn')[3] 
    await sidebarBtn.trigger('click')
    expect(wrapper.vm.showSidebar).toBe(true)

    // Simulate chapter selection
    const sidebar = wrapper.findComponent({ name: 'TocSidebar' })
    sidebar.vm.$emit('select', { title: 'Chapter 1', lineIndex: 0 })

    // FAIL ASSERTION: Current code always sets it to false, so this should fail
    expect(wrapper.vm.showSidebar).toBe(true)
  })
})