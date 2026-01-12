export default {
  path: 'me',
  component: () => import('@/views/account/me/Layout.vue'),
  meta: {
    title: 'routes.me',
    icon: {
      active: '/images/layouts/icon-tabbar-我的-选中.svg',
      inactive: '/images/layouts/icon-tabbar-我的-未选中.svg',
    },
    tabbar: true,
    requiresAuth: true,
  },
  children: [
    {
      path: '',
      name: 'me',
      meta: {
        title: 'routes.me',
        icon: {
          active: '/images/layouts/icon-tabbar-我的-选中.svg',
          inactive: '/images/layouts/icon-tabbar-我的-未选中.svg',
        },
        tabbar: true,
        requiresAuth: true,
      },
      component: () => import('@/views/account/Me.vue'),
    },
    {
      path: 'points',
      name: 'mePoints',
      meta: {
        title: 'routes.meChildren.points',
        requiresAuth: true,
        placeholderKey: 'me.placeholder.default',
      },
      component: () => import('@/views/account/me/Placeholder.vue'),
    },
    {
      path: 'leave',
      name: 'meLeave',
      meta: {
        title: 'routes.meChildren.leave',
        requiresAuth: true,
        placeholderKey: 'me.placeholder.default',
      },
      component: () => import('@/views/account/me/Placeholder.vue'),
    },
    {
      path: 'travel',
      name: 'meTravel',
      meta: {
        title: 'routes.meChildren.travel',
        requiresAuth: true,
        placeholderKey: 'me.placeholder.default',
      },
      component: () => import('@/views/account/me/Placeholder.vue'),
    },
    {
      path: 'overtime',
      name: 'meOvertime',
      meta: {
        title: 'routes.meChildren.overtime',
        requiresAuth: true,
        placeholderKey: 'me.placeholder.default',
      },
      component: () => import('@/views/account/me/Placeholder.vue'),
    },
    {
      path: 'punch',
      name: 'mePunch',
      meta: {
        title: 'routes.meChildren.punch',
        requiresAuth: true,
        placeholderKey: 'me.placeholder.default',
      },
      component: () => import('@/views/account/me/Placeholder.vue'),
    },
    {
      path: 'work-time',
      name: 'meWorkTime',
      meta: {
        title: 'routes.meChildren.workTime',
        requiresAuth: true,
        placeholderKey: 'me.placeholder.default',
      },
      component: () => import('@/views/account/me/WorkTime.vue'),
    },
    {
      path: 'punch-record',
      name: 'mePunchRecord',
      meta: {
        title: 'routes.meChildren.punchRecord',
        requiresAuth: true,
        placeholderKey: 'me.placeholder.default',
      },
      component: () => import('@/views/account/me/Placeholder.vue'),
    },
  ],
};
