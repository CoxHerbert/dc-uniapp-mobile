// src/main.js
import { createApp } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import App from './App.vue';
import router from '@/router';
import i18n from './locales';
import { setupPermissionGuard } from './permission';
import Api from '@/api/index';
import dayjs from 'dayjs';

// 样式
import 'nprogress/nprogress.css';
import 'vant/lib/index.css';
import '@/styles/index.scss';

// 插件 & 工具
import plugins from './plugins/index';
import vant from 'vant';
import dcUI from './components/dc-ui/index.js';
import wfUI from './components/wf-ui/index.js';
import { registerComponents } from './components/index';
import { setupDirectives } from './directives';
import { attachNProgress } from '@/router/nprogress';
import { useDebugStore } from '@/store/debug';
import request from '@/axios/workflow';
import NfCustomFields from '@/views/plugin/workflow/components/custom-fileds/index';

// —— 启动函数（推荐异步引导）——
async function bootstrap() {
  const app = createApp(App);

  // 1) 状态 & 路由
  const pinia = createPinia();
  app.use(pinia);
  setActivePinia(pinia);

  // 2) 权限守卫需在 router 安装之前注册，确保首跳也能被拦截
  setupPermissionGuard(router);

  app.use(dcUI);
  app.use(wfUI);
  app.use(vant);
  app.use(i18n);
  app.use(router);
  app.use(plugins);
  app.use(NfCustomFields);

  const debugStore = useDebugStore();
  await debugStore.init();

  // 3) 全局注册（组件/指令/插件）
  registerComponents(app);
  setupDirectives(app);
  attachNProgress(router);
  // 4) 启动前兜底：如果已登录但本地没有用户资料，则拉一次用户信息
  const { useAuthStore } = await import('@/store/auth');
  const { useUserStore } = await import('@/store/user');
  const auth = useAuthStore();
  const user = useUserStore();
  if (auth.isLogin && !user.userInfo) {
    try {
      await user.fetchUserInfo();
    } catch {
      // 忽略启动期拉取失败，交由页面或拦截器兜底
    }
  }
  app.config.globalProperties.api = Api;
  app.config.globalProperties.$axios = request;
  app.config.globalProperties.$dayjs = dayjs;

  app.config.globalProperties.$http = {
    request,
  };
  app.config.globalProperties.$store = {
    getters: {
      userInfo: user.userInfo,
    },
    state: {
      user: {
        userInfoAll: user.userInfo,
      },
    },
  };

  // 5) 等路由就绪再挂载，避免首屏空白或闪烁
  await router.isReady();
  app.mount('#app');
}

bootstrap();
