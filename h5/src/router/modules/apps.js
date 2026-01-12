export default {
  path: 'apps',
  component: () => import('@/views/apps/Layout.vue'),
  children: [
    {
      path: '',
      name: 'apps',
      meta: {
        title: 'routes.apps',
        icon: {
          active: '/images/layouts/icon-tabbar-工作台-选中.svg',
          inactive: '/images/layouts/icon-tabbar-工作台-未选中.svg',
        },
        tabbar: true,
        requiresAuth: true,
      },
      component: () => import('@/views/apps/index.vue'),
    },
    {
      path: 'workflow-center',
      name: 'appsWorkflowCenter',
      meta: { title: '流程中心', requiresAuth: true },
      redirect: { name: 'home' },
    },
    {
      path: 'material-tracking',
      name: 'appsMaterialTracking',
      meta: { title: '料况跟进', requiresAuth: true },
      component: () => import('@/views/apps/MaterialTracking.vue'),
    },
    {
      path: 'inbound-order',
      component: () => import('@/views/apps/InboundOrder/index.vue'),
      children: [
        {
          path: '',
          name: 'appsInboundOrder',
          meta: { title: '入库单', requiresAuth: true },
          component: () => import('@/views/apps/InboundOrder/List.vue'),
        },
        {
          path: 'create',
          name: 'appsInboundOrderCreate',
          meta: { title: '新增入库单', requiresAuth: true },
          component: () => import('@/views/apps/InboundOrder/Create.vue'),
        },
        {
          path: ':id',
          name: 'appsInboundOrderDetail',
          meta: { title: '入库单详情', requiresAuth: true },
          component: () => import('@/views/apps/InboundOrder/Detail.vue'),
        },
      ],
    },
    {
      path: 'site-planning',
      name: 'appsSitePlanning',
      meta: { title: '现场计划单', requiresAuth: true },
      component: () => import('@/views/apps/SitePlanning/Create.vue'),
    },
    {
      path: 'work-report',
      name: 'appsWorkReport',
      meta: { title: '工时汇报', requiresAuth: true },
      component: () => import('@/views/apps/WorkReport/WorkReport.vue'),
    },
    {
      path: 'out-sourcing',
      name: 'appsOutSourcing',
      meta: { title: '工序外发', requiresAuth: true },
      component: () => import('@/views/apps/OutSourcing/OutSourcing.vue'),
    },
    {
      path: 'work-report/missing-material',
      name: 'appsWorkReportMissingMaterial',
      meta: { title: '缺料明细', requiresAuth: true },
      component: () => import('@/views/apps/WorkReport/MissingMaterial.vue'),
    },
    {
      path: 'picking-confirmation',
      name: 'appsPickingConfirmation',
      meta: { title: '确认领料', requiresAuth: true },
      component: () => import('@/views/apps/PickingConfirmation/index.vue'),
    },
    {
      path: 'material-maintenance',
      name: 'appsMaterialMaintenance',
      meta: { title: '物料信息维护', requiresAuth: true },
      component: () => import('@/views/apps/MaterialMaintenance/index.vue'),
    },
    {
      path: 'wire-inspection',
      component: () => import('@/views/apps/WireInspection/index.vue'),
      children: [
        {
          path: '',
          name: 'appsWireInspection',
          meta: { title: '线材质检入库', requiresAuth: true },
          component: () => import('@/views/apps/WireInspection/List.vue'),
        },
        {
          path: 'submit',
          name: 'appsWireInspectionSubmit',
          meta: { title: '质检录入', requiresAuth: true },
          component: () => import('@/views/apps/WireInspection/Submit.vue'),
        },
      ],
    },
    {
      path: 'wire-outspection',
      component: () => import('@/views/apps/WireOutspection/index.vue'),
      children: [
        {
          path: '',
          name: 'appsWireOutspectionList',
          meta: { title: '线材质检出库', requiresAuth: true },
          component: () => import('@/views/apps/WireOutspection/list.vue'),
        },
        {
          path: 'wire-outspection',
          name: 'appsWireOutspection',
          meta: { title: '线材质检出库', requiresAuth: true },
          component: () => import('@/views/apps/WireOutspection/Submit.vue'),
        },
      ],
    },
    // {
    //   path: 'wire-outspection',
    //   name: 'appsWireOutspection',
    //   meta: { title: '线材质检出库', requiresAuth: true },
    //   component: () => import('@/views/apps/WireOutspection/Submit.vue'),
    // },
    {
      path: 'shipment-upload',
      name: 'appsShipmentUpload',
      meta: { title: '出货资料上传', requiresAuth: true },
      component: () => import('@/views/apps/ShipmentUpload.vue'),
    },
    {
      path: 'outsourcing-quotation',
      name: 'appsOutsourcingQuotation',
      meta: { title: '外协核价', requiresAuth: true },
      component: () => import('@/views/apps/OutsourcingQuotation.vue'),
    },
    {
      path: 'warehouse-record/out',
      name: 'appsWarehouseRecord',
      meta: { title: '装配工具借用', requiresAuth: true },
      component: () => import('@/views/apps/warehouseRecord/outboundOrder.vue'),
    },
    {
      path: 'warehouse-record/entry',
      name: 'appsWarehousingEntry',
      meta: { title: '装配工具归还', requiresAuth: true },
      component: () => import('@/views/apps/warehouseRecord/warehousingEntry.vue'),
    },
    {
      path: 'warehouse-record/entry/:id',
      name: 'appsWarehousingEntrySubmit',
      meta: { title: '入库提交', requiresAuth: true },
      component: () => import('@/views/apps/warehouseRecord/warehousingEntry/index.vue'),
    },
    {
      path: 'warehouse-record/outbound/:id',
      name: 'appsWarehouseRecordOutboundSubmit',
      meta: { title: '出库提交', requiresAuth: true },
      component: () => import('@/views/apps/warehouseRecord/outboundOrder/index.vue'),
    },
    {
      path: 'self-outbound',
      name: 'appsSelfOutbound',
      meta: { title: '自助出库', requiresAuth: true },
      component: () => import('@/views/apps/SelfOutbound/index.vue'),
    },
    {
      path: 'nameplate-binding',
      name: 'appsNameplateBinding',
      meta: { title: '铭牌绑定', requiresAuth: true },
      component: () => import('@/views/apps/NameplateBinding/index.vue'),
    },
  ],
};
