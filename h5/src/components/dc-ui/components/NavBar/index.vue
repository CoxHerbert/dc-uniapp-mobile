<template>
  <van-nav-bar
    v-bind="attrs"
    :class="['scroll-aware-nav-bar', { 'scroll-aware-nav-bar--hidden': isHidden }]"
  >
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps"></slot>
    </template>
  </van-nav-bar>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAttrs } from 'vue';
import { detectWxEnv, isWxMiniProgram } from './../../util/wx-env'; // 路径按你的实际调整

const attrs = useAttrs();

// 你原来的滚动隐藏状态（若外部有控制可对接/替换）
const isHidden = ref(false);

// 环境决定的隐藏（微信/企业微信/小程序）
const hideByEnv = ref(false);

onMounted(async () => {
  const env = detectWxEnv();
  // 在微信或企业微信内置浏览器下隐藏
  hideByEnv.value = env.isWeChat || env.isWeCom;

  // 如果你也希望在“小程序 Web-View”里隐藏，保留下面这段；不需要则删掉
  if (!hideByEnv.value) {
    hideByEnv.value = await isWxMiniProgram();
  }
});
</script>

<style scoped>
.scroll-aware-nav-bar {
  transition: transform 0.3s ease;
  will-change: transform;
}

.scroll-aware-nav-bar--hidden {
  transform: translateY(-100%);
}
</style>
