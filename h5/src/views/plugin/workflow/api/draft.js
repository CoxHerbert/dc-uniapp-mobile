import request from '@/utils/http';

const prefix = '/blade-workflow/app/draft';

export const getDetail = (params) => {
  return new Promise((reslove, reject) => {
    request({
      url: `${prefix}/detail`,
      method: 'get',
      params,
    })
      .then((res) => {
        const data = res.data;
        reslove(data);
      })
      .catch((err) => reject(err));
  });
};

export const submit = (row) => {
  return new Promise((reslove, reject) => {
    request({
      url: `${prefix}/submit`,
      method: 'post',
      data: row,
    })
      .then((res) => {
        const data = res.data;
        reslove(data);
      })
      .catch((err) => reject(err));
  });
};
