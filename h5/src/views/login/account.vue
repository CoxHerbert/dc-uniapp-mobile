<!-- src/views/login/account.vue -->
<template>
  <div class="login-skin">
    <div class="panel">
      <!-- logo + 标语 -->
      <div class="brand">
        <img class="logo" :src="logoUrl" alt="logo" />
        <div class="slogan">
          <span class="bold">{{ t('login.brand.slogan') }}</span>
        </div>
      </div>

      <!-- 登录表单 -->
      <van-form ref="formRef" validate-first @submit="onSubmit">
        <van-cell-group inset class="group">
          <!-- 用户名 -->
          <van-field
            v-model="formData.username"
            name="username"
            :placeholder="t('login.form.username.placeholder')"
            :rules="[{ required: true, message: t('login.form.username.required') }]"
            :border="false"
            class="field"
          >
            <template #left-icon>
              <div class="ico">
                <van-icon name="user-o" />
              </div>
            </template>
          </van-field>

          <!-- 密码 -->
          <van-field
            v-model="formData.password"
            :type="showPwd ? 'text' : 'password'"
            name="password"
            :placeholder="t('login.form.password.placeholder')"
            :rules="[{ required: true, message: t('login.form.password.required') }]"
            :border="false"
            class="field"
          >
            <template #left-icon>
              <div class="ico">
                <van-icon name="shield-o" />
              </div>
            </template>
            <template #right-icon>
              <van-icon :name="showPwd ? 'eye-o' : 'closed-eye'" @click="showPwd = !showPwd" />
            </template>
          </van-field>
        </van-cell-group>

        <van-button
          class="login-btn"
          block
          round
          native-type="submit"
          :loading="loading"
          :disabled="loading"
          :loading-text="t('login.button.loading')"
        >
          {{ t('login.button.submit') }}
        </van-button>
      </van-form>

      <div class="lang-actions">
        <LanguageSelector
          variant="compact"
          trigger-class="login-lang-trigger"
          :title="t('login.language.title')"
          :cancel-text="t('login.language.cancel')"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { useUserStore } from '@/store/user';
import { showToast, showFailToast } from 'vant';
import { useI18n } from 'vue-i18n';
import { KEYS } from '@/constants/keys';
import { extractLoginInfo } from '@/utils/login-info';

const route = useRoute();
const auth = useAuthStore();
const user = useUserStore();
const { t } = useI18n();

/** 兼容二级目录的 logo 地址 */
const logoUrl = `${import.meta.env.BASE_URL}images/logo.png`;

const formRef = ref(null);
const loading = ref(false);
const showPwd = ref(false);
const remember = ref(true);

const formData = reactive({
  tenantId: '000000',
  deptId: '',
  roleId: '',
  username: localStorage.getItem(KEYS.LAST_USERNAME) || '',
  password: '',
  type: 'account',
  code: '',
  key: '',
});

/** 安全回跳：保留 BASE_URL（如 /mobile/），禁止跳回登录页，且仅同源 */
function safeRedirect() {
  const BASE = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/'); // 归一化为以 / 结尾
  const origin = window.location.origin;
  const raw = String(route.query?.redirect || BASE);

  try {
    // 用“origin + BASE”作为解析基准，确保保留 /mobile/ 前缀
    const u = new URL(raw, origin + BASE);

    // 仅允许同源
    if (u.origin !== origin) return BASE;

    // 计算带前缀的登录路径前缀：/mobile/login
    const loginPrefix = new URL(BASE + 'login', origin).pathname;

    // 禁止回到登录页（含 /login/*）
    if (u.pathname === loginPrefix || u.pathname.startsWith(loginPrefix + '/')) {
      return BASE;
    }

    // 若 redirect 没带到 BASE 前缀，补上它
    let finalPath = u.pathname;
    if (!finalPath.startsWith(BASE)) {
      finalPath = BASE.replace(/\/$/, '') + (finalPath.startsWith('/') ? '' : '/') + finalPath;
    }

    // 去重 //，并返回完整 path + 查询 + hash
    finalPath = finalPath.replace(/\/{2,}/g, '/');
    const out = finalPath + u.search + u.hash;

    return out || BASE;
  } catch {
    return import.meta.env.BASE_URL || '/';
  }
}

onMounted(() => {
  if (auth?.token) window.location.replace(safeRedirect());
});

async function onSubmit() {
  if (loading.value) return;
  try {
    loading.value = true;
    await formRef.value?.validate?.();

    const loginPayload = await auth.loginByUsername({ ...formData });

    try {
      await user.fetchUserInfo();
    } catch (e) {
      console.warn('[account-login] fetchUserInfo failed:', e);
    }

    const loginInfo = extractLoginInfo(loginPayload);
    user.mergeLoginInfo(loginInfo);

    if (remember.value) localStorage.setItem(KEYS.LAST_USERNAME, formData.username);
    else localStorage.removeItem(KEYS.LAST_USERNAME);

    showToast(t('login.toast.success'));
    window.location.replace(safeRedirect());
  } catch (err) {
    const msg = err?.message || t('login.toast.fail');
    console.error('[account-login] login error:', err);
    showFailToast(msg);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
/* 整体背景（淡蓝渐变 + 圆角容器阴影） */
.login-skin {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #f5f7fb;
  padding: 16px;
  box-sizing: border-box;
  background: linear-gradient(180deg, #e6efff 0%, #d8e8ff 52%, #d6e6ff 100%);
}

/* 中间蓝色渐变的大圆角面板，模拟你截图的视觉 */
.panel {
  margin-top: -70%;
  width: 96%;
}

/* logo 与标语 */
.brand {
  display: grid;
  place-items: center;
  margin: 8px 0 18px;
}
.logo {
  width: 84px;
  height: 84px;
  border-radius: 12px;
  background: #fff;
  object-fit: contain;
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.08);
}
.slogan {
  margin-top: 12px;
  color: #1f2a44;
  text-align: center;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 1px;
  line-height: 1.35;
  padding: 0 16px;
  word-break: break-word;
}
.slogan .bold {
  font-weight: 800;
}

/* 表单组：去掉 inset 的外侧留白，并控制间距 */
.group {
  margin: 0;
  padding: 0;
  background: #fff;
}

/* 单个输入的样式：圆角浅蓝背景、带左侧虚线图标框 */
.field {
  margin: 10px 0;
  :deep(.van-field__left-icon) {
    margin-right: 10px;
  }
  :deep(.van-field__control) {
    font-size: 14px;
  }
  :deep(.van-cell) {
    padding: 10px 12px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.55);
  }
}

/* 左侧图标的虚线框效果 */
.ico {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 1.5px dashed #c5d7ff;
  border-radius: 8px;
  opacity: 0.9;
}

/* 登录按钮：与图一致的高亮蓝 */
.login-btn {
  margin-top: 16px;
  height: 46px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #fff;
  background: #2563ff;
  box-shadow: 0 10px 22px rgba(37, 99, 255, 0.35);
}

.lang-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 28px;
}

.login-lang-trigger {
  margin: 0;
  font-size: 12px;
  color: #2563ff;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 4px 12px rgba(37, 99, 255, 0.18);
}
</style>
