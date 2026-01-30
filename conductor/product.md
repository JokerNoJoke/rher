# Initial Concept
A modern, aesthetic reader supporting .txt and .epub formats using Tauri + Vue 3.

# Product Definition

## Target Audience
- Casual readers looking for a minimalist and aesthetic experience.

## Goals
- Provide a high-performance reading experience for large files (like long web novels), ensuring smooth performance even with massive documents.

## Key Features
- Intelligent chapter parsing and automatic Table of Contents generation for TXT files to provide structure to unstructured documents.
- Smooth, virtualized scrolling to allow for seamless navigation of extremely large files without performance degradation.
- **EPUB Continuous Reading:** Seamless infinite scroll for EPUB files, automatically loading next/previous chapters as the user scrolls, with chapter headers and robust progress tracking.
- **Progress Persistence:** Automatically saves and restores reading positions for all supported formats, ensuring a seamless multi-session experience.
- **Manage Recent Reads:** Allows users to easily manage their reading history with multi-select deletion and "Select All" functionality on the home screen.
- **Hearer (TTS):** Integrated text-to-speech support with configurable HTTP-based engines (e.g., GPT-SoVITS) for an eyes-free reading experience.
