import { createSSRApp } from 'vue';
import App from './App.vue';
import WotDesignUni from 'wot-design-uni';

export function createApp() {
    const app = createSSRApp(App);
    app.use(WotDesignUni);
    return {
        app,
    };
}
