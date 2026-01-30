<template>
  <div class="txt-reader">
    <DynamicScroller
      ref="scroller"
      :items="lines"
      :min-item-size="32"
      class="scroller"
      key-field="id"
      v-slot="{ item, index, active }"
      @scroll.passive="onScroll"
    >
      <DynamicScrollerItem
        :item="item"
        :active="active"
        :size-dependencies="[
          item.text,
          fontSize
        ]"
        :data-index="index"
      >
        <div class="line" :style="{ fontSize: fontSize + 'px' }" :data-index="index">
          {{ item.text }}
        </div>
      </DynamicScrollerItem>
    </DynamicScroller>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

const props = defineProps<{
  content: string
  initialLine?: number
  fontSize?: number
}>()

const emit = defineEmits(['update:progress'])

// Processing lines for virtual scroller
const lines = computed(() => {
  if (!props.content) return []
  return props.content.split(/\r?\n/).map((text, index) => ({
    id: index,
    text: text || '\u00A0' // Preserve empty lines
  }))
})

const scroller = ref<InstanceType<typeof DynamicScroller> | null>(null)
const fontSize = computed(() => props.fontSize || 18)
const isRestoring = ref(!!(props.initialLine && props.initialLine > 0))

// Restore position
onMounted(() => {
  if (props.initialLine && props.initialLine > 0 && scroller.value) {
    // Small delay to ensure DynamicScroller has calculated its internal state
    setTimeout(() => {
      scroller.value?.scrollToItem(props.initialLine as number)
      // Allow a moment for the scroll to settle before enabling updates
      setTimeout(() => {
        isRestoring.value = false
      }, 50)
    }, 100)
  }
})

const scrollTo = (lineIndex: number) => {
    if (scroller.value) {
        scroller.value.scrollToItem(lineIndex)
    }
}

defineExpose({
    scrollTo
})

const onScroll = () => {
    if (!scroller.value || isRestoring.value) return;

    const scrollerEl = scroller.value.$el as HTMLElement
    const scrollerRect = scrollerEl.getBoundingClientRect()
    
    // Find the first visible line
    // We search for elements with class 'line'
    const lines = scrollerEl.querySelectorAll('.line')
    let firstVisibleIndex = -1

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const rect = line.getBoundingClientRect()
        // If the bottom of the line is below the top of the scroller, it's the first visible one
        // (adding a small buffer for partial visibility)
        if (rect.bottom > scrollerRect.top) {
            const indexStr = line.getAttribute('data-index')
            if (indexStr) {
                firstVisibleIndex = parseInt(indexStr, 10)
            }
            break
        }
    }

    if (firstVisibleIndex > -1) {
        emit('update:progress', firstVisibleIndex)
    }
}
</script>

<style scoped>
.txt-reader {
  height: 100%;
  width: 100%;
}

.scroller {
  height: 100%;
}

.line {
  padding: 0 1rem;
  line-height: 1.6;
  white-space: pre-wrap; 
  word-break: break-word;
}
</style>
