<template>
  <aside class="toc-sidebar">
    <div class="toc-header">
      <h2>Table of Contents</h2>
      <button class="close-btn" @click="$emit('close')">
        <component :is="XIcon" />
      </button>
    </div>
    <div class="toc-list">
      <div 
        v-for="(chapter, index) in chapters" 
        :key="index"
        class="toc-item"
        :class="{ active: currentLine >= chapter.lineIndex && (chapters[index+1] ? currentLine < chapters[index+1].lineIndex : true) }"
        @click="$emit('select', chapter)"
      >
        {{ chapter.title }}
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { X as XIcon } from 'lucide-vue-next'
import type { Chapter } from '@/utils/txtParser'

defineProps<{
  chapters: Chapter[]
  currentLine: number // For TXT, line index. For EPUB, maybe handled differently (cfi logic needed in future)
}>()

defineEmits(['close', 'select'])
</script>

<style scoped>
.toc-sidebar {
  width: 300px;
  height: 100%;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 5px rgba(0,0,0,0.05);
}

.toc-header {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.toc-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.toc-item {
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  border-radius: 4px;
  font-size: 0.9rem;
  color: var(--text-color);
  opacity: 0.8;
}

.toc-item:hover {
  background: rgba(0,0,0,0.05);
  opacity: 1;
}

.toc-item.active {
  background: rgba(0,0,0,0.1);
  font-weight: 600;
  color: var(--accent-color);
  opacity: 1;
}
</style>
