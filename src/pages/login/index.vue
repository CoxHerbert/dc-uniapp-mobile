<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'

const router = useRouter()
const route = useRoute()

onLoad(() => {
  router.replace({
    name: 'LOGIN_ACCOUNT',
    query: route.query || {},
  })
})
</script>

<template>
  <view class="login-layout">
    <text>正在跳转登录...</text>
  </view>
</template>

<style scoped>
.login-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}
</style>
