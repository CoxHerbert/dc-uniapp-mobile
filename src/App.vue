<script setup></script>

<template>
  <view class="app">
    <slot />
  </view>
</template>

<style lang="scss">
@import "wot-design-uni/dist/style.css";

.app {
  min-height: 100vh;
  background-color: #f7f8fa;
}
</style>
