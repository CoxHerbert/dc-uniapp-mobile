import request from '@/utils/http';

export default {
  // 企微推送卡片消息
  sendWechatMessage(data) {
    return request({
      url: '/blade-bip/feign/client/wechat/message/send',
      method: 'post',
      data,
    });
  },
};
