import request from '@/utils/http';

export default {
  // 文件上传
  postFile(data, params) {
    return request({
      url: '/blade-resource/oss/endpoint/put-file-attach-path',
      method: 'post',
      data,
      params,
    });
  },
};
