import { baseUrl } from '@/config/env';
import website from '@/config/website';
import { getToken } from '@/utils/auth';

function resolveUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (!baseUrl) return url;
  return `${baseUrl}${url}`;
}

export function request(options = {}) {
  const {
    url,
    method = 'GET',
    data,
    params,
    headers = {},
    authorization = true,
  } = options;

  const token = getToken();
  const header = { ...headers };
  if (authorization && token) {
    header[website.tokenHeader] = `bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: resolveUrl(url),
      method,
      data: data || params,
      header,
      success: (res) => resolve(res),
      fail: (err) => reject(err),
    });
  });
}

request.get = (url, options = {}) => request({ ...options, url, method: 'GET' });
request.post = (url, data, options = {}) => request({ ...options, url, method: 'POST', data });
