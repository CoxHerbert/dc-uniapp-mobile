<script setup lang="ts">
const router = useRouter()
const handleBack = () => {
  router.replace({ name: 'LOGIN_ACCOUNT' })
}
</script>

<template>
  <view class="page">
    <view class="title">登录转跳中</view>
    <view class="desc">此页面用于处理统一登录的跳转逻辑。</view>
    <button class="primary" @click="handleBack">返回账号登录</button>
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
</style>
