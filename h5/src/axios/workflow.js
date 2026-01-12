import request from '@/utils/http';

const requestWorkFlow = (option) => {
  return new Promise((resolve, reject) => {
    request(option)
      .then((res) => {
        const { data } = res;
        resolve(data);
      })
      .catch((err) => reject(err));
  });
};

export default requestWorkFlow;
