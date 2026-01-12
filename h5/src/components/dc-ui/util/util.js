import cacheData from './../constant/cacheData';
import ComponentApi from './../../api/index';
import { useGlobalCacheStore } from '@/store/global-cache';

export default {
  /*
   * 获取对象实体
   * */
  async getObject({ objectName, ids }) {
    try {
      const currentObject = cacheData[objectName];
      const globalCacheStore = useGlobalCacheStore();
      let _ids;
      if (Array.isArray(ids)) {
        _ids = ids.map((item) => item?.id || item);
      } else if (typeof ids === 'object' && ids !== null) {
        try {
          _ids = [ids?.id];
        } catch (error) {
          _ids = [];
        }
      } else if (typeof ids === 'string') {
        _ids = ids.split(',');
      }
      if (!_ids?.length) return;
      await ComponentApi.cache.getView({
        url: currentObject.value.url,
        data: _ids,
      });

      const currentGlobalData = globalCacheStore.globalData[currentObject.url] || {};
      return _ids.map((id) => currentGlobalData[id] || id);
    } catch (error) {
      console.error('getObject error', error);
      return [];
    }
  },
};
