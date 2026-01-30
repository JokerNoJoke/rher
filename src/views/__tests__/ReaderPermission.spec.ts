import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Reader from '../Reader.vue'
import { useRouter } from 'vue-router'
import { readTextFile } from '@tauri-apps/plugin-fs'

import { useReadingStore } from '@/stores/readingStore'

// Mocks
vi.mock('vue-router', () => ({
  useRouter: vi.fn()
}))

vi.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: vi.fn()
}))

vi.mock('@/utils/txtParser', () => ({
  parseChapters: vi.fn().mockResolvedValue([])
}))

describe('Reader.vue Permission Handling', () => {
  let mockRouter: any
  let mockStore: any

  beforeEach(() => {
    setActivePinia(createPinia())
    
    mockRouter = {
      push: vi.fn()
    }
    ;(useRouter as any).mockReturnValue(mockRouter)

    const store = useReadingStore()
    store.currentBook = { path: '/forbidden/path.txt', title: 'Forbidden Book', progress: 0, timestamp: Date.now() }
    
    // Mock window.alert
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  it('shows an alert and redirects when file reading fails (forbidden path)', async () => {
    // Mock readTextFile to reject with a permission error
    ;(readTextFile as any).mockRejectedValue(new Error('forbidden path: /forbidden/path.txt maybe it is not allowed on the scope'))

    const wrapper = mount(Reader, {
      global: {
        stubs: {
            TxtReader: true,
            EpubReader: true,
            TocSidebar: true,
            ArrowLeftIcon: true,
            ListIcon: true,
            SunIcon: true,
            HeadsetIcon: true
        }
      }
    })

    // Wait for onMounted to complete
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.find('.error').exists()).toBe(true)
    expect(wrapper.find('.error').text()).toContain('Permission denied')
    expect(wrapper.find('button.relocate-btn').exists()).toBe(true)
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('shows content when file loading is successful', async () => {
    ;(readTextFile as any).mockResolvedValue('Book content')

    const wrapper = mount(Reader, {
      global: {
        stubs: {
            TxtReader: { template: '<div class="txt-reader"></div>' },
            EpubReader: true,
            TocSidebar: true,
            ArrowLeftIcon: true,
            ListIcon: true,
            SunIcon: true
        }
      }
    })

    // Wait for onMounted to complete
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.find('.error').exists()).toBe(false)
    expect(wrapper.find('.txt-reader').exists()).toBe(true)
  })
})
