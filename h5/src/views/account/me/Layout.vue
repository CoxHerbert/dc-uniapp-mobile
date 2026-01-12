<template>
  <div class="me-layout">
    <router-view />
  </div>
</template>

<script setup>
</script>

<style scoped>
.me-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  background: #f7f8fa;
}
</style>
