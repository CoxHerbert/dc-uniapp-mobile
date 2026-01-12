export function isWeCom(ua) {
  const agent = ua || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  return /(wxwork|WeCom)/i.test(agent);
}

export function isWeChat(ua) {
  const agent = ua || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  return /MicroMessenger/i.test(agent) && !isWeCom(agent);
}

export function getLoginEnv(ua) {
  if (isWeCom(ua)) return 'WECHAT_ENTERPRISE';
  if (isWeChat(ua)) return 'WECHAT_MP';
  return 'normal';
}
