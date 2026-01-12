export function readCallbackUrlFromRoute(route, key = 'callbackUrl') {
  if (!route) return null;
  let raw = route.query?.[key] ?? route.params?.[key];

  if (Array.isArray(raw)) raw = raw[0];
  if (raw == null) return null;

  try {
    return decodeURIComponent(String(raw));
  } catch {
    return String(raw);
  }
}

export function readCallbackUrlFromLocation(key = 'callbackUrl') {
  if (typeof window === 'undefined') return null;

  const s1 = new URLSearchParams(window.location.search).get(key);
  if (s1) {
    try {
      return decodeURIComponent(s1);
    } catch {
      return s1;
    }
  }

  const hash = window.location.hash || '';
  const qIndex = hash.indexOf('?');
  if (qIndex >= 0) {
    const s2 = new URLSearchParams(hash.slice(qIndex + 1)).get(key);
    if (s2) {
      try {
        return decodeURIComponent(s2);
      } catch {
        return s2;
      }
    }
  }
  return null;
}

export function getCallbackUrl(route, key = 'callbackUrl') {
  return readCallbackUrlFromRoute(route, key) ?? readCallbackUrlFromLocation(key);
}
