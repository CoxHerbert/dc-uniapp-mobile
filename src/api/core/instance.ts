import AdapterUniapp from '@alova/adapter-uniapp'
import { createAlova } from 'alova'
import vueHook from 'alova/vue'
import { handleAlovaError, handleAlovaResponse } from './handlers'

export const alovaInstance = createAlova({
  baseURL: import.meta.env.VITE_APP_API || import.meta.env.VITE_API_BASE_URL || 'https://petstore3.swagger.io/api/v3',
  ...AdapterUniapp(),
  statesHook: vueHook,
  beforeRequest: (method) => {
    if (['POST', 'PUT', 'PATCH'].includes(method.type)) {
      method.config.headers['Content-Type'] = 'application/json'
    }

    if (method.type === 'GET' && CommonUtil.isObj(method.config.params)) {
      method.config.params._t = Date.now()
    }

    if (import.meta.env.MODE === 'development') {
      console.log(`[Alova Request] ${method.type} ${method.url}`, method.data || method.config.params)
      console.log(`[API Base URL] ${import.meta.env.VITE_APP_API || import.meta.env.VITE_API_BASE_URL}`)
    }
  },

  responded: {
    onSuccess: handleAlovaResponse,
    onError: handleAlovaError,
    onComplete: async () => {},
  },

  timeout: 60000,
  cacheFor: null,
})

export default alovaInstance
