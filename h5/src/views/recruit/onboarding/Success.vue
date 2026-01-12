<template>
  <div class="recruit-onboarding-success">
    <van-nav-bar
      :title="t('recruit.onboarding.success.title')"
      left-arrow
      @click-left="handleBack"
    />
    <div class="recruit-onboarding-success__body">
      <van-icon name="passed" class="success-icon" />
      <h1>{{ t('recruit.onboarding.success.heading') }}</h1>
      <p>{{ t('recruit.onboarding.success.description') }}</p>
      <van-button type="primary" round block @click="goAuditResult">
        {{ t('recruit.onboarding.success.actions.viewProgress') }}
      </van-button>
      <van-button round block plain type="primary" class="mt-8" @click="goHome">
        {{ t('recruit.onboarding.success.actions.backHome') }}
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { goBackOrHome } from '@/utils/navigation';

const router = useRouter();
const { t } = useI18n();

const handleBack = () => {
  goBackOrHome(router);
};

const goAuditResult = () => {
  router.replace({ name: 'recruit-onboarding-audit-result' });
};

const goHome = () => {
  router.replace({ path: '/home' });
};
</script>

<style scoped lang="scss">
.recruit-onboarding-success {
  min-height: 100vh;
  background: linear-gradient(180deg, #fff8f1 0%, #ffffff 40%);

  &__body {
    padding: 48px 24px;
    text-align: center;
  }
}

.success-icon {
  font-size: 64px;
  color: #f97316;
  margin-bottom: 24px;
}

h1 {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1f2937;
}

p {
  color: #4b5563;
  margin-bottom: 32px;
  font-size: 14px;
  line-height: 1.6;
}

.mt-8 {
  margin-top: 12px;
}
</style>
