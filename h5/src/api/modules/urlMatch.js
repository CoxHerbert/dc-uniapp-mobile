import request from '@/utils/http';

export default {
  // 查询并更新访问记录
  updateByCode(params) {
    return request({
      url: '/blade-message/url-match/get-and-update-by-code',
      method: 'GET',
      params,
    });
  },
};
