import Api from '@/api';

const pad = (value) => `${value}`.padStart(2, '0');

export const formatDateLabel = (date = new Date()) => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}年${month}月${day}日`;
};

export const buildMessageUrl = (path) => {
  const normalizedPath = path?.startsWith('/') ? path : `/${path || ''}`;
  const base = `${window.location.origin}${import.meta.env.BASE_URL || '/'}`;
  return `${base.replace(/\/$/, '')}${normalizedPath}`;
};

export const fetchUserJobNum = async (userId) => {
  if (!userId) return null;
  const res = await Api.user.getUser(userId);
  const user = res?.data?.data || {};
  return user?.account || user?.userInfo?.account || user?.user?.account || null;
};

export const sendWechatTextCard = async ({ jobNums, title, description, url, btnText }) => {
  if (!Array.isArray(jobNums) || jobNums.length === 0) return;
  return Api.message.sendWechatMessage({
    jobNums,
    deptCodes: [],
    msgtype: 'textcard',
    textcard: {
      title,
      description,
      url,
      btntxt: btnText || '更多',
    },
  });
};
