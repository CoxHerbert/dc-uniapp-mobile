import request from '@/utils/http';

const unwrap = (res) => {
  const { code, data, msg, message } = res?.data || {};
  return { code, data, msg, message: message ?? msg };
};

export default {
  // 缺料查询接口
  getMaterialInfo(params) {
    return request({
      url: '/blade-bip/mps/work-schedule/get-material-info',
      method: 'get',
      params,
    }).then(unwrap);
  },
};
