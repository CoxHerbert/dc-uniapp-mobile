import { defineStore } from 'pinia';
import request from '@/utils/http';

const toKey = (id) => (id == null ? '' : String(id));

export const useGlobalCacheStore = defineStore('global-cache', {
  state: () => ({
    globalData: {},
    queue: {},
  }),
  actions: {
    _ensureBucket(url) {
      if (!url) throw new Error('url is required');
      if (!this.globalData[url]) {
        this.globalData[url] = {};
      }
      return this.globalData[url];
    },
    _ensureQueue(url) {
      if (!this.queue[url]) {
        this.queue[url] = {
          data: [],
          timer: null,
          promises: [],
        };
      }
      return this.queue[url];
    },
    _resolvePromises(url, promises) {
      const bucket = this.globalData[url] || {};
      promises.forEach(({ resolve, data, masterKey }) => {
        const ids = Array.isArray(data) ? data : [];
        const payload = ids.map((id) => {
          const key = toKey(id);
          if (bucket[key]) return bucket[key];
          if (!key) return {};
          if (masterKey) {
            return { [masterKey]: id };
          }
          return { id };
        });
        resolve(payload);
      });
    },
    _rejectPromises(error, promises) {
      promises.forEach(({ reject }) => reject(error));
    },
    async getView({ url, data = [], masterKey }) {
      const ids = Array.isArray(data) ? data : [];
      const bucket = this._ensureBucket(url);
      const queueItem = this._ensureQueue(url);

      const existingKeys = new Set(Object.keys(bucket));
      const queuedKeys = new Set(queueItem.data.map((id) => toKey(id)));

      ids.forEach((id) => {
        const key = toKey(id);
        if (key && !existingKeys.has(key) && !queuedKeys.has(key)) {
          queueItem.data.push(id);
          queuedKeys.add(key);
        }
      });

      return new Promise((resolve, reject) => {
        queueItem.promises.push({ resolve, reject, data: ids.slice(), masterKey });
        if (!queueItem.timer) {
          queueItem.timer = setTimeout(async () => {
            const pendingData = queueItem.data.slice();
            const pendingPromises = queueItem.promises.slice();
            clearTimeout(queueItem.timer);
            delete this.queue[url];

            try {
              if (pendingData.length) {
                const res = await request({
                  url,
                  method: 'post',
                  data: pendingData,
                });
                const { code, data: responseData } = res.data || {};
                if (code !== 200) {
                  throw new Error(`Request failed with code: ${code}`);
                }
                (Array.isArray(responseData) ? responseData : []).forEach((item) => {
                  const key = masterKey ? item?.[masterKey] : item?.id;
                  if (key != null) {
                    bucket[toKey(key)] = item;
                  }
                });
              }
              this._resolvePromises(url, pendingPromises);
            } catch (error) {
              this._rejectPromises(error, pendingPromises);
            }
          }, 300);
        }
      });
    },
    async getQuery({ url, params }) {
      const bucket = this._ensureBucket(url);
      const res = await request({
        url,
        method: 'post',
        params,
      });
      const { code, data: responseData } = res.data || {};
      if (code === 200) {
        (Array.isArray(responseData) ? responseData : []).forEach((item) => {
          if (item?.id != null) {
            bucket[toKey(item.id)] = item;
          }
        });
      }
      return res;
    },
    async getList({ url, params }) {
      const bucket = this._ensureBucket(url);
      const res = await request({
        url,
        method: 'post',
        params,
      });
      const { code, data: responseData } = res.data || {};
      if (code === 200) {
        (Array.isArray(responseData) ? responseData : []).forEach((item) => {
          if (item?.id != null) {
            bucket[toKey(item.id)] = item;
          }
        });
        return responseData;
      }
      return [];
    },
  },
});
