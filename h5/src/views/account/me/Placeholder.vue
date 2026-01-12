<template>
  <div class="me-placeholder">
    <van-empty :description="description" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

const route = useRoute();
const { t } = useI18n();

const description = computed(() => {
  const key = route.meta?.placeholderKey;
  return key ? t(key) : t('me.placeholder.default');
});
</script>

<style scoped>
.me-placeholder {
  min-height: calc(100vh - 96px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: #f7f8fa;
}

:deep(.van-empty__description) {
  color: #5f6b7a;
}
</style>
