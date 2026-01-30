<template>
  <div class="tts-settings">
    <div class="settings-header">
      <h3>TTS Settings</h3>
      <button class="close-btn" @click="$emit('close')">
        <component :is="XIcon" />
      </button>
    </div>

    <div class="settings-content">
      <div class="form-group">
        <label>Engine URL</label>
        <input 
          type="text" 
          v-model="url" 
          placeholder="http://127.0.0.1:9880/"
        />
      </div>

      <div class="form-group">
        <label>Audio Format (MIME Type)</label>
        <input 
          type="text" 
          v-model="responseType" 
          placeholder="audio/mpeg"
          list="mime-types"
        />
        <datalist id="mime-types">
          <option value="audio/mpeg">audio/mpeg (MP3)</option>
          <option value="audio/aac">audio/aac (AAC)</option>
          <option value="audio/wav">audio/wav (WAV)</option>
          <option value="audio/ogg">audio/ogg (OGG)</option>
        </datalist>
      </div>

      <div class="form-group">
        <label>Request Method</label>
        <select v-model="method">
          <option value="GET">GET</option>
          <option value="POST">POST</option>
        </select>
      </div>

      <div class="form-group" v-if="method === 'GET'">
        <label>Query Parameters (JSON)</label>
        <textarea 
          v-model="paramsJson" 
          placeholder='{"text": "{{text}}", "lang": "zh"}'
          @blur="save"
        ></textarea>
      </div>

      <div class="form-group" v-if="method === 'POST'">
        <label>Body Template</label>
        <textarea 
          v-model="bodyTemplate" 
          placeholder='{"text": "{{text}}", "speaker": "1"}'
        ></textarea>
      </div>
      
      <p class="hint">Use <code>{{"\{\{text\}\}"}}</code> as placeholder for the text to be spoken.</p>
      
      <div class="settings-actions">
        <button 
          class="reset-btn" 
          :class="{ 'resetting': isResetting }"
          @click="resetToDefaults"
          :disabled="isResetting"
        >
          <component :is="RotateCcwIcon" />
          {{ isResetting ? 'Restored!' : 'Reset to Defaults' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { X as XIcon, RotateCcw as RotateCcwIcon } from 'lucide-vue-next'
import { useTTSStore } from '@/stores/ttsStore'

defineEmits(['close'])

const ttsStore = useTTSStore()
const isResetting = ref(false)

// Get initial values from store
const getActiveProfile = () => ttsStore.config.profiles.find(p => p.id === ttsStore.config.activeProfileId) || ttsStore.config.profiles[0]
const profile = ref(getActiveProfile())

const url = ref(profile.value.url)
const method = ref(profile.value.method)
const responseType = ref(profile.value.responseType || '')
const bodyTemplate = ref(profile.value.bodyTemplate || '')
const paramsJson = ref(JSON.stringify(profile.value.params || {}, null, 2))

function save() {
    try {
        const params = paramsJson.value ? JSON.parse(paramsJson.value) : {}
        ttsStore.updateConfig({
            profiles: ttsStore.config.profiles.map(p => {
                if (p.id === ttsStore.config.activeProfileId) {
                    return {
                        ...p,
                        url: url.value,
                        method: method.value as 'GET' | 'POST',
                        responseType: responseType.value,
                        bodyTemplate: bodyTemplate.value,
                        params
                    }
                }
                return p
            })
        })
    } catch (e) {
        console.error('Invalid JSON in params', e)
    }
}

function resetToDefaults() {
    ttsStore.resetToDefaults()
    const newProfile = getActiveProfile()
    url.value = newProfile.url
    method.value = newProfile.method
    responseType.value = newProfile.responseType || ''
    bodyTemplate.value = newProfile.bodyTemplate || ''
    paramsJson.value = JSON.stringify(newProfile.params || {}, null, 2)
    
    // Visual feedback
    isResetting.value = true
    setTimeout(() => {
        isResetting.value = false
    }, 1000)
}

// Watch for local changes and save
watch([url, method, responseType, bodyTemplate], save)
</script>

<style scoped>
.tts-settings {
  position: absolute;
  bottom: 70px;
  right: 20px;
  width: 320px;
  background: var(--sidebar-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  z-index: 1001;
}

.settings-header {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-header h3 {
  margin: 0;
  font-size: 1rem;
}

.settings-content {
  padding: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  margin-bottom: 0.4rem;
  opacity: 0.8;
}

.form-group input, 
.form-group select, 
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-color);
  color: var(--text-color);
  font-size: 0.9rem;
}

.form-group textarea {
  height: 80px;
  font-family: monospace;
  resize: vertical;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-color);
  opacity: 0.5;
}

.hint {
  font-size: 0.75rem;
  opacity: 0.6;
  margin-top: 0.5rem;
}

.settings-actions {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
}

.reset-btn {
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-color);
  font-size: 0.85rem;
  padding: 0.5rem 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: var(--sidebar-bg);
  border-color: var(--text-color);
}

.reset-btn.resetting {
  color: #10b981;
  border-color: #10b981;
}

.reset-btn svg {
  width: 14px;
  height: 14px;
}
</style>
