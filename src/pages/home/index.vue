<script setup lang="ts">
const router = useRouter()

const handleGoSettings = () => {
  router.push({ name: 'settings' })
}
</script>

<template>
  <view class="page">
    <view class="title">首页</view>
    <view class="desc">已对齐 H5 路由结构，保留工作台入口。</view>
    <button class="primary" @click="handleGoSettings">前往设置</button>
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
