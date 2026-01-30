import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import Home from '../Home.vue'
import { useReadingStore } from '@/stores/readingStore'

// Mocks
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn()
}))

describe('Home.vue Manage Mode', () => {
  let wrapper: any
  let store: any

  beforeEach(() => {
    wrapper = mount(Home, {
      global: {
        plugins: [createTestingPinia({
          initialState: {
            reading: {
              history: [
                { path: '/book1.epub', title: 'Book 1', progress: 0.1, timestamp: 100 },
                { path: '/book2.epub', title: 'Book 2', progress: 0.2, timestamp: 200 }
              ]
            }
          },
          stubActions: false
        })],
        stubs: {
          BookOpenIcon: { template: '<span></span>' },
          CheckIcon: { template: '<span></span>' },
          TrashIcon: { template: '<span></span>' }
        }
      }
    })
    store = useReadingStore()
  })

  it('shows Manage button when history exists', () => {
    const manageBtn = wrapper.find('.manage-btn')
    expect(manageBtn.exists()).toBe(true)
    expect(manageBtn.text()).toContain('Manage')
  })

  it('toggles manage mode when Manage button is clicked', async () => {
    const manageBtn = wrapper.find('.manage-btn')
    await manageBtn.trigger('click')
    
    expect(wrapper.vm.isManageMode).toBe(true)
    expect(manageBtn.text()).toContain('Done')
  })

  it('shows checkboxes when in manage mode', async () => {
    // Enter manage mode
    await wrapper.find('.manage-btn').trigger('click')
    
    const checkboxes = wrapper.findAll('.book-checkbox')
    expect(checkboxes.length).toBe(2)
  })

  it('selects all items when Select All is clicked', async () => {
    await wrapper.find('.manage-btn').trigger('click')
    const selectAllBtn = wrapper.find('.select-all-btn')
    await selectAllBtn.trigger('click')
    
    expect(wrapper.vm.selectedPaths.size).toBe(2)
    expect(wrapper.findAll('.book-card.selected').length).toBe(2)

    // Clicking again should deselect all
    await selectAllBtn.trigger('click')
    expect(wrapper.vm.selectedPaths.size).toBe(0)
  })

  it('deletes selected items and exits manage mode', async () => {
    await wrapper.find('.manage-btn').trigger('click')
    
    // Select first book in the list (which should be Book 2 due to timestamp 200)
    await wrapper.findAll('.book-card')[0].trigger('click')
    
    const deleteBtn = wrapper.find('.delete-btn')
    await deleteBtn.trigger('click')
    
    expect(store.removeItemsFromHistory).toHaveBeenCalledWith(['/book2.epub'])
    expect(wrapper.vm.isManageMode).toBe(false)
  })

  it('does not navigate to reader when clicking a card in manage mode', async () => {
    const router = (await import('vue-router')).useRouter()
    
    await wrapper.find('.manage-btn').trigger('click')
    await wrapper.findAll('.book-card')[0].trigger('click')
    
    expect(router.push).not.toHaveBeenCalled()
  })

  it('hides Manage button when history is empty', async () => {
    // Re-mount with empty history
    const wrapperEmpty = mount(Home, {
      global: {
        plugins: [createTestingPinia({
          initialState: {
            reading: { history: [] }
          }
        })],
        stubs: {
          BookOpenIcon: true
        }
      }
    })
    
    expect(wrapperEmpty.find('.manage-btn').exists()).toBe(false)
  })

  it('resets selection state when exiting manage mode', async () => {
    await wrapper.find('.manage-btn').trigger('click') // Enter
    await wrapper.findAll('.book-card')[0].trigger('click') // Select one
    expect(wrapper.vm.selectedPaths.size).toBe(1)
    
    await wrapper.find('.manage-btn').trigger('click') // Exit (Done)
    expect(wrapper.vm.selectedPaths.size).toBe(0)
  })
})
