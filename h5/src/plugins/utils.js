// src/plugins/utils.js
import { showToast } from 'vant';

export function assetUrl(p) {
  if (!p) return '';
  const s = String(p);

  // 1) 完整 URL 直接返回
  if (/^(https?:)?\/\//i.test(s)) return s;

  // 2) 规范化 base（确保以 / 结尾）
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '') + '/';

  // 3) 去掉前导 /，防止出现 //images/…
  const clean = s.replace(/^\/+/, '');

  return base + clean;
}

// 绝对 URL 生成器
function absoluteUrl(u) {
  if (!u) return '';
  const s = String(u);
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/')) return `${location.origin}${s}`;
  return `${location.origin}/${s}`;
}

// 文件预览 URL（拼接 VITE_FILE_URL 并 base64 编码原始地址）
import { Base64 } from 'js-base64';

export function previewUrl(raw) {
  const abs = absoluteUrl(raw);
  if (!abs) return '';
  const base = import.meta.env.VITE_FILE_URL + '?url=';
  return base + encodeURIComponent(Base64.encode(abs));
}

export function copyText(text) {
  if (!navigator.clipboard) {
    // 兼容旧版浏览器
    const input = document.createElement('textarea');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  } else {
    navigator.clipboard.writeText(text);
  }
  showToast('已复制:' + text);
}
