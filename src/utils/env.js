export function isMobile() {
  try {
    const ch = navigator.userAgentData;
    if (ch && typeof ch.mobile === 'boolean') return ch.mobile;
  } catch (_) {
    // ignore
  }
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
  return /MicroMessenger/i.test(u) && !isWeCom(u);
}

export function getLoginEnv(ua) {
  if (isWeCom(ua)) return 'WECHAT_ENTERPRISE';
  if (isWeChat(ua)) return 'WECHAT_MP';
  return 'normal';
}

export const getLoginEnvSync = getLoginEnv;

export function isRendererTestEnvironment() {
  if (typeof window === 'undefined') {
    return false;
  }
  const search = window.location?.search || '';
  const hash = window.location?.hash || '';
  return /rendererCompare=true/i.test(search) || /rendererCompare=true/i.test(hash);
}
