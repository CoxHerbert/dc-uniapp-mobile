import website from '@/config/website';
import { baseUrl } from '@/config/env';
import { encodeBase64 } from '@/utils/base64';
import { getToken } from '@/utils/auth';

const isAbsoluteUrl = (url) => /^https?:\/\//i.test(url);

const buildQuery = (params = {}) => {
  const keys = Object.keys(params);
  if (keys.length === 0) return '';
  return keys
    .map((key) => {
      const value = params[key];
      if (value === undefined || value === null) return null;
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .filter(Boolean)
    .join('&');
};

const normalizeUrl = (url, params) => {
  const query = buildQuery(params);
  if (!query) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}${query}`;
};

const getResponseStatus = (res) => {
  return res?.data?.error_code ?? res?.data?.code ?? res?.statusCode;
};

export default function request({
  url,
  method = 'GET',
  data,
  params,
  headers = {},
  authorization = true,
  withToken = true,
}) {
  const finalUrl = normalizeUrl(isAbsoluteUrl(url) ? url : `${baseUrl}${url}`, params);
  const requestHeaders = {
    'Blade-Requested-With': 'BladeHttpRequest',
    ...headers,
  };

  if (authorization) {
    requestHeaders.Authorization = `Basic ${encodeBase64(
      `${website.clientId}:${website.clientSecret}`
    )}`;
  }

  if (withToken) {
    const token = getToken();
    if (token) {
      requestHeaders[website.tokenHeader] = `bearer ${token}`;
    }
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: finalUrl,
      method,
      data,
      header: requestHeaders,
      success: (res) => {
        const status = getResponseStatus(res);
        if (status === 200 || status === 0 || status === undefined) {
          resolve(res.data ?? res);
          return;
        }
        const message = res?.data?.msg || res?.data?.error_description || '请求失败';
        reject(new Error(message));
      },
      fail: (err) => {
        reject(new Error(err?.errMsg || '网络异常'));
      },
    });
  });
}
