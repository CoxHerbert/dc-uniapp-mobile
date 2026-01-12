import { useGlobalCacheStore } from '@/store/global-cache';

function getStore() {
  return useGlobalCacheStore();
}

export default {
  getView(payload) {
    return getStore().getView(payload);
  },
  getQuery(payload) {
    return getStore().getQuery(payload);
  },
  getList(payload) {
    return getStore().getList(payload);
  },
};
