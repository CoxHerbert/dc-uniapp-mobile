export default {
  path: 'home',
  name: 'home',
  meta: {
    title: 'routes.home',
    icon: {
      active: '/images/layouts/icon-tabbar-首页-选中.svg',
      inactive: '/images/layouts/icon-tabbar-首页-未选中.svg',
    },
    tabbar: true,
    requiresAuth: true,
  },
  component: () => import('@/views/plugin/workflow/pages/workbench/index.vue'),
};
