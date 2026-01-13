import { baseUrl } from '@/config/env'

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface RequestConfig {
  url: string
  method?: RequestMethod | string
  data?: Record<string, any>
  params?: Record<string, any>
  header?: Record<string, string>
}

const buildUrl = (url: string, params?: Record<string, any>) => {
  if (!params || Object.keys(params).length === 0) return url
  const query = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')
  return url.includes('?') ? `${url}&${query}` : `${url}?${query}`
}

export default function request(config: RequestConfig) {
  const method = (config.method || 'GET').toUpperCase() as RequestMethod
  const url = buildUrl(`${baseUrl}${config.url}`, config.params)

  return new Promise<UniNamespace.RequestSuccessCallbackResult>((resolve, reject) => {
    uni.request({
      url,
      method,
      data: config.data,
      header: config.header,
      success: (res) => resolve(res),
      fail: (error) => reject(error),
    })
  })
}
