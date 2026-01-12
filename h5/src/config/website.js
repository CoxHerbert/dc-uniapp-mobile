/**
 * 全局配置文件
 */
export default {
  title: 'saber',
  logo: '/img/logo.png',
  key: 'saber', //配置主键,目前用于存储
  indexTitle: 'BIP2.0',
  clientId: 'saber3', // 客户端id
  clientSecret: 'saber3_secret', // 客户端密钥
  tenantMode: true, // 是否开启租户模式
  tenantId: '000000', // 管理组租户编号
  captchaMode: false, // 是否开启验证码模式
  switchMode: false, // 是否开启部门切换模式
  tokenTime: 3000,
  tokenHeader: 'Blade-Auth',
  //http的status默认放行不才用统一处理的,
  statusWhiteList: [],
  //配置首页不可关闭
  setting: {
    sidebar: 'vertical',
    tag: true,
    collapse: true,
    search: true,
    lock: true,
    screenshot: true,
    fullscreen: true,
    theme: true,
    menu: true,
  },

  // 只可以设置静态路由为首页
  fistPage: {
    name: '工作台',
    path: '/desk/index',
  },
  //配置菜单的属性
  menu: {
    iconDefault: 'icon-caidan',
    label: 'name',
    path: 'path',
    icon: 'source',
    children: 'children',
    query: 'query',
    href: 'path',
    meta: 'meta',
    displayType: 'displayType',
  },
  //oauth2配置
  oauth2: {
    // 是否开启注册功能
    registerMode: true,
    // 使用后端工程 @org.springblade.test.Sm2KeyGenerator 获取
    publicKey:
      '04371300310e53c6bcce15b1b5b6b5429a30211f8cb023d97a7eeda289475cb5d024026f255affacabd06ff215287427b231643e30b0fa88c1673cebcbd91a2a1e',
    // 第三方系统授权地址
    authUrl: `${import.meta.env.VITE_APP_BASE_URL}/blade-auth/oauth/render`,
    // 单点登录系统认证(cloud端口为8100,boot端口为80)
    ssoUrl: `${
      import.meta.env.VITE_APP_BASE_URL
    }/oauth/authorize?client_id=saber3&response_type=code&redirect_uri=`,
    // 单点登录回调地址(Saber服务的登录界面地址)
    redirectUri: `${import.meta.env.VITE_APP_BASE_URL}/login`,
  },
  //设计器配置
  design: {
    // 流程设计器类型(true->nutflow,false->flowable)
    designMode: true,
    // 流程设计器地址(flowable模式)
    designUrl: `${import.meta.env.VITE_APP_DESIGN_URL}`,
    // 报表设计器地址(cloud端口为8108,boot端口为80)
    reportUrl: `${import.meta.env.VITE_APP_REPORT_URL}`,
  },
  // urlToken 免登录页面
  urlTokenWhiteList: [
    '/',
    '/login',
    '/process-priview',
    '/dashboard/projectSchedule',
    '/dashboard/commandRoom/index',
    '/dashboard/onSitePlan',
    '/dashboard/assemblyboard',
    '/dashboard/humanResources/index',
    '/desk/webviewNfdesign',
    '/dashboard/floorboard/index',
  ],
};
