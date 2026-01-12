<template>
  <view class="login-page">
    <view class="login-card">
      <view class="brand">
        <view class="logo">DC</view>
        <view class="title">欢迎回来</view>
        <view class="subtitle">请使用账号密码登录</view>
      </view>

      <wd-form ref="formRef" :model="form" class="login-form">
        <wd-input
          v-model="form.username"
          label="账号"
          placeholder="请输入账号"
          clearable
        />
        <wd-input
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          label="密码"
          placeholder="请输入密码"
          clearable
        />
        <view class="actions">
          <wd-button type="primary" block :loading="loading" :disabled="loading" @click="handleLogin">
            登录
          </wd-button>
        </view>
      </wd-form>

      <view class="footer">
        <wd-checkbox v-model="form.remember">记住账号</wd-checkbox>
        <view class="link" @click="togglePassword">
          {{ showPassword ? '隐藏密码' : '显示密码' }}
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { loginByUsername } from '@/api/auth';
import { KEYS } from '@/constants/keys';
import { setRefreshToken, setToken } from '@/utils/auth';
import { extractLoginInfo } from '@/utils/login-info';

const formRef = ref(null);
const loading = ref(false);
const showPassword = ref(false);
const redirectUrl = ref('');

const form = reactive({
  tenantId: '000000',
  deptId: '',
  roleId: '',
  username: uni.getStorageSync(KEYS.LAST_USERNAME) || '',
  password: '',
  type: 'account',
  code: '',
  key: '',
  remember: true,
});

onLoad((options) => {
  if (options?.redirect) {
    redirectUrl.value = decodeURIComponent(options.redirect);
  }
});

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const persistLoginInfo = (payload) => {
  const info = extractLoginInfo(payload);
  if (info) {
    uni.setStorageSync(KEYS.LOGIN_INFO, info);
  }
};

const applyRedirect = () => {
  const target = redirectUrl.value;
  if (!target) return false;
  if (target.includes('pages/login/login')) return false;
  uni.redirectTo({ url: target });
  return true;
};

const handleLogin = async () => {
  if (loading.value) return;
  if (!form.username || !form.password) {
    uni.showToast({
      title: '请输入账号和密码',
      icon: 'none',
    });
    return;
  }

  loading.value = true;
  try {
    const payload = await loginByUsername({
      ...form,
      password: form.password,
    });

    const data = payload?.data ?? payload;
    const accessToken = data?.access_token || data?.accessToken || data?.token;
    const refreshToken = data?.refresh_token || data?.refreshToken;

    if (accessToken) {
      setToken(accessToken);
    }
    if (refreshToken) {
      setRefreshToken(refreshToken);
    }

    persistLoginInfo(payload);

    if (form.remember) {
      uni.setStorageSync(KEYS.LAST_USERNAME, form.username);
    } else {
      uni.removeStorageSync(KEYS.LAST_USERNAME);
    }

    uni.showToast({
      title: '登录成功',
      icon: 'success',
    });

    if (!applyRedirect()) {
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
    loading.value = false;
  }
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

.actions {
  margin-top: 32rpx;
  display: grid;
  gap: 20rpx;
}

.footer {
  margin-top: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 24rpx;
  color: #7a8599;
}

.link {
  color: #3a6cff;
}
</style>
