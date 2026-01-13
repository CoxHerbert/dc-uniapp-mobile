<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const loading = ref(false)
const errorMessage = ref('')
const username = ref('')
const password = ref('')

const userInfoJson = computed(() => JSON.stringify(userStore.userInfo, null, 2))

const handleFetchUserInfo = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    await userStore.fetchUserInfo()
  }
  catch (error: any) {
    errorMessage.value = error?.message || '获取用户信息失败'
  }
  finally {
    loading.value = false
  }
}

const handleClear = () => {
  userStore.reset()
  username.value = ''
  password.value = ''
}
</script>

<template>
  <view class="page">
    <view class="card">
      <view class="title">账号登录</view>
      <view class="field">
        <text class="label">账号</text>
        <input v-model="username" class="input" placeholder="请输入账号" />
      </view>
      <view class="field">
        <text class="label">密码</text>
        <input v-model="password" class="input" password placeholder="请输入密码" />
      </view>
      <button class="primary" :loading="loading" @click="handleFetchUserInfo">
        {{ loading ? '正在获取...' : '登录并获取用户信息' }}
      </button>
      <button class="ghost" @click="handleClear">清除登录信息</button>
      <view v-if="errorMessage" class="error">{{ errorMessage }}</view>
    </view>

    <view class="card">
      <view class="title">当前用户信息</view>
      <view class="code">{{ userInfoJson }}</view>
    </view>
  </view>
</template>

<style scoped>
.page {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.06);
}

.title {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 20rpx;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.label {
  font-size: 26rpx;
  color: #666;
}

.input {
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 16rpx;
  font-size: 28rpx;
}

.primary {
  background: #2b7cff;
  color: #fff;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
}

.ghost {
  background: #f5f7ff;
  color: #2b7cff;
  border-radius: 12rpx;
}

.error {
  margin-top: 12rpx;
  color: #e53935;
}

.code {
  font-size: 24rpx;
  color: #4b5563;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
