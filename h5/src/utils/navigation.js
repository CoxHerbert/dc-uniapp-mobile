export function goBackOrHome(router, fallback = '/home') {
  if (!router) {
    console.warn('[goBackOrHome] router instance is required');
    return;
  }

  if (fallback) {
    router.replace(fallback);
  } else {
    router.back();
  }
}
