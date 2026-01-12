import request from '@/utils/http';

const unwrap = (res) => {
  const { code, data, msg, message } = res?.data || {};
  return { code, data, msg, message: message ?? msg };
};

const wksr = {
  // 明细列表
  planList(params) {
    return request({
      url: '/blade-bip/mps/Wksr/plan-list',
      method: 'get',
      params,
    }).then(unwrap);
  },
  // 计划明细
  planDetail(params) {
    return request({
      url: '/blade-bip/mps/Wksr/plan-detail',
      method: 'get',
      params,
    }).then(unwrap);
  },
  // 计划提交
  reportSave(data, params) {
    return request({
      url: '/blade-bip/mps/Wksr/report-save',
      method: 'post',
      data,
      params,
    }).then(unwrap);
  },
};

wksr.reporSavetSubmit = wksr.reportSave;

export default wksr;
