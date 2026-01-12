import request from '@/utils/http';

const prefix = '/blade-workflow/app/task';
const processPrefix = '/blade-workflow/process';

// 获取流程发起表单
export const getFormByProcessDefId = (params) => {
  return new Promise((reslove, reject) => {
    request({
      url: `${prefix}/getFormByProcessDefId`,
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

// 流程详情
export const detail = (params) => {
  return new Promise((reslove, reject) => {
    request({
      url: `${prefix}/detail`,
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

// 发起流程
export const startProcess = (data) => {
  return new Promise((reslove, reject) => {
    request({
      url: `${prefix}/startProcess`,
      method: 'POST',
      data,
    })
      .then((res) => {
        const data = res.data;
        reslove(data);
      })
      .catch((err) => reject(err));
  });
};

// 完成任务
export const completeTask = (data) => {
  return new Promise((reslove, reject) => {
    request({
      url: `${processPrefix}/completeTask`,
      method: 'POST',
      data,
    })
      .then((res) => {
        const data = res.data;
        reslove(data);
      })
      .catch((err) => reject(err));
  });
};

// 转办任务
export const transferTask = (data) => {
  return new Promise((reslove, reject) => {
    request({
      url: `${prefix}/transferTask`,
      method: 'POST',
      data,
    })
      .then((res) => {
        const data = res.data;
        reslove(data);
      })
      .catch((err) => reject(err));
  });
};

// 委托任务
export const delegateTask = (data) => {
  return new Promise((reslove, reject) => {
    request({
      url: `${prefix}/delegateTask`,
      method: 'POST',
      data,
    })
      .then((res) => {
        const data = res.data;
        reslove(data);
      })
      .catch((err) => reject(err));
  });
};

// 签收任务（签收成功后回到待办任务中）
export const claimTask = (data) => {
  return new Promise((reslove, reject) => {
    request({
      url: `${prefix}/claimTask`,
      method: 'POST',
      data,
    })
      .then((res) => {
        const data = res.data;
        reslove(data);
      })
      .catch((err) => reject(err));
  });
};

// 获取可退回节点
export const getBackNodes = (params) => {
  return new Promise((reslove, reject) => {
    request({
      url: `${prefix}/getBackNodes`,
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

// 退回到指定节点
export const rollbackTask = (data) => {
  return new Promise((reslove, reject) => {
    request({
      url: `${prefix}/rollbackTask`,
      method: 'POST',
      data,
    })
      .then((res) => {
        const data = res.data;
        reslove(data);
      })
      .catch((err) => reject(err));
  });
};

// 终止流程
export const terminateProcess = (data) => {
  return new Promise((reslove, reject) => {
    request({
      url: `${prefix}/terminateProcess`,
      method: 'POST',
      data,
    })
      .then((res) => {
        const data = res.data;
        reslove(data);
      })
      .catch((err) => reject(err));
  });
};

// 加签
export const addMultiInstance = (data) => {
  return new Promise((reslove, reject) => {
    request({
      url: `${prefix}/addMultiInstance`,
      method: 'POST',
      data,
    })
      .then((res) => {
        const data = res.data;
        reslove(data);
      })
      .catch((err) => reject(err));
  });
};

// 撤回/撤销
export const withdrawTask = (data) => {
  return new Promise((reslove, reject) => {
    request({
      url: `${prefix}/withdrawTask`,
      method: 'POST',
      data,
    })
      .then((res) => {
        const data = res.data;
        reslove(data);
      })
      .catch((err) => reject(err));
  });
};
