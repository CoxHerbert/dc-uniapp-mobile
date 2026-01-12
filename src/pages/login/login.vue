<template>
  <view class="login-page">
    <view class="login-card">
      <view class="brand">
        <view class="logo">DC</view>
        <view class="title">欢迎回来</view>
        <view class="subtitle">请使用账号密码登录</view>
      </view>

      <view class="login-form">
        <view class="form-item">
          <text class="label">账号</text>
          <input v-model="form.username" class="input" placeholder="请输入账号" />
        </view>
        <view class="form-item">
          <text class="label">密码</text>
          <input
            v-model="form.password"
            class="input"
            :password="!showPassword"
            placeholder="请输入密码"
          />
        </view>
        <view class="actions">
          <button class="primary-button" :disabled="loading" @click="handleLogin">
            {{ loading ? '登录中…' : '登录' }}
          </button>
        </view>
      </view>

      <view class="footer">
        <view class="remember">
          <switch :checked="form.remember" @change="toggleRemember" />
          <text class="remember-text">记住账号</text>
        </view>
        <view class="link" @click="togglePassword">
          {{ showPassword ? '隐藏密码' : '显示密码' }}
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { KEYS } from '@/constants/keys';
import { extractLoginInfo } from '@/utils/login-info';
import { encryptPassword } from '@/utils/sm2';

export default {
  data() {
    return {
      loading: false,
      showPassword: false,
      redirectUrl: '',
      form: {
        tenantId: '000000',
        deptId: '',
        roleId: '',
        username: uni.getStorageSync(KEYS.LAST_USERNAME) || '',
        password: '',
        type: 'account',
        code: '',
        key: '',
        remember: true,
      },
    };
  },
  onLoad(options) {
    if (options?.redirect) {
      this.redirectUrl = decodeURIComponent(options.redirect);
    }
  },
  methods: {
    togglePassword() {
      this.showPassword = !this.showPassword;
    },
    toggleRemember(event) {
      this.form.remember = event?.detail?.value ?? !this.form.remember;
    },
    persistLoginInfo(payload) {
      const info = extractLoginInfo(payload);
      if (info) {
        uni.setStorageSync(KEYS.LOGIN_INFO, info);
      }
    },
    applyRedirect() {
      const target = this.redirectUrl;
      if (!target) return false;
      if (target.includes('pages/login/login')) return false;
      uni.redirectTo({ url: target });
      return true;
    },
    async handleLogin() {
      if (this.loading) return;
      if (!this.form.username || !this.form.password) {
        uni.showToast({
          title: '请输入账号和密码',
          icon: 'none',
        });
        return;
      }

      this.loading = true;
      try {
        const payload = await this.$store.dispatch('auth/loginByUsername', {
          ...this.form,
          password: encryptPassword(this.form.password),
        });

        try {
          await this.$store.dispatch('user/fetchUserInfo');
        } catch (error) {
          console.warn('[account-login] fetchUserInfo failed:', error);
        }

        const loginInfo = extractLoginInfo(payload);
        await this.$store.dispatch('user/mergeLoginInfo', loginInfo);
        this.persistLoginInfo(payload);

        if (this.form.remember) {
          uni.setStorageSync(KEYS.LAST_USERNAME, this.form.username);
        } else {
          uni.removeStorageSync(KEYS.LAST_USERNAME);
        }

        uni.showToast({
          title: '登录成功',
          icon: 'success',
        });

        if (!this.applyRedirect()) {
          const pages = getCurrentPages();
          if (pages.length > 1) {
            uni.navigateBack();
          }
        }
      } catch (error) {
        uni.showToast({
          title: error?.message || '登录失败，请重试',
          icon: 'none',
        });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx 32rpx;
  background: linear-gradient(180deg, #e8f1ff 0%, #f5f6f8 60%);
}

.login-card {
  width: 100%;
  max-width: 560rpx;
  padding: 48rpx 36rpx;
  border-radius: 32rpx;
  background-color: #ffffff;
  box-shadow: 0 24rpx 64rpx rgba(26, 45, 85, 0.12);
}

.brand {
  text-align: center;
  margin-bottom: 40rpx;
}

.logo {
  width: 120rpx;
  height: 120rpx;
  margin: 0 auto 16rpx;
  border-radius: 32rpx;
  background: #3a6cff;
  color: #fff;
  font-size: 40rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title {
  font-size: 36rpx;
  font-weight: 600;
  color: #1d2a44;
}

.subtitle {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #7a8599;
}

.login-form {
  margin-top: 24rpx;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.label {
  font-size: 24rpx;
  color: #1d2a44;
}

.input {
  height: 84rpx;
  padding: 0 24rpx;
  border-radius: 16rpx;
  background: #f5f7fb;
  font-size: 28rpx;
}

.actions {
  margin-top: 24rpx;
}

.primary-button {
  width: 100%;
  height: 88rpx;
  border-radius: 16rpx;
  background: #3a6cff;
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
}

.primary-button[disabled] {
  opacity: 0.6;
}

.footer {
  margin-top: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 24rpx;
  color: #7a8599;
}

.remember {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.remember-text {
  font-size: 24rpx;
  color: #7a8599;
}

.link {
  color: #3a6cff;
}
</style>
