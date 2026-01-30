import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadEpub } from '../epubLoader';

// Mock the Tauri invoke function
const invokeMock = vi.fn();
window.__TAURI__ = {
  core: {
    invoke: invokeMock,
  },
} as any;

describe('epubLoader', () => {
  beforeEach(() => {
    invokeMock.mockClear();
  });

  it('should load local file using read_file_binary', async () => {
    const filePath = '/path/to/book.epub';
    const mockData = new Uint8Array([1, 2, 3]);
    invokeMock.mockResolvedValue(mockData);

    const result = await loadEpub(filePath);

    expect(invokeMock).toHaveBeenCalledWith('read_file_binary', { path: filePath });
    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(new Uint8Array(result as ArrayBuffer)).toEqual(mockData);
  });

  it('should return URL as is for remote paths', async () => {
    const url = 'https://example.com/book.epub';
    const result = await loadEpub(url);
    expect(result).toBe(url);
    expect(invokeMock).not.toHaveBeenCalledWith('read_file_binary', expect.anything());
  });

  it('should return URL as is for http paths', async () => {
      const url = 'http://example.com/book.epub';
      const result = await loadEpub(url);
      expect(result).toBe(url);
      expect(invokeMock).not.toHaveBeenCalledWith('read_file_binary', expect.anything());
  });
});
