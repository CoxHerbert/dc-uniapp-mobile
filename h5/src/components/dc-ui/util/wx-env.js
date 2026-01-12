// utils/wx-env.js
/**
 * 判断是否为微信 / 企业微信浏览器环境（含移动端与 PC 客户端）
 * @param {string} [uaStr] 可选，自定义 UA（便于单元测试）；默认取 navigator.userAgent
 * @returns {{
 *   isWeChat: boolean,      // 是否微信内置浏览器（含 PC 客户端内置 WebView）
 *   isWeCom: boolean,       // 是否企业微信内置浏览器（含 PC 客户端内置 WebView）
 *   isPC: boolean,          // 是否 PC 版客户端内置 WebView（Windows/Mac）
 *   type: 'wechat'|'wechat_pc'|'wecom'|'wecom_pc'|'none',
 *   rawUA: string
 * }}
 */
export function detectWxEnv(uaStr) {
  const ua = (
    uaStr ||
    (typeof navigator !== 'undefined' ? navigator.userAgent : '') ||
    ''
  ).toLowerCase();

  // 先判定企业微信（其 UA 往往同时包含 MicroMessenger）
  // 常见标记：wxwork / wecom
  const isWeCom = /\b(wxwork|wecom)\b/.test(ua);

  // 微信（移动端通常包含 MicroMessenger；PC 客户端常见 WindowsWechat / MacWechat）
  const isWeChatMobile = /\bmicromessenger\b/.test(ua);
  const isWeChatPC = /\b(windowswechat|macwechat)\b/.test(ua);

  // 企业微信的 PC 端：桌面 UA 往往也带 wxwork/wecom；没有统一固定标记，这里用 isWeCom && 桌面平台 来近似
  const isDesktopPlatform = /\b(windows nt|macintosh|mac os x)\b/.test(ua);
  const isWeComPC = isWeCom && isDesktopPlatform;

  // 归并：先以企业微信优先，再到微信
  let type = 'none';
  if (isWeComPC) type = 'wecom_pc';
  else if (isWeCom) type = 'wecom';
  else if (isWeChatPC) type = 'wechat_pc';
  else if (isWeChatMobile) type = 'wechat';

  const isPC = type.endsWith('_pc');

  return Object.freeze({
    isWeChat: type === 'wechat' || type === 'wechat_pc',
    isWeCom: type === 'wecom' || type === 'wecom_pc',
    isPC,
    type,
    rawUA: ua,
  });
}

/**
 * 可选：更可靠地检测是否处于「微信小程序 Web-View」环境
 * 说明：
 *  - 同步快速判断：window.__wxjs_environment === 'miniprogram'
 *  - 最可靠：wx.miniProgram.getEnv（需在微信环境 & 已注入 JSSDK 时可用）
 * @returns {Promise<boolean>}
 */
export function isWxMiniProgram() {
  return new Promise((resolve) => {
    // 1) 同步信号（多数场景已足够）
    if (typeof window !== 'undefined' && window.__wxjs_environment === 'miniprogram') {
      resolve(true);
      return;
    }

    // 2) UA 兜底（有些环境 UA 中会带 MiniProgram）
    const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';
    if (/miniProgram/i.test(ua)) {
      resolve(true);
      return;
    }

    // 3) JSSDK 的权威检测（如可用则最准确）
    if (
      typeof window !== 'undefined' &&
      window.wx &&
      window.wx.miniProgram &&
      window.wx.miniProgram.getEnv
    ) {
      try {
        window.wx.miniProgram.getEnv((res) => {
          resolve(!!(res && (res.miniprogram || res.miniprogram === true)));
        });
      } catch {
        resolve(false);
      }
      return;
    }

    resolve(false);
  });
}
