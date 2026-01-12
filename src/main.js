import { createSSRApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import i18n from './locales';
import WotDesign from 'wot-design-uni';
import 'wot-design-uni/dist/style.css';

export function createApp() {
  const app = createSSRApp(App);
  const pinia = createPinia();

  app.use(pinia);
  app.use(i18n);
  app.use(WotDesign);

  return {
    app,
  };
}
