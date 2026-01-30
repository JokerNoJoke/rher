<template>
  <div class="app-layout">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<style>
/* No scoped style here, main.css is global */
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>