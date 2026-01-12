// src/router/modules/workflow.js

export default {
  path: '/plugin/workflow',
  name: 'workflow',
  children: [
    {
      path: 'workbench',
      name: 'WorkflowWorkbench',
      meta: { title: '工作台' },
      component: () => import('@/views/plugin/workflow/pages/workbench/index.vue'),
    },
    {
      path: 'create',
      name: 'WorkflowCreate',
      meta: { title: '新建流程' },
      component: () => import('@/views/plugin/workflow/pages/create/index.vue'),
    },
    {
      path: 'mine',
      name: 'WorkflowMine',
      meta: { title: '我的事务' },
      component: () => import('@/views/plugin/workflow/pages/mine/index.vue'),
    },
    {
      path: 'warehouse',
      name: 'WorkflowWarehouse',
      meta: { title: '仓库' },
      component: () => import('@/views/plugin/workflow/pages/warehouse/index.vue'),
    },

    // ===== 表单相关 =====
    {
      path: 'form',
      name: 'WorkflowForm',
      children: [
        {
          path: 'start',
          name: 'WorkflowFormStart',
          meta: { title: '发起流程' },
          component: () => import('@/views/plugin/workflow/pages/form/start.vue'),
        },
        {
          path: 'detail',
          name: 'WorkflowFormDetail',
          meta: { title: '流程详情' },
          component: () => import('@/views/plugin/workflow/pages/form/detail.vue'),
        },
      ],
    },

    // ===== 外部 - 请假相关 =====
    {
      path: 'external',
      name: 'WorkflowExternal',
      children: [
        {
          path: 'leave',
          name: 'WorkflowExternalLeave',
          children: [
            {
              path: 'start',
              name: 'WorkflowExternalLeaveStart',
              meta: { title: '发起流程' },
              component: () => import('@/views/plugin/workflow/pages/external/Leave/start.vue'),
            },
            {
              path: 'detail',
              name: 'WorkflowExternalLeaveDetail',
              meta: { title: '流程详情' },
              component: () => import('@/views/plugin/workflow/pages/external/Leave/detail.vue'),
            },
          ],
        },
      ],
    },
  ],
};
