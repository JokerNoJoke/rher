export const loadEpub = async (path: string): Promise<string | ArrayBuffer> => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Assuming we are in a Tauri environment
  if (window.__TAURI__) {
    const data = await window.__TAURI__.core.invoke<number[]>('read_file_binary', { path });
    return new Uint8Array(data).buffer;
  }

  return path;
};
