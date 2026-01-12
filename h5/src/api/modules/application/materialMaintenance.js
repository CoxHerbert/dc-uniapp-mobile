import request from '@/utils/http';

export default {
  // 明细列表
  load(params) {
    return request({
      url: '/api/blade-bip/scmMaterial/info/load',
      method: 'get',
      params,
    });
  },
  // 详情
  update(params) {
    return request({
      url: '/api/blade-bip/scmMaterial/info/update',
      method: 'post',
      data: params,
    });
  },
  getFileById(params) {
    return request({
      url: '/api/blade-resource/attach/detail-by-id',
      method: 'get',
      params,
    });
  },
  getList(params) {
    return request({
      url: '/api/blade-bip/ScmMaterial/list',
      method: 'get',
      params,
    });
  },

  // 添加和修改
  submit(data) {
    return request({
      url: '/api/blade-bip/ScmMaterial/submit',
      method: 'post',
      data,
    });
  },

  // 详情
  getDetail(params) {
    return request({
      url: '/api/blade-bip/ScmMaterial/detail',
      method: 'get',
      params,
    });
  },

  // 审核
  toExamine(data) {
    return request({
      url: '/api/blade-bip/ScmMaterial/material-update',
      method: 'post',
      data,
    });
  },

  // 删除
  remove(ids) {
    return request({
      url: '/api/blade-bip/ScmMaterial/material-remove',
      method: 'post',
      params: {
        ids,
      },
    });
  },
};
