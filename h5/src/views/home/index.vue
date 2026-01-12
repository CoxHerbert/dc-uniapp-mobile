<!-- pages/CascaderDemo.vue -->
<template>
  <div class="page home">
    <van-nav-bar :title="t('routes.home')" />
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style scoped lang="scss">
.home {
  min-height: 100vh;
  background: #f7f8fa;
}
.apps__content {
  padding: 24px 16px;
  padding-top: calc(72px + var(--van-safe-area-top, 0px));
  box-sizing: border-box;
}
.block {
  margin-bottom: 28px;
}
.result {
  margin-top: 10px;
  font-size: 13px;
  color: #555;
  word-break: break-all;
}
hr {
  border: none;
  border-top: 1px solid #eee;
  margin: 20px 0;
}
</style>
