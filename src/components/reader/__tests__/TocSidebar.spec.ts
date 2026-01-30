import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import TocSidebar from '../TocSidebar.vue'

describe('TocSidebar.vue', () => {
  const chapters = [
    { title: 'Chapter 1', lineIndex: 0 },
    { title: 'Chapter 2', lineIndex: 100 },
    { title: 'Chapter 3', lineIndex: 200 },
  ]

  it('highlights the active chapter based on currentLine', () => {
    const wrapper = mount(TocSidebar, {
      props: {
        chapters,
        currentLine: 150
      }
    })

    const items = wrapper.findAll('.toc-item')
    expect(items[0].classes()).not.toContain('active')
    expect(items[1].classes()).toContain('active')
    expect(items[2].classes()).not.toContain('active')
  })

  it('emits select event when a chapter is clicked', async () => {
    const wrapper = mount(TocSidebar, {
      props: {
        chapters,
        currentLine: 0
      }
    })

    await wrapper.findAll('.toc-item')[2].trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')?.[0]).toEqual([chapters[2]])
  })
})
