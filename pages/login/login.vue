<template>
  <view class="login-page">
    <view class="login-card">
      <view class="brand">
        <view class="logo">DC</view>
        <view class="title">欢迎回来</view>
        <view class="subtitle">请使用账号继续</view>
      </view>

      <wd-form ref="formRef" :model="form" class="login-form">
        <wd-input
          v-model="form.phone"
          type="number"
          label="手机号"
          placeholder="请输入手机号"
          clearable
        />
        <wd-input
          v-model="form.password"
          type="password"
          label="密码"
          placeholder="请输入密码"
          clearable
        />
        <view class="actions">
          <wd-button type="primary" block @click="handleLogin">
            登录
          </wd-button>
          <wd-button block plain @click="handleRegister">
            注册账号
          </wd-button>
        </view>
      </wd-form>

      <view class="footer">
        <wd-checkbox v-model="form.remember">记住我</wd-checkbox>
        <view class="link" @click="handleForgot">忘记密码？</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { reactive } from "vue";

const form = reactive({
  phone: "",
  password: "",
  remember: false,
});

const handleLogin = () => {
  uni.showToast({
    title: "登录功能待接入",
    icon: "none",
  });
};

const handleRegister = () => {
  uni.showToast({
    title: "注册功能待接入",
    icon: "none",
  });
};

const handleForgot = () => {
  uni.showToast({
    title: "请联系管理员",
    icon: "none",
  });
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx 32rpx;
  background: linear-gradient(180deg, #e8f1ff 0%, #f5f6f8 60%);
}

.login-card {
  width: 100%;
  max-width: 560rpx;
  padding: 48rpx 36rpx;
  border-radius: 32rpx;
  background-color: #ffffff;
  box-shadow: 0 24rpx 64rpx rgba(26, 45, 85, 0.12);
}

.brand {
  text-align: center;
  margin-bottom: 40rpx;
}

.logo {
  width: 120rpx;
  height: 120rpx;
  margin: 0 auto 16rpx;
  border-radius: 32rpx;
  background: #3a6cff;
  color: #fff;
  font-size: 40rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title {
  font-size: 36rpx;
  font-weight: 600;
  color: #1d2a44;
}

.subtitle {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #7a8599;
}

.login-form {
  margin-top: 24rpx;
}

.actions {
  margin-top: 32rpx;
  display: grid;
  gap: 20rpx;
}

.footer {
  margin-top: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 24rpx;
  color: #7a8599;
}

.link {
  color: #3a6cff;
}
</style>
