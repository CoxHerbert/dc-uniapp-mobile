// src/modules/inventory.js
import request from '@/utils/http';
import planSheep from './planSheep';
import workReport from './workReport';
import materialMaintenance from './materialMaintenance';
import wireInspection from './wireInspection';
import nameplateBinding from './nameplateBinding';
import outboundOrder from './outboundOrder';
import warehousingEntry from './warehousingEntry';

export default {
  planSheep,
  workReport,
  materialMaintenance,
  wireInspection,
  nameplateBinding,
  outboundOrder,
  warehousingEntry,
  // 入库单列表
  inventoryList(params) {
    return request({
      url: '/blade-bip/dc-wms-in-stock/list',
      method: 'get',
      params,
    });
  },

  // 入库单详情
  inventoryDetail(params) {
    return request({
      url: '/blade-bip/dc-wms-in-stock/detail',
      method: 'get',
      params,
    });
  },

  // 根据单据查询入库单详情
  detailByInStockNumber(params) {
    return request({
      url: '/blade-bip/dc-wms-in-stock-detail/query-source-documents-by-type',
      method: 'get',
      params,
    });
  },

  // 入库单审核通过
  inventoryAudit(data) {
    return request({
      url: '/blade-bip/dc-wms-in-stock/submit-audit',
      method: 'post',
      data,
    });
  },

  // 入库单审核驳回
  inventoryAuditReject(data) {
    return request({
      url: '/blade-bip/dc-wms-in-stock/reject',
      method: 'post',
      data,
    });
  },

  // 入库单保存
  inventoryAdd(data) {
    return request({
      url: '/blade-bip/dc-wms-in-stock/submit-detail',
      method: 'post',
      data,
    });
  },

  // 用户列表
  userList(data) {
    return request({
      url: '/blade-bip/bip-blade-user/select-data',
      method: 'post',
      data,
    });
  },
};
