<template>
  <div v-if="ttsStore.config.enabled" class="tts-player-bar">
    <TTSSettings v-if="showSettings" @close="showSettings = false" />

    <div class="controls">
      <button class="control-btn" @click="ttsStore.stop" title="Stop">
        <component :is="SquareIcon" />
      </button>
      
      <button class="control-btn main-action" @click="togglePlayback">
        <component :is="ttsStore.isPlaying ? PauseIcon : PlayIcon" />
      </button>

      <div class="status-info">
        <span v-if="ttsStore.isLoading" class="loading-spinner"></span>
        <span v-if="ttsStore.error" class="error-text" :title="ttsStore.error">Error: {{ ttsStore.error }}</span>
        <span v-else class="status-text">{{ statusText }}</span>
      </div>
    </div>
    
    <div class="right-actions">
      <button class="control-btn" @click="showSettings = !showSettings" title="Settings">
        <component :is="SettingsIcon" />
      </button>
      <button class="close-btn" @click="closePlayer">
        <component :is="XIcon" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Play as PlayIcon, Pause as PauseIcon, Square as SquareIcon, X as XIcon, Settings as SettingsIcon } from 'lucide-vue-next'
import { useTTSStore } from '@/stores/ttsStore'
import TTSSettings from './TTSSettings.vue'

const ttsStore = useTTSStore()
const showSettings = ref(false)

const statusText = computed(() => {
  if (ttsStore.isLoading) return 'Loading audio...'
  if (ttsStore.isPlaying) return 'Playing'
  return 'Ready'
})

function togglePlayback() {
  if (ttsStore.isPlaying) {
    ttsStore.pause()
  } else {
    ttsStore.play()
  }
}

function closePlayer() {
  ttsStore.stop()
  ttsStore.updateConfig({ enabled: false })
}
</script>

<style scoped>
.tts-player-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: var(--sidebar-bg);
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  z-index: 1000;
}

.controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.control-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-color);
  opacity: 0.8;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s;
}

.control-btn:hover {
  background: rgba(0,0,0,0.05);
  opacity: 1;
}

.main-action {
  background: var(--accent-color);
  color: white;
  opacity: 1;
  width: 40px;
  height: 40px;
}

.main-action:hover {
  background: var(--accent-color-dark, #333);
  transform: scale(1.05);
}

.status-text {
  opacity: 0.7;
}

.error-text {
  color: #ff4d4f;
  font-weight: 500;
  max-width: 200px;
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-color);
  opacity: 0.5;
  padding: 0.5rem;
}

.close-btn:hover {
  opacity: 1;
}

.loading-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(0,0,0,0.1);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
