<script setup lang="ts">
import { KEYS } from '@/constants/keys'

definePage({
  name: 'login',
  style: {
    navigationBarTitleText: '登录',
  },
})

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const userStore = useUserStore()
const { success, error } = useGlobalToast()

const logoUrl = '/static/logo.png'
const loading = ref(false)
const remember = ref(true)
const formData = reactive({
  username: uni.getStorageSync(KEYS.LAST_USERNAME) || '',
  password: '',
})

const canSubmit = computed(() => formData.username.trim() && formData.password.trim())

const resolveRedirect = () => {
  const redirect = route.query?.redirect
  if (typeof redirect === 'string' && redirect && !redirect.includes('/login')) {
    return redirect
  }
  return '/pages/index/index'
}

const redirectIfLoggedIn = () => {
  if (authStore.isLogin) {
    router.replaceAll(resolveRedirect())
  }
}

onMounted(() => {
  redirectIfLoggedIn()
})

async function onSubmit() {
  if (!canSubmit.value || loading.value) {
    error({ msg: '请输入账号和密码' })
    return
  }

  try {
    loading.value = true
    const payload = await authStore.loginByUsername({
      username: formData.username.trim(),
      password: formData.password.trim(),
    })

    userStore.updateFromPayload(payload)

    if (remember.value) {
      uni.setStorageSync(KEYS.LAST_USERNAME, formData.username.trim())
    } else {
      uni.removeStorageSync(KEYS.LAST_USERNAME)
    }

    success({ msg: '登录成功' })
    router.replaceAll(resolveRedirect())
  } catch (err: any) {
    const message = err?.message || '登录失败，请重试'
    console.error('[login] failed:', err)
    error({ msg: message })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <view class="login-page">
    <view class="login-panel">
      <view class="login-brand">
        <image class="login-logo" :src="logoUrl" mode="aspectFit" />
        <text class="login-slogan">欢迎登录统一认证</text>
      </view>

      <view class="login-form">
        <wd-input
          v-model="formData.username"
          placeholder="请输入账号"
          clearable
          custom-class="login-input"
        />
        <wd-input
          v-model="formData.password"
          placeholder="请输入密码"
          type="password"
          clearable
          custom-class="login-input"
        />
        <view class="login-remember">
          <wd-switch v-model="remember" size="18px" />
          <text class="login-remember-text">记住账号</text>
        </view>
        <wd-button
          block
          type="primary"
          :loading="loading"
          :disabled="!canSubmit"
          @click="onSubmit"
        >
          {{ loading ? '登录中…' : '登录' }}
        </wd-button>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  background: linear-gradient(180deg, #e6efff 0%, #d8e8ff 52%, #d6e6ff 100%);
}

.login-panel {
  width: 100%;
  max-width: 640rpx;
  border-radius: 32rpx;
  padding: 48rpx 36rpx;
  background: #ffffff;
  box-shadow: 0 16rpx 32rpx rgba(0, 0, 0, 0.08);
}

.login-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;
}

.login-logo {
  width: 120rpx;
  height: 120rpx;
  border-radius: 24rpx;
  background: #f4f7ff;
}

.login-slogan {
  margin-top: 24rpx;
  font-size: 32rpx;
  color: #1f2a44;
  font-weight: 600;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.login-input {
  border-radius: 20rpx !important;
  background: #f5f7fb !important;
}

.login-remember {
  display: flex;
  align-items: center;
  gap: 16rpx;
  color: #5a667f;
  font-size: 24rpx;
}

.login-remember-text {
  line-height: 1;
}
</style>
