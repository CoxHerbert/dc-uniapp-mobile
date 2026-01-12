import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve as pathResolve } from 'path';
import dayjs from 'dayjs';
import { createRequire } from 'module';
import * as fs from 'fs';

const require = createRequire(import.meta.url);

// —— 从 node_modules 的 package.json 读取版本号 —— //
function getPkgVersion(pkgName) {
  try {
    const pkgJsonPath = require.resolve(`${pkgName}/package.json`);
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

const sanitize = (s) => s.replace(/[@/\\]+/g, '_').replace(/[^\w-]/g, '_');

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const { VITE_APP_ENV, VITE_APP_BASE_URL, VITE_APP_API, VITE_WEIGHT } = env;

  const isProd = VITE_APP_ENV === 'production';
  const currentTimeVersion = Date.now();
  const buildTimestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');

  // 生产默认用 /mobile/，也可用 VITE_BASE 覆盖
  const base = env.VITE_BASE;

  return defineConfig({
    plugins: [
      vue({
        template: {
          transformAssetUrls: {
            // 关键：不要转换以 / 开头的绝对路径
            includeAbsolute: false,
          },
        },
      }),
    ],
    base,
    define: {
      'import.meta.env.VITE_APP_VERSION': currentTimeVersion,
      'import.meta.env.VITE_APP_BUILD_TIME': JSON.stringify(buildTimestamp),
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/styles/_variables.scss" as *;\n',
        },
      },
    },
    resolve: {
      alias: {
        '~': pathResolve(__dirname, './'),
        '@': pathResolve(__dirname, './src'),
        '~@': pathResolve(__dirname, './src'),
        '@public': pathResolve(__dirname, './public'),
      },
    },
    server: {
      host: true,
      port: 5174,
      open: true,
      allowedHosts: ['test.eastwinbip.com', '.eastwinbip.com'],
      hmr: {
        host: 'test.eastwinbip.com',
      },
      proxy: {
        // 业务接口
        [VITE_APP_API]: {
          target: VITE_APP_BASE_URL,
          changeOrigin: true,
          rewrite: (p) => p.replace(VITE_APP_API, ''),
        },
        '/graphql/wiki': {
          target: 'https://wiki.eastwinbip.com/graphql',
          changeOrigin: true,
          rewrite: (p) => p.replace('/graphql/wiki', ''),
        },
        '/weight': {
          target: `${VITE_WEIGHT}/weight`,
          changeOrigin: true,
          // ✅ 确保只替换路径开头
          rewrite: (p) => p.replace(/^\/weight/, ''),
        },
        '/socket.io': {
          target: `${VITE_WEIGHT}/socket.io`,
          changeOrigin: true,
        },
        // 稳一点的超时设置
        // timeout: 300000,
        // proxyTimeout: 300000,
        // configure(proxy) {
        //   proxy.on('error', (err, req) => {
        //     console.error('[proxy error:/api]', req.url, err?.code, err?.message);
        //   });
        // },
      },
    },
    // ✅ outDir 正确位置
    build: {
      target: 'esnext',
      minify: isProd ? 'terser' : 'esbuild',
      cssCodeSplit: true, // 确保每个 chunk 的 CSS 独立产出
      outDir: `${dayjs().format('YYYY-MM-DD-HH-mm')}-${VITE_APP_ENV}-mobile`,
      rollupOptions: {
        // 如果你要走 CDN，这里再配 external/paths；本例本地打包，所以注释
        // external: Object.keys(esmCdnMap),
        // output: { paths: esmCdnMap, ... }

        output: {
          // 业务入口：带 hash
          entryFileNames: '[name].[hash].js',

          // 第三方（pkg-）chunk：不带 hash；业务 chunk：带 hash
          chunkFileNames(chunkInfo) {
            return chunkInfo.name?.startsWith('pkg-')
              ? 'chunks/[name].js'
              : 'chunks/[name].[hash].js';
          },

          // 静态资源：
          // - 依赖包 CSS（以 pkg- 开头且含版本号） -> 无 hash，便于强缓存
          // - 其他资源 -> 带 hash（业务/公共）
          assetFileNames(assetInfo) {
            const name = assetInfo.name || '';
            const isCss = name.endsWith('.css');
            const isPkgCss = isCss && /^pkg-[\w@-]+-\d/.test(name);
            return isPkgCss
              ? 'assets/[name][extname]' // e.g. assets/pkg-echarts-5.5.1.css
              : 'assets/[name].[hash][extname]'; // 业务/其它：带 hash
          },

          // —— 每个依赖一个独立 chunk + 文件名带版本号 —— //
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            // 取出一级包名（支持作用域包）
            const afterNm = id.split('node_modules/')[1];
            const segs = afterNm.split('/');
            const pkgName = segs[0].startsWith('@') ? `${segs[0]}/${segs[1]}` : segs[0];

            const version = getPkgVersion(pkgName);
            const safeName = sanitize(pkgName);
            const safeVer = sanitize(version);

            // e.g. chunks/pkg-echarts-5.5.1.js
            return `pkg-${safeName}-${safeVer}`;
          },
        },
      },
    },
  });
};
