export default {
  login: {
    brand: {
      slogan: '同心合力，助力生产',
    },
    language: {
      title: '语言',
      cancel: '取消',
    },
    form: {
      username: {
        placeholder: '请输入手机号或工号',
        required: '请输入用户名',
      },
      password: {
        placeholder: '请输入密码',
        required: '请输入密码',
      },
    },
    button: {
      submit: '登录',
      loading: '登录中…',
    },
    toast: {
      success: '登录成功',
      fail: '登录失败，请重试',
    },
    social: {
      title: '欢迎登录',
      subtitle: '为你提供统一、便捷、安全的登录体验',
      loading: '正在登录中…',
      errors: {
        missingRedirect: '授权返回缺少跳转地址',
        missingToken: '登录失败：未获取到 access_token',
        initAccount: '初始化账号失败，请稍后重试',
        generic: '登录失败，请使用账号密码登录',
      },
      goAccountLogin: '前往账号密码登录',
      retry: '重试',
      fallbackTitle: '登录失败',
      fallbackDesc: '无法完成第三方登录，你可以使用账号密码登录。',
    },
    ticketTransfer: {
      title: '正在准备工作环境',
      subtitle: '解析跳转参数中…',
      status: {
        loading: '正在解析参数',
        success: '解析成功',
        error: '解析失败',
      },
      hints: {
        loading: '正在读取并解析 urlTicketId',
        success: '即将跳转到目标页面',
        error: '请返回重试或联系管理员',
      },
      errors: {
        missingTicket: '缺少 urlTicketId',
        server: '服务端返回失败',
        missingUrl: '未返回 h5Url',
        unknown: '未知错误',
      },
    },
    userInfoTransition: {
      title: '正在准备工作环境',
      subtitle: '获取并保存用户信息',
      status: {
        loading: '正在拉取资料',
        success: '获取成功',
        error: '获取失败',
      },
      hints: {
        loading: '包含头像、昵称、手机号、组织等字段',
        success: '已写入本地缓存',
        error: '请返回重试或联系管理员',
      },
      progress: {
        label: '进度',
      },
      steps: {
        readTicket: '读取路由 urlTicketId',
        fetchUser: '请求用户信息',
        persist: '本地存储',
        redirect: '跳转目标页',
      },
      stepTags: {
        done: '完成',
        doing: '进行中',
        error: '失败',
        pending: '待执行',
      },
      alerts: {
        success: '已就绪，正在进入系统…',
        error: '获取失败，请稍后重试',
      },
      footerNote: '该页面为过渡页，请勿操作',
      errors: {
        missingTicket: '路由缺少 {key}',
        server: '服务端返回失败',
        unknown: '未知错误',
      },
    },
  },
};
