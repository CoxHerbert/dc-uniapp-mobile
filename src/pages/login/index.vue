<template>
  <view class="login-skin">
    <view class="panel">
      <view class="brand">
        <image class="logo" :src="logoUrl" mode="aspectFit" />
        <view class="slogan">
          <text class="bold">{{ t('login.brand.slogan') }}</text>
        </view>
      </view>

      <view class="group">
        <view class="field">
          <input
            v-model="formData.username"
            class="field-input"
            type="text"
            :placeholder="t('login.form.username.placeholder')"
          />
        </view>
        <view class="field">
          <input
            v-model="formData.password"
            class="field-input"
            :type="showPwd ? 'text' : 'password'"
            :placeholder="t('login.form.password.placeholder')"
          />
          <button class="eye-btn" type="button" @click="showPwd = !showPwd">
            <text>{{ showPwd ? '🙈' : '👁️' }}</text>
          </button>
        </view>
      </view>

      <wd-button
        class="login-btn"
        block
        :loading="loading"
        :disabled="loading"
        @click="onSubmit"
      >
        {{ loading ? t('login.button.loading') : t('login.button.submit') }}
      </wd-button>

      <view class="lang-actions">
        <LanguageSelector
          variant="compact"
          trigger-class="login-lang-trigger"
          :title="t('login.language.title')"
          :cancel-text="t('login.language.cancel')"
        />
      </view>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useAuthStore } from '@/store/auth';
import { useUserStore } from '@/store/user';
import { useI18n } from 'vue-i18n';
import { KEYS } from '@/constants/keys';
import { extractLoginInfo } from '@/utils/login-info';
import { storage } from '@/utils/storage';
import LanguageSelector from '@/components/LanguageSelector.vue';

const auth = useAuthStore();
const user = useUserStore();
const { t } = useI18n();

const logoUrl = '/static/logo.png';

const loading = ref(false);
const showPwd = ref(false);
const redirectPath = ref('');

const formData = reactive({
  tenantId: '000000',
  deptId: '',
  roleId: '',
  username: storage.get(KEYS.LAST_USERNAME, ''),
  password: '',
  type: 'account',
  code: '',
  key: '',
});

onLoad((options) => {
  redirectPath.value = options?.redirect || '';
  if (auth?.token) {
    uni.reLaunch({
      url: resolveRedirect(),
    });
  }
});

function resolveRedirect() {
  const fallback = '/pages/index/index';
  const target = redirectPath.value ? decodeURIComponent(redirectPath.value) : fallback;
  if (!target || target === '/' || target.includes('/pages/login')) return fallback;
  if (!target.startsWith('/')) return fallback;
  return target;
}

async function onSubmit() {
  if (loading.value) return;
  try {
    if (!formData.username || !formData.password) {
      uni.showToast({
        title: t('login.form.username.required'),
        icon: 'none',
      });
      return;
    }
    loading.value = true;

    const loginPayload = await auth.loginByUsername({ ...formData });

    try {
      await user.fetchUserInfo();
    } catch (e) {
      console.warn('[account-login] fetchUserInfo failed:', e);
    }

    const loginInfo = extractLoginInfo(loginPayload);
    user.mergeLoginInfo(loginInfo);

    storage.set(KEYS.LAST_USERNAME, formData.username);

    uni.showToast({
      title: t('login.toast.success'),
      icon: 'success',
    });

    setTimeout(() => {
      uni.reLaunch({
        url: resolveRedirect(),
      });
    }, 300);
  } catch (err) {
    const msg = err?.message || t('login.toast.fail');
    console.error('[account-login] login error:', err);
    uni.showToast({
      title: msg,
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-skin {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #e6efff 0%, #d8e8ff 52%, #d6e6ff 100%);
  padding: 16px;
  box-sizing: border-box;
}

.panel {
  width: 96%;
  margin-top: -70%;
}

.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 8px 0 18px;
}

.logo {
  width: 84px;
  height: 84px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.08);
}

.slogan {
  margin-top: 12px;
  color: #1f2a44;
  text-align: center;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 1px;
  line-height: 1.35;
  padding: 0 16px;
}

.group {
  margin: 0;
  padding: 14px 16px;
  background: #fff;
  border-radius: 12px;
}

.field {
  margin: 10px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(37, 99, 255, 0.12);
}

.field-input {
  flex: 1;
  font-size: 14px;
}

.eye-btn {
  background: transparent;
  border: none;
  padding: 0 4px;
}

.login-btn {
  margin-top: 16px;
  height: 46px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #fff;
  background: #2563ff;
  box-shadow: 0 10px 22px rgba(37, 99, 255, 0.35);
}

.lang-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 28px;
}

.login-lang-trigger {
  margin: 0;
  font-size: 12px;
  color: #2563ff;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 4px 12px rgba(37, 99, 255, 0.18);
}
</style>
