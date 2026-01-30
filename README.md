# rher

A modern, aesthetic reader supporting .txt and .epub formats, built with Tauri v2 and Vue 3.

**rher** stands for **R**eader & **H**earer.

## Features

- **Minimalist & Aesthetic**: Designed for a distraction-free reading experience using custom Vanilla CSS and modern design principles.
- **High Performance**:
    - **Optimized for Large Files**: Smooth virtualized scrolling ensures seamless navigation even for massive documents and long web novels.
- **Format Support**:
    - **TXT**: Intelligent chapter parsing and automatic Table of Contents generation.
    - **EPUB**: Continuous infinite scroll with automatic chapter loading and robust progress tracking.
- **Smart Progress Persistence**: Automatically saves and restores your reading spot for all supported formats.
- **Library Management**: Easy management of recent reads with multi-select deletion.

## Tech Stack

- **Core**: [Tauri v2](https://v2.tauri.app/) + [Rust](https://www.rust-lang.org/)
- **Frontend**: [Vue 3](https://vuejs.org/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Core Libraries**:
    - `epubjs` for EPUB rendering
    - `vue-virtual-scroller` for performance
    - `@tauri-apps/plugin-fs` for filesystem access

## Getting Started

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Node.js](https://nodejs.org/) & [pnpm](https://pnpm.io/)

### Installation

```bash
pnpm install
```

### Development

Run the app in development mode with hot reload:

```bash
pnpm tauri dev
```

### Build

Build the application for production:

```bash
pnpm tauri build
```
