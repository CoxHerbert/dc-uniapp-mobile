// src/utils/env.js
export function isMobile() {
  try {
    const ch = navigator.userAgentData;
    if (ch && typeof ch.mobile === 'boolean') return ch.mobile;
  } catch (_) {}
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
}

function getUA(ua) {
  if (ua) return String(ua);
  if (typeof navigator === 'undefined') return '';
  return navigator.userAgent || '';
}

export function isWeCom(ua) {
  return /(wxwork|WeCom)/i.test(getUA(ua));
}

export function isWeChat(ua) {
  const u = getUA(ua);
  // 识别微信但排除企业微信
  return /MicroMessenger/i.test(u) && !isWeCom(u);
}

/**
 * 同步环境识别
 * 返回值：'WECHAT_ENTERPRISE' | 'WECHAT_MP' | 'normal'
 */
export function getLoginEnv(ua) {
  if (isWeCom(ua)) return 'WECHAT_ENTERPRISE';
  if (isWeChat(ua)) return 'WECHAT_MP';
  return 'normal';
}

// 若项目里曾用过 getLoginEnvSync，这里做个别名兼容
export const getLoginEnvSync = getLoginEnv;

export function isRendererTestEnvironment() {
  if (typeof window === 'undefined') {
    return false;
  }
  const search = window.location?.search || '';
  const hash = window.location?.hash || '';
  return /rendererCompare=true/i.test(search) || /rendererCompare=true/i.test(hash);
}
