import request from '@/utils/http';

export default {
  // 列表
  list(params) {
    return request({
      url: '/blade-bip/WireQc/list',
      method: 'get',
      params,
    });
  },

  // 获取图纸内容
  getDrawContent(params) {
    return request({
      url: '/blade-bip/WireQc/get-draw-content',
      method: 'get',
      params,
    });
  },

  // 批量保存质检单
  batchSave(data) {
    return request({
      url: '/blade-bip/WireQc/batch-save',
      method: 'post',
      data,
    });
  },

  // 根据二维码查询库位信息
  searchByQrcode(params) {
    return request({
      url: '/blade-bip/dc-wms-warehouse-location/search-by-qrcode',
      method: 'get',
      params,
    });
  },
  // 线裁质检入库
  inChangExecute(data) {
    return request({
      url: '/blade-bip/WireExecute/inChangExecute',
      method: 'post',
      data,
    });
  },

  // 线裁质检出库
  outChangExecute(data) {
    return request({
      url: '/blade-bip/WireExecute/outChangExecute',
      method: 'post',
      data,
    });
  },

  // 库存查询
  searchProduct(params) {
    return request({
      url: '/blade-bip/dc-wms-common/list',
      method: 'get',
      params,
    });
  },
};
