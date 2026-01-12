// src/components/dc-ui/index.js
// 目录结构：/src/components/dc-ui/<ComponentDir>/index.vue(或 index.nvue / index.uve)

const globLevel1 = import.meta.glob('/src/components/dc-ui/*/index.{vue,nvue,uve}', {
  eager: true,
});
const globDeep = import.meta.glob('/src/components/dc-ui/**/index.{vue,nvue,uve}', { eager: true });
// 合并（deep 覆盖同名更深层）
const componentModules = { ...globLevel1, ...globDeep };

function toKebabCase(name) {
  return name
    .replace(/^Dc/, '') // 去掉 Dc 前缀（可按需保留/修改）
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}

// 基于“父级文件夹名”命名组件
export const dcComponents = Object.entries(componentModules).reduce((acc, [path, mod]) => {
  const comp = mod?.default;
  if (!comp) return acc;

  const parts = path.split('/'); // e.g. /src/components/dc-ui/FooBar/index.vue
  const dirName = parts[parts.length - 2]; // => FooBar
  const compName = comp.name || dirName; // 组件名默认为目录名
  const tag = `dc-${toKebabCase(compName)}`;

  if (!comp.name) comp.name = compName; // 补 name 便于调试
  acc[tag] = comp;
  return acc;
}, {});

// 导出插件
export default {
  install(app, options = {}) {
    const prefix = typeof options.prefix === 'string' ? options.prefix : 'dc-';
    Object.entries(dcComponents).forEach(([tag, comp]) => {
      const finalTag = prefix === 'dc-' ? tag : tag.replace(/^dc-/, prefix);
      app.component(finalTag, comp);
      const aliases = Array.isArray(comp.dcAliases) ? comp.dcAliases : [];
      aliases.forEach((alias) => {
        if (typeof alias === 'string' && alias) {
          app.component(alias, comp);
        }
      });
    });
  },
};

// 调试：看看是否匹配到了文件
// console.log('dc-ui matched:', Object.keys(componentModules));
