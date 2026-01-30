# Tech Stack

## Frontend
- **Framework:** Vue 3 (Composition API with `<script setup>`)
- **Language:** TypeScript
- **Build Tool:** Vite
- **State Management:** Pinia
- **Routing:** Vue Router
- **Icons:** Lucide Vue Next
- **Audio:** Web Audio API (via HTML5 Audio)
- **Styling:** CSS3 with CSS Variables for theming
- **Utilities:** @vueuse/core
- **Specialized Libraries:**
    - `epubjs`: For parsing and rendering EPUB files.
    - `vue-virtual-scroller`: For high-performance rendering of large text files.

## Backend / Desktop Shell
- **Framework:** Tauri v2
- **Language:** Rust
- **Plugins:**
    - `@tauri-apps/plugin-fs`: File system operations.
    - `@tauri-apps/plugin-dialog`: System file picker dialogs.
    - `@tauri-apps/plugin-opener`: Opening files and URLs.
    - `tauri-plugin-persisted-scope`: Persists filesystem scope permissions across app sessions.
- **Dependencies:**
    - `reqwest`: For performing HTTP requests from the backend (used for TTS proxy).

## Custom Tauri Commands
- `read_file_binary`: Reads file content as a binary buffer (`Vec<u8>`) to bypass frontend CORS restrictions for local assets (e.g., EPUB files).
- `proxy_fetch_audio`: Executes TTS requests from the backend to bypass browser CORS restrictions and preflight requirements. Supports configurable response MIME types.

## Styling
- **Strategy:** Custom Vanilla CSS Variables for a unique, modern aesthetic.

## Testing
- **Unit/Component Testing:** Vitest
- **Test Utilities:** Vue Test Utils

