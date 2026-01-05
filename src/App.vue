<template>
  <view class="app">
    <slot />
  </view>
</template>

<script setup></script>

<style lang="scss">
@import "wot-design-uni/style/index.scss";

.app {
  min-height: 100vh;
  background-color: #f7f8fa;
}
</style>
