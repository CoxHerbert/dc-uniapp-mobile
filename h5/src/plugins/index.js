// src/plugins/index.js
import { createDictPlugin } from './dict-plugin';
import apolloClient from './wiki-graphql';
import * as utils from '@/plugins/utils.js';

// ✅ 保持同步，避免顺序/Promise 混淆
function setupPlugins(app) {
  app.use(createDictPlugin()); // 如果它本身需要异步，内部自行处理
}

export default {
  install(app) {
    setupPlugins(app);
    const utilKeys = Object.keys(utils);
    utilKeys.forEach((key) => {
      if (utils[key]) app.config.globalProperties[`$${key}`] = utils[key];
    });
    app.config.globalProperties.apolloClient = apolloClient;
  },
};
