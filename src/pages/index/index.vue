<template>
  <view class="container">
    <view class="header">
      <text class="title">Wot Design Uni</text>
      <text class="subtitle">UniApp 微信小程序起步页</text>
    </view>
    <wd-button type="primary" block>开始使用</wd-button>
    <view class="tips">
      <text>运行命令：</text>
      <text class="command">npm run dev:mp-weixin</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.container {
  padding: 40rpx;
}

.header {
  margin-bottom: 32rpx;
}

.title {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  color: #1f2a44;
}

.subtitle {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #7a8499;
}

.tips {
  margin-top: 32rpx;
  font-size: 24rpx;
  color: #5f6b85;
}

.command {
  display: block;
  margin-top: 12rpx;
  padding: 16rpx 20rpx;
  border-radius: 16rpx;
  background-color: #eef2ff;
  color: #3b5bdb;
}
</style>
