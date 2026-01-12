import request from '@/utils/http';

export default {
  // 提交入职信息
  postTalentUser(data) {
    return request({
      url: '/blade-rbac/TalentUser/submit',
      method: 'post',
      data,
    });
  },
  // 获取招收岗位列表
  getPositionLis() {
    return request({
      url: '/blade-rbac/TalentPosition/get-position-list',
      method: 'get',
    });
  },
  // 投递详情
  getDetail(params) {
    return request({
      url: '/blade-rbac/TalentUser/get-assessment-result',
      method: 'get',
      params,
    });
  },
};
