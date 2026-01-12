// src/plugins/dict-plugin.js
// 直接在插件内部创建 dictClient（使用 Api.dict.getDict）并挂到 proxy：
//  - proxy.dicts(codes[, { as: 'flat'|'tree', force, params }])
//  - proxy.dictLabel(code, value)

import { shallowRef } from 'vue';
import Api from '@/api';
import createDictClient from './dict-client';

export function createDictPlugin(pluginOptions = {}) {
  const {
    ttl = 5 * 60 * 1000, // 仅内存缓存；设 0 关闭
    getDict = Api?.dict?.getDict, // 如需自定义可从外部传入
    prefetch = [], // 可选：启动时预取的 codes
    fieldMap, // 如需自定义映射，可传 {label,value,id,parent,classKey}
    rootParents, // 自定义根父ID集合
  } = pluginOptions;

  if (typeof getDict !== 'function') {
    throw new Error('[dict-plugin] 未找到 Api.dict.getDict，请传入 { getDict }');
  }

  // ✅ 在插件内部创建 client
  const client = createDictClient({ getDict, ttl, fieldMap, rootParents });

  return {
    install(app) {
      // 公开个句柄（可选）
      app.config.globalProperties.$dictClient = client;
      app.provide('dictClient', client);

      // 一次获取多个字典：扁平或树
      app.config.globalProperties.dicts = (codes, opts = {}) => {
        const { as = 'flat', force = false, params } = opts;
        const out = {};
        const boxes = codes.map((code) => {
          const box = shallowRef([]);
          out[code] = box;
          return [code, box];
        });

        Promise.resolve()
          .then(async () => {
            if (as === 'tree') {
              await Promise.all(
                boxes.map(async ([code, box]) => {
                  box.value = await client.getTree(code, { force, params });
                })
              );
            } else {
              const map = await client.getMany(codes, { force, params });
              for (const [code, box] of boxes) box.value = map[code] || [];
            }
          })
          .catch(() => {
            for (const [, box] of boxes) box.value = [];
          });

        return out;
      };

      // 便捷 label 查询
      app.config.globalProperties.dictLabel = async (code, value, opts = {}) => {
        const list = await client.get(code, opts);
        return client.findLabel(list, value);
      };

      // 可选：预取
      if (prefetch.length) {
        client.getMany(prefetch).catch(() => {});
      }
    },
  };
}
