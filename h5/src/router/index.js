import { createRouter, createWebHistory } from 'vue-router';
import loginModule from './modules/login';
import recruitModule from './modules/recruit';

import homeModule from './modules/home';
import appsModule from './modules/apps.js';
import meModule from './modules/me';
import settingsModule from './modules/settings';
import workflowModule from './modules/workflow';

const routes = [
  loginModule,
  recruitModule,
  settingsModule,
  workflowModule,
  {
    path: '/sop-doc/:docKey?',
    name: 'sop-doc',
    component: () => import('@/views/sop/doc.vue'),
    meta: { title: '东创知识库', requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/layouts/TabLayout.vue'),
    redirect: '/home',
    children: [homeModule, appsModule, meModule],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/NotFound.vue'),
    meta: { title: '404 - 页面不存在', requiresAuth: false },
  },
  // { path: '/:pathMatch(.*)*', redirect: '/home' },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
