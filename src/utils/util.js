export const serialize = (data) => {
  const list = [];
  Object.keys(data || {}).forEach((key) => {
    list.push(`${key}=${data[key]}`);
  });
  return list.join('&');
};

export function tansParams(params) {
  let result = '';
  Object.keys(params || {}).forEach((propName) => {
    const value = params[propName];
    const part = encodeURIComponent(propName) + '=';
    if (value !== null && value !== '' && typeof value !== 'undefined') {
      if (typeof value === 'object') {
        Object.keys(value).forEach((key) => {
          if (value[key] !== null && value[key] !== '' && typeof value[key] !== 'undefined') {
            const item = `${propName}[${key}]`;
            const subPart = encodeURIComponent(item) + '=';
            result += subPart + encodeURIComponent(value[key]) + '&';
          }
        });
      } else {
        result += part + encodeURIComponent(value) + '&';
      }
    }
  });
  if (typeof result === 'string') result = result.replace(/&$/, '');
  return result;
}
