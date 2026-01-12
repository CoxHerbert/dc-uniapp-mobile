import request from '@/utils/http';

export default {
  detail(params) {
    return request({
      url: '/blade-bip/mmr-plan-order-phase/detail',
      method: 'get',
      params,
    });
  },
  submit(data) {
    return request({
      url: '/blade-bip/mmr-plan-order-phase/submit',
      method: 'post',
      data,
    });
  },
};
