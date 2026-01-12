/**
 * 下载工具类
 * - 支持完整 URL / 相对路径
 * - 支持配置 previewBaseDomain（去掉环境前缀）
 * - 支持加 /api 代理前缀
 * - 自动处理中文/空格等特殊字符
 */

export const DownloadUtil = {
  /**
   * 构建 path 与 apiPath
   * @param {string} rawUrlOrPath 完整 URL 或相对路径
   * @param {object} opts 配置
   * @param {string} [opts.previewBaseDomain] 预览域名前缀 (如 http://ip:port/000000-dev)
   * @param {string} [opts.apiPrefix='/api'] 代理前缀
   * @returns {{ path: string, apiPath: string }}
   */
  buildPaths(rawUrlOrPath, opts = {}) {
    const apiPrefix = (opts.apiPrefix || '/api').replace(/\/+$/, '');
    const base = (opts.previewBaseDomain || '').replace(/\/+$/, '');

    let input = String(rawUrlOrPath || '').trim();
    let relPath = '';

    // 完整 URL
    if (/^https?:\/\//i.test(input)) {
      if (base && input.toLowerCase().startsWith(base.toLowerCase())) {
        const rest = input.slice(base.length);
        relPath = rest.replace(/^\/+/, '');
      } else {
        try {
          const u = new URL(input);
          relPath = u.pathname.replace(/^\/+/, '');
        } catch {
          relPath = input.replace(/^\/+/, '');
        }
      }
    } else {
      // 相对路径
      relPath = input.replace(/^\/+/, '');
    }

    relPath = relPath.replace(/\/{2,}/g, '/'); // 规范化

    return {
      path: relPath,
      apiPath: `${apiPrefix}/${relPath}`,
    };
  },

  /**
   * 用于 <a href> 的安全编码
   * @param {string} path
   * @returns {string}
   */
  encodeForHref(path) {
    return encodeURI(path);
  },

  /**
   * 触发下载
   * @param {string} rawUrlOrPath 原始 URL 或路径
   * @param {object} opts 同 buildPaths 配置
   * @param {string} [filename] 下载文件名
   */
  download(rawUrlOrPath, opts = {}, filename = '') {
    const { apiPath } = this.buildPaths(rawUrlOrPath, opts);
    const href = this.encodeForHref(apiPath);

    try {
      const a = document.createElement('a');
      a.href = href;
      a.download = filename || '';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(href, '_blank');
    }
  },
};
