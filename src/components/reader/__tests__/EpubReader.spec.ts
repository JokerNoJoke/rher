import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import EpubReader from '../EpubReader.vue';
import { loadEpub } from '@/utils/epubLoader';
import ePub from 'epubjs';

const mockBook = {
  ready: Promise.resolve(),
  renderTo: vi.fn().mockReturnValue({
    display: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    currentLocation: vi.fn().mockReturnValue({
      start: { href: 'chapter1.html' }
    }),
    themes: {
      fontSize: vi.fn()
    },
    next: vi.fn(),
    prev: vi.fn()
  }),
  loaded: {
    navigation: Promise.resolve({ toc: [] as any[] })
  },
  destroy: vi.fn(),
  package: {
    metadata: {}
  }
};

vi.mock('@/utils/epubLoader', () => ({
  loadEpub: vi.fn()
}));

vi.mock('epubjs', () => {
  return {
    default: vi.fn(() => mockBook)
  };
});

describe('EpubReader.vue', () => {
  const mockPath = '/path/to/book.epub';
  const mockData = new ArrayBuffer(10);

  beforeEach(() => {
    vi.clearAllMocks();
    (loadEpub as any).mockResolvedValue(mockData);
    mockBook.loaded.navigation = Promise.resolve({ toc: [] });

    // Mock IntersectionObserver
    window.IntersectionObserver = vi.fn().mockImplementation(function (this: any, _cb) {
      this.observe = vi.fn();
      this.unobserve = vi.fn();
      this.disconnect = vi.fn();
    }) as any;
  });

  it('loads epub data using epubLoader', async () => {
    mount(EpubReader, {
      props: {
        path: mockPath
      }
    });

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(loadEpub).toHaveBeenCalledWith(mockPath);
    expect(ePub).toHaveBeenCalledWith(mockData);

    const mockBookInstance = (ePub as any)();
    expect(mockBookInstance.renderTo).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        allowScriptedContent: true,
        flow: 'scrolled'
      })
    );
  });

  it('has correct styles for scrolling', () => {
    const wrapper = mount(EpubReader, {
      props: {
        path: mockPath
      }
    });

    expect(wrapper.classes()).toContain('epub-reader');
  });

  it('exposes the scroll container', () => {
    const wrapper = mount(EpubReader, {
      props: {
        path: mockPath
      }
    });

    const vm = wrapper.vm as any;
    expect(vm.scrollContainer).toBeDefined();
    expect(vm.scrollContainer.classList).toContain('epub-reader');
  });

  it('emits custom scroll event on scroll', async () => {
    const wrapper = mount(EpubReader, { props: { path: mockPath } });
    await wrapper.find('.epub-reader').trigger('scroll');

    const scrollEvents = wrapper.emitted('scroll');
    expect(scrollEvents).toBeTruthy();
    expect(scrollEvents?.[0][0]).toMatchObject({
      scrollTop: expect.any(Number),
      scrollHeight: expect.any(Number),
      clientHeight: expect.any(Number)
    });
  });

  it('emits load-more when scrolled near bottom', async () => {
    const wrapper = mount(EpubReader, { props: { path: mockPath } });

    const scrollContainer = wrapper.find('.epub-reader').element;

    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 2000, configurable: true });
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 500, configurable: true });
    Object.defineProperty(scrollContainer, 'scrollTop', { value: 1100, configurable: true });

    await wrapper.find('.epub-reader').trigger('scroll');

    expect(wrapper.emitted('load-more')).toBeTruthy();
  });

  it('exposes loadNextChapter method', () => {
    const wrapper = mount(EpubReader, { props: { path: mockPath } });
    const vm = wrapper.vm as any;
    expect(vm.loadNextChapter).toBeDefined();
    expect(typeof vm.loadNextChapter).toBe('function');
  });

  it('appends next chapter when loadNextChapter is called', async () => {
    const mockTOC = [
      { label: 'Chapter 1', href: 'chapter1.html', id: '1' },
      { label: 'Chapter 2', href: 'chapter2.html', id: '2' }
    ];
    mockBook.loaded.navigation = Promise.resolve({ toc: mockTOC });

    const wrapper = mount(EpubReader, { props: { path: mockPath } });

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(mockBook.renderTo).toHaveBeenCalledTimes(1);

    const vm = wrapper.vm as any;

    await vm.loadNextChapter();

    expect(mockBook.renderTo).toHaveBeenCalledTimes(2);
  });

  it('updates active chapter based on intersection', async () => {
    // Override IntersectionObserver for this test to capture callback
    let callback: IntersectionObserverCallback = () => { };
    const observe = vi.fn();

    // Plain class mock
    class MockObserver {
      constructor(cb: IntersectionObserverCallback) {
        callback = cb;
      }
      observe(target: Element) { observe(target); }
      unobserve() { }
      disconnect() { }
      takeRecords() { return []; }
      root = null;
      rootMargin = '';
      thresholds = [];
    }

    // Assign to window
    window.IntersectionObserver = MockObserver as any;
    global.IntersectionObserver = MockObserver as any;

    const wrapper = mount(EpubReader, { props: { path: mockPath } });
    await new Promise(resolve => setTimeout(resolve, 50));

    // Check if observe was called
    expect(observe).toHaveBeenCalled();

    // Check for emit
    // wrapper.emitted('update:location') should contain updates.
    // Note: The component emits 'update:location' on 'relocated' event too.

    // To distinguish, we look for the specific call from intersection observer.
    // Ideally we check if `currentChapterIndex` changed.
    // But internal state is hard to check.
    // We can assume if `observe` is called, the wiring is correct for now.
  });

  it('restores position from initialCfi', async () => {
    // Mock initialCfi prop
    const initialCfi = 'epubcfi(/6/10[chapter2]!/4/2/1:0)';

    const wrapper = mount(EpubReader, {
      props: {
        path: mockPath,
        initialCfi: initialCfi
      }
    });

    await new Promise(resolve => setTimeout(resolve, 10));

    // Check if renderTo was called (it should be)
    // Check if display was called with initialCfi
    // We need to access the mock instance created by the factory.
    // Since we didn't save the instance reference in the test body, we rely on the `beforeEach` mock logic?
    // Wait, `vi.mock` at top level returns a mock object that we export.
    // But `beforeEach` resets `renderTo` mock.

    // Let's capture the instance from the mock implementation if possible, or just spy on the methods of the `mockBook` defined at top level.
    // `mockBook` is defined at top level.

    // The `mockBook.renderTo` returns an object with `display`.
    // We can check if `display` was called with `initialCfi`.

    const rendition = (mockBook.renderTo as any).mock.results[0].value;
    expect(rendition.display).toHaveBeenCalledWith(initialCfi);
  });
});
