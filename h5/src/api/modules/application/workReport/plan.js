import request from '@/utils/http';

const unwrap = (res) => {
  const { code, data, msg, message } = res?.data || {};
  return { code, data, msg, message: message ?? msg };
};

export default {
  // 明细列表
  getPlanId(params) {
    return request({
      url: '/blade-bip/plan/find-plan-id-by-sn',
      method: 'get',
      params,
    }).then(unwrap);
  },
  // 详情
  getPlanDetail(params) {
    return request({
      url: '/blade-bip/plan/find-plan-id-by-plan',
      method: 'get',
      params,
    }).then(unwrap);
  },
};
