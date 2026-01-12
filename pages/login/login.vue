<template>
  <view class="login-page">
    <view class="login-card">
      <view class="brand">
        <view class="logo">DC</view>
        <view class="title">欢迎回来</view>
        <view class="subtitle">请使用账号继续</view>
      </view>

      <view class="login-form">
        <view class="field">
          <text class="label">手机号</text>
          <input
            v-model="form.phone"
            type="number"
            class="input"
            placeholder="请输入手机号"
          />
        </view>
        <view class="field">
          <text class="label">密码</text>
          <input
            v-model="form.password"
            type="password"
            class="input"
            placeholder="请输入密码"
          />
        </view>
        <view class="actions">
          <button class="button primary" @click="handleLogin">登录</button>
          <button class="button ghost" @click="handleRegister">注册账号</button>
        </view>
      </view>

      <view class="footer">
        <checkbox-group class="remember" @change="handleRememberChange">
          <label class="remember-label">
            <checkbox value="remember" :checked="form.remember" />
            <text>记住我</text>
          </label>
        </checkbox-group>
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

const handleRememberChange = (event) => {
  form.remember = event.detail.value.includes("remember");
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
  display: grid;
  gap: 24rpx;
}

.field {
  display: grid;
  gap: 12rpx;
}

.label {
  font-size: 24rpx;
  color: #1d2a44;
  font-weight: 500;
}

.input {
  height: 84rpx;
  padding: 0 24rpx;
  border-radius: 20rpx;
  background-color: #f5f7fb;
  font-size: 28rpx;
  color: #1d2a44;
}

.actions {
  margin-top: 8rpx;
  display: grid;
  gap: 16rpx;
}

.button {
  border-radius: 20rpx;
  font-size: 28rpx;
  line-height: 84rpx;
  height: 84rpx;
  padding: 0;
}

.button.primary {
  background: #3a6cff;
  color: #fff;
}

.button.ghost {
  background: transparent;
  border: 2rpx solid #dbe3f4;
  color: #3a6cff;
}

.footer {
  margin-top: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 24rpx;
  color: #7a8599;
}

.remember {
  display: flex;
  align-items: center;
}

.remember-label {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.link {
  color: #3a6cff;
}
</style>
