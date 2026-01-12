// routes（或拆分的 routes-login.js）
export default {
  path: '/login',
  component: () => import('@/views/login/LoginLayout.vue'),
  redirect: (to) => ({ name: 'LOGIN_ACCOUNT', query: to.query }),
  children: [
    {
      path: 'account',
      name: 'LOGIN_ACCOUNT',
      component: () => import('@/views/login/account.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: 'social',
      name: 'LOGIN_SOCIAL',
      component: () => import('@/views/login/Social.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: 'userInfoTransition/:urlTicketId?', // 也支持 ?urlTicketId=xxx
      name: 'LOGIN_USER_INFO_TRANSITION',
      component: () => import('@/views/login/UserInfoTransition.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: 'transfer/:urlTicketId?', // 也支持 ?id=xxx
      name: 'LOGIN_TRANSFER',
      component: () => import('@/views/login/transfer.vue'),
      meta: { requiresAuth: false },
    },
  ],
};
