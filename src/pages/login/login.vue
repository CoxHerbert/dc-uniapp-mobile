<template>
  <view class="login-skin">
    <view class="panel">
      <view class="brand">
        <image class="logo" :src="logoUrl" mode="aspectFit" />
        <view class="slogan">
          <text class="bold">{{ t('login.brand.slogan') }}</text>
        </view>
      </view>

      <view class="form-card">
        <view class="field">
          <text class="label">{{ t('login.form.username.placeholder') }}</text>
          <input
            v-model="formData.username"
            class="input"
            type="text"
            :placeholder="t('login.form.username.placeholder')"
          />
        </view>
        <view class="field">
          <text class="label">{{ t('login.form.password.placeholder') }}</text>
          <view class="password-row">
            <input
              v-model="formData.password"
              class="input"
              :password="!showPwd"
              :placeholder="t('login.form.password.placeholder')"
            />
            <button class="toggle" size="mini" @tap="togglePwd">
              {{ showPwd ? '隐藏' : '显示' }}
            </button>
          </view>
        </view>

        <button class="login-btn" :loading="loading" @tap="onSubmit">
          {{ loading ? t('login.button.loading') : t('login.button.submit') }}
        </button>
      </view>
    </view>
  </view>
</template>

<script>
import authStore from '@/store/auth';
import userStore from '@/store/user';
import { KEYS } from '@/constants/keys';
import { extractLoginInfo } from '@/utils/login-info';
import { t } from '@/locales';

export default {
  data() {
    return {
      formData: {
        tenantId: '000000',
        deptId: '',
        roleId: '',
        username: '',
        password: '',
        type: 'account',
        code: '',
        key: '',
      },
      showPwd: false,
      loading: false,
      redirect: '',
      logoUrl: '/static/logo.png',
    };
  },
  onLoad(options) {
    this.redirect = options?.redirect || '';
    this.formData.username = uni.getStorageSync(KEYS.LAST_USERNAME) || '';
    if (authStore.isLogin) {
      this.redirectToTarget();
    }
  },
  methods: {
    t,
    togglePwd() {
      this.showPwd = !this.showPwd;
    },
    resolveRedirect() {
      const fallback = '/pages/index/index';
      if (!this.redirect) return fallback;
      if (this.redirect.includes('/pages/login')) return fallback;
      return this.redirect;
    },
    redirectToTarget() {
      const target = this.resolveRedirect();
      uni.reLaunch({ url: target });
    },
    async onSubmit() {
      if (this.loading) return;
      if (!this.formData.username) {
        uni.showToast({ title: t('login.form.username.required'), icon: 'none' });
        return;
      }
      if (!this.formData.password) {
        uni.showToast({ title: t('login.form.password.required'), icon: 'none' });
        return;
      }
      this.loading = true;
      try {
        const payload = await authStore.loginByUsername({ ...this.formData });
        try {
          await userStore.fetchUserInfo();
        } catch (err) {
          console.warn('[account-login] fetchUserInfo failed:', err);
        }
        const loginInfo = extractLoginInfo(payload);
        userStore.mergeLoginInfo(loginInfo);
        uni.setStorageSync(KEYS.LAST_USERNAME, this.formData.username);
        uni.showToast({ title: t('login.toast.success'), icon: 'success' });
        this.redirectToTarget();
      } catch (err) {
        const msg = err?.message || t('login.toast.fail');
        console.error('[account-login] login error:', err);
        uni.showToast({ title: msg, icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.login-skin {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #e6efff 0%, #d8e8ff 52%, #d6e6ff 100%);
  padding: 32rpx;
  box-sizing: border-box;
}

.panel {
  width: 100%;
}

.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32rpx;
}

.logo {
  width: 168rpx;
  height: 168rpx;
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.08);
}

.slogan {
  margin-top: 24rpx;
  color: #1f2a44;
  font-size: 32rpx;
  font-weight: 700;
  text-align: center;
}

.form-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 24rpx 48rpx rgba(37, 99, 255, 0.12);
}

.field {
  margin-bottom: 24rpx;
}

.label {
  display: block;
  font-size: 24rpx;
  color: #4a5568;
  margin-bottom: 12rpx;
}

.input {
  width: 100%;
  height: 84rpx;
  border-radius: 16rpx;
  padding: 0 24rpx;
  background: rgba(255, 255, 255, 0.7);
  border: 2rpx solid #e2e8f0;
  box-sizing: border-box;
}

.password-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.toggle {
  height: 64rpx;
  line-height: 64rpx;
  padding: 0 24rpx;
  border-radius: 16rpx;
  background: #eef2ff;
  color: #2563ff;
  font-size: 24rpx;
}

.login-btn {
  margin-top: 16rpx;
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 16rpx;
  background: #2563ff;
  color: #fff;
  font-size: 32rpx;
  font-weight: 700;
}
</style>
