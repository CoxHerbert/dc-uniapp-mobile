import { useGlobalCacheStore } from '@/store/global-cache';

const getGlobalCacheStore = () => {
  const store = useGlobalCacheStore();
  if (!store) {
    throw new Error('Global cache store is not initialized');
  }
  return store;
};

export default {
  getView(options) {
    const store = getGlobalCacheStore();
    return store.getView(options);
  },
  getQuery(options) {
    const store = getGlobalCacheStore();
    return store.getQuery(options);
  },
  getList(options) {
    const store = getGlobalCacheStore();
    return store.getList(options);
  },
};
