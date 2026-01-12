import request from '@/utils/http';

export default {
  // 入库列表
  list(params) {
    return request({
      url: '/blade-bip/dc-wms-in-stock/list',
      method: 'get',
      params,
    });
  },

  detailList(params) {
    return request({
      url: '/blade-bip/dc-wms-in-stock-detail/query-source-documents-by-type',
      method: 'get',
      params,
    });
  },
  // 入库删除 只有第一个节点可以删除
  remove(params) {
    return request({
      url: '/blade-bip/dc-wms-in-stock/remove',
      method: 'delete',
      params,
    });
  },

  // 入库详情
  detail(params) {
    return request({
      url: '/blade-bip/dc-wms-in-stock/detail',
      method: 'get',
      params,
    });
  },

  // 入库保存
  submit(data) {
    return request({
      url: '/blade-bip/dc-wms-in-stock/submit-detail',
      method: 'post',
      data,
    });
  },
  // 入库审核
  submitAudit(data) {
    return request({
      url: '/blade-bip/dc-wms-in-stock/submit-audit',
      method: 'post',
      data,
    });
  },

  // 入库驳回
  reject(data) {
    return request({
      url: '/blade-bip/dc-wms-in-stock/reject',
      method: 'post',
      data,
    });
  },

  // 单位
  unitList(params) {
    return request({
      url: '/blade-bip/dc-wms-in-stock/find-unit-list',
      method: 'get',
      params,
    });
  },

  inStockNumberList(params) {
    return request({
      url: '/blade-bip/dc-wms-in-stock-detail/query-source-documents-by-code',
      method: 'get',
      params,
    });
  },
  importExcel(data) {
    return request({
      url: '/blade-bip/dc-wms-in-stock/import-excel',
      method: 'post',
      data,
    });
  },
  // 入库明细
  outboundDetail(params) {
    return request({
      url: '/blade-bip/dc-wms-out-stock/detail',
      method: 'get',
      params,
    });
  },
};
