<template>
  <div class="page">
    <h2>{{ t('protected.title') }}</h2>
    <p>
      {{ t('protected.description.before') }}
      <code>{{ t('protected.permission') }}</code>
      {{ t('protected.description.after') }}
    </p>
    <van-button type="danger" @click="logout">{{ t('protected.logout') }}</van-button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import { useI18n } from 'vue-i18n';

const auth = useAuthStore();
const router = useRouter();
const { t } = useI18n();
function logout() {
  auth.logout();
  router.replace('/login');
}
</script>

<style scoped>
.page { padding: 16px; }
</style>
