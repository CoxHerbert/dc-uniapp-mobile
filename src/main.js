import { createSSRApp } from "vue";
import App from "./App.vue";
import { WotDesign } from "wot-design-uni";
export function createApp() {
	const app = createSSRApp(App);
	app.use(WotDesign);
	return {
		app,
	};
}
