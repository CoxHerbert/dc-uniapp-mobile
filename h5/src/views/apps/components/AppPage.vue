<template>
  <div class="page app-page">
    <van-nav-bar :title="title" />
    <div class="app-page__content">
      <van-empty :description="description" />
    </div>
  </div>
</template>

<script setup>
import { toRefs } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '功能开发中，敬请期待',
  },
});

const { title, description } = toRefs(props);
</script>

<style scoped>
.app-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.app-page__content {
  min-height: calc(100vh - 96px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  box-sizing: border-box;
}

:deep(.van-empty__description) {
  color: #5f6b7a;
}
</style>
