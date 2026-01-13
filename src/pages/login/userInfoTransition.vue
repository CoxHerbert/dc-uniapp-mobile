<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const loading = ref(false)
const message = ref('')

const handleFetch = async () => {
  loading.value = true
  message.value = ''
  try {
    await userStore.fetchUserInfo()
    message.value = '用户信息已更新'
    const redirect = route.query?.redirect as string
    if (redirect) {
      router.replaceAll({ path: redirect })
    }
  }
  catch (error: any) {
    message.value = error?.message || '获取用户信息失败'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <view class="page">
    <view class="title">用户信息过渡页</view>
    <view class="desc">用于接收票据并拉取用户信息。</view>
    <button class="primary" :loading="loading" @click="handleFetch">
      {{ loading ? '处理中...' : '拉取用户信息' }}
    </button>
    <view v-if="message" class="message">{{ message }}</view>
  </view>
</template>

<style scoped>
.page {
  padding: 32rpx;
}

.title {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
}

.desc {
  color: #6b7280;
  margin-bottom: 24rpx;
}

.primary {
  background: #2b7cff;
  color: #fff;
  border-radius: 12rpx;
}

.message {
  margin-top: 16rpx;
  color: #2563eb;
}
</style>
