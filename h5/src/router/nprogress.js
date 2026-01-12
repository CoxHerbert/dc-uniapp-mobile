import NProgress from 'nprogress';

export function attachNProgress(router) {
  NProgress.configure({ showSpinner: false });
  router.beforeEach(() => {
    NProgress.start();
  });
  router.afterEach(() => {
    NProgress.done();
  });
}
