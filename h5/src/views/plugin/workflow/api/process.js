import request from '@/utils/http';

const prefix = '/blade-workflow/app/process';

/**
 * 流程详情
 */
export const detail = (params) => {
  return new Promise((reslove, reject) => {
    request({
      url: `/blade-workflow/process/detail`,
      method: 'GET',
      params,
    })
      .then((res) => {
        const data = res.data;
        reslove(data);
      })
      .catch((err) => reject(err));
  });
};

// 可发起流程列表
export const list = (params) => {
  return new Promise((reslove, reject) => {
    request({
      url: `${prefix}/list`,
      method: 'GET',
      params,
    })
      .then((res) => {
        const data = res.data;
        reslove(data);
      })
      .catch((err) => reject(err));
  });
};

// 待办列表
export const todoList = (params) => {
  return new Promise((reslove, reject) => {
    request({
      url: `${prefix}/todoList`,
      method: 'GET',
      params,
    })
      .then((res) => {
        const data = res.data;
        reslove(data);
      })
      .catch((err) => reject(err));
  });
};

// 办结列表
export const doneList = (params) => {
  return new Promise((reslove, reject) => {
    request({
      url: `${prefix}/doneList`,
      method: 'GET',
      params,
    })
      .then((res) => {
        const data = res.data;
        reslove(data);
      })
      .catch((err) => reject(err));
  });
};

// 我的已办列表
export const myDoneList = (params) => {
  return new Promise((reslove, reject) => {
    request({
      url: `${prefix}/myDoneList`,
      method: 'GET',
      params,
    })
      .then((res) => {
        const data = res.data;
        reslove(data);
      })
      .catch((err) => reject(err));
  });
};

// 我的申请列表
export const sendList = (params) => {
  return new Promise((reslove, reject) => {
    request({
      url: `${prefix}/sendList`,
      method: 'GET',
      params,
    })
      .then((res) => {
        const data = res.data;
        reslove(data);
      })
      .catch((err) => reject(err));
  });
};

// 待签列表
export const claimList = (params) => {
  return new Promise((reslove, reject) => {
    request({
      url: `${prefix}/claimList`,
      method: 'GET',
      params,
    })
      .then((res) => {
        const data = res.data;
        reslove(data);
      })
      .catch((err) => reject(err));
  });
};
