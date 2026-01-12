export default {
  path: '/settings',
  name: 'settings',
  component: () => import('@/views/settings/Index.vue'),
  meta: {
    title: 'routes.settings',
    titleFallback: '设置',
    requiresAuth: false,
  },
};
