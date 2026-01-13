export function validatenull(val) {
  if (val === undefined || val === null) return true;
  if (typeof val === 'string') return val.trim().length === 0;
  if (Array.isArray(val)) return val.length === 0;
  if (typeof val === 'object') return Object.keys(val).length === 0;
  return false;
}

export function isURL(str) {
  if (!str) return false;
  return /^https?:\/\//i.test(str);
}
