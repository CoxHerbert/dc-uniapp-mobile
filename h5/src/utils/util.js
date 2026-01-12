import CryptoJS from 'crypto-js';
import { translate } from '@/locales';

// 小工具：统一 CryptoJS 编码与输出
const sha256Hex = (input) => CryptoJS.SHA256(String(input)).toString();
const toBase64 = (input) => CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(String(input)));

//表单序列化
export const serialize = (data) => {
  let list = [];
  Object.keys(data).forEach((ele) => {
    list.push(`${ele}=${data[ele]}`);
  });
  return list.join('&');
};

// 金额格式化  10000->10,000
export const toLocaleString = (value) => {
  return value?.toLocaleString?.('en-US') || '0';
};

export const getObjType = (obj) => {
  var toString = Object.prototype.toString;
  var map = {
    '[object Boolean]': 'boolean',
    '[object Number]': 'number',
    '[object String]': 'string',
    '[object Function]': 'function',
    '[object Array]': 'array',
    '[object Date]': 'date',
    '[object RegExp]': 'regExp',
    '[object Undefined]': 'undefined',
    '[object Null]': 'null',
    '[object Object]': 'object',
  };
  if (typeof Element !== 'undefined' && obj instanceof Element) {
    return 'element';
  }
  return map[toString.call(obj)];
};

// 对象去除空值
export const removeEmptyValues = (obj) => {
  return Object.keys(obj).reduce((acc, key) => {
    if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};

/**
 * 对象深拷贝
 */
export const deepClone = (data) => {
  var type = getObjType(data);
  var obj;
  if (type === 'array') {
    obj = [];
  } else if (type === 'object') {
    obj = {};
  } else {
    //不再具有下一层次
    return data;
  }
  if (type === 'array') {
    for (var i = 0, len = data.length; i < len; i++) {
      obj.push(deepClone(data[i]));
    }
  } else if (type === 'object') {
    for (var key in data) {
      obj[key] = deepClone(data[key]);
    }
  }
  return obj;
};
/**
 * 设置灰度模式
 */
export const toggleGrayMode = (status) => {
  if (status) {
    document.body.className = document.body.className + ' grayMode';
  } else {
    document.body.className = document.body.className.replace(' grayMode', '');
  }
};
/**
 * 设置主题
 */
export const setTheme = (name) => {
  document.body.className = name;
};

/**
 * 加密处理
 * @param {{ data?: Record<string, any>, type: 'Base64'|'SHA256'|'AES'|'Aes', param: string[], key?: string }} params
 * - Base64：对字符串做 UTF-8 编码后再 Base64
 * - SHA256：输出 16 进制摘要
 * - AES/Aes：对称加密（默认 CryptoJS 内置配置；如需 CBC/IV 可按需扩展）
 */
export const encryption = (params) => {
  const { data = {}, type, param = [], key } = params || {};
  const result = JSON.parse(JSON.stringify(data));
  if (!Array.isArray(param) || param.length === 0) return result;

  if (type === 'Base64') {
    param.forEach((ele) => {
      result[ele] = toBase64(result[ele]);
    });
  } else if (type === 'SHA256') {
    param.forEach((ele) => {
      result[ele] = sha256Hex(result[ele]);
    });
  } else if (type === 'AES' || type === 'Aes') {
    if (!key) console.warn('[encryption] AES 需要提供 key');
    param.forEach((ele) => {
      result[ele] = CryptoJS.AES.encrypt(
        CryptoJS.enc.Utf8.parse(String(result[ele])),
        CryptoJS.enc.Utf8.parse(String(key || ''))
      ).toString();
    });
    // 如需与后端约定 CBC/IV/PKCS7:
    // const iv = CryptoJS.enc.Utf8.parse('<16bytes-iv>');
    // CryptoJS.AES.encrypt(data, keyBytes, { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 })
  }
  return result;
};

/**
 * 浏览器判断是否全屏
 */
export const fullscreenToggel = () => {
  if (fullscreenEnable()) {
    exitFullScreen();
  } else {
    reqFullScreen();
  }
};
/**
 * esc监听全屏
 */
export const listenfullscreen = (callback) => {
  function listen() {
    callback && callback();
  }

  document.addEventListener('fullscreenchange', function () {
    listen();
  });
  document.addEventListener('mozfullscreenchange', function () {
    listen();
  });
  document.addEventListener('webkitfullscreenchange', function () {
    listen();
  });
  document.addEventListener('msfullscreenchange', function () {
    listen();
  });
};
/**
 * 浏览器判断是否全屏
 */
export const fullscreenEnable = () => {
  var isFullscreen =
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement;
  return !!isFullscreen;
};

/**
 * 浏览器全屏
 */
export const reqFullScreen = () => {
  const el = document.documentElement;
  if (el.requestFullscreen) {
    el.requestFullscreen();
  } else if (el.webkitRequestFullScreen) {
    el.webkitRequestFullScreen();
  } else if (el.mozRequestFullScreen) {
    el.mozRequestFullScreen();
  } else if (el.msRequestFullscreen) {
    el.msRequestFullscreen();
  }
};
/**
 * 浏览器退出全屏
 */
export const exitFullScreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitCancelFullScreen) {
    document.webkitCancelFullScreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
};
/**
 * 递归寻找子类的父类
 */
export const findParent = (menu, id) => {
  for (let i = 0; i < menu.length; i++) {
    if (menu[i].children?.length) {
      for (let j = 0; j < menu[i].children.length; j++) {
        if (menu[i].children[j].id == id) {
          return menu[i];
        } else {
          if (menu[i].children[j].children?.length) {
            return findParent(menu[i].children[j].children, id);
          }
        }
      }
    }
  }
};
/**
 * 动态插入css
 */
export const loadStyle = (url) => {
  const link = document.createElement('link');
  link.type = 'text/css';
  link.rel = 'stylesheet';
  link.href = url;
  const head = document.getElementsByTagName('head')[0];
  head.appendChild(link);
};
/**
 * 判断路由是否相等
 */
export const diff = (obj1, obj2) => {
  delete obj1.close;
  var o1 = obj1 instanceof Object;
  var o2 = obj2 instanceof Object;
  if (!o1 || !o2) {
    /*  判断不是对象  */
    return obj1 === obj2;
  }

  if (Object.keys(obj1).length !== Object.keys(obj2).length) {
    return false;
  }

  for (var attr in obj1) {
    var t1 = obj1[attr] instanceof Object;
    var t2 = obj2[attr] instanceof Object;
    if (t1 && t2) {
      return diff(obj1[attr], obj2[attr]);
    } else if (obj1[attr] !== obj2[attr]) {
      return false;
    }
  }
  return true;
};

/**
 * 根据字典的value查找对应的index
 */
export const findArray = (dic, value) => {
  for (let i = 0; i < dic.length; i++) {
    if (dic[i].value == value) {
      return i;
    }
  }
  return -1;
};
/**
 * 生成随机len位数字
 */
export const randomLenNum = (len, date) => {
  let random = '';
  random = Math.ceil(Math.random() * 100000000000000)
    .toString()
    .substr(0, len ? len : 4);
  if (date) random = random + Date.now();
  return random;
};
/**
 * 打开小窗口
 */
export const openWindow = (url, title, w, h) => {
  const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left;
  const dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top;

  const width = window.innerWidth
    ? window.innerWidth
    : document.documentElement.clientWidth
      ? document.documentElement.clientWidth
      : screen.width;
  const height = window.innerHeight
    ? window.innerHeight
    : document.documentElement.clientHeight
      ? document.documentElement.clientHeight
      : screen.height;

  const left = width / 2 - w / 2 + dualScreenLeft;
  const top = height / 2 - h / 2 + dualScreenTop;
  const newWindow = window.open(
    url,
    title,
    'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=yes, copyhistory=no, width=' +
      w +
      ', height=' +
      h +
      ', top=' +
      top +
      ', left=' +
      left
  );

  if (window.focus && newWindow) {
    newWindow.focus();
  }
};

export const getScreen = (isCollapse) => {
  if (document.body.clientWidth <= 768) {
    return !isCollapse;
  } else {
    return isCollapse;
  }
};

/**
 * 获取顶部地址栏地址
 */
export const getTopUrl = () => {
  return window.location.href.split('/#/')[0];
};

/**
 * 获取url参数
 * @param name 参数名
 */
export const getQueryString = (name) => {
  let reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
  let r = window.location.search.substr(1).match(reg);
  if (r != null) return unescape(decodeURI(r[2]));
  return null;
};

/**
 * 下载文件
 * @param {String} path - 文件地址
 * @param {String} name - 文件名,eg: test.png
 */
export const downloadFileBlob = (path, name) => {
  const xhr = new XMLHttpRequest();
  xhr.open('get', path);
  xhr.responseType = 'blob';
  xhr.send();
  xhr.onload = function () {
    if (this.status === 200 || this.status === 304) {
      if ('msSaveOrOpenBlob' in navigator) {
        navigator.msSaveOrOpenBlob(this.response, name);
        return;
      }
      const url = URL.createObjectURL(this.response);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };
};

/**
 * 下载文件
 * @param {String} path - 文件地址
 * @param {String} name - 文件名,eg: test.png
 */
export const downloadFileBlobPromise = (path, name) => {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('get', path);
      xhr.responseType = 'blob';
      xhr.send();
      xhr.onload = function () {
        if (this.status === 200 || this.status === 304) {
          if ('msSaveOrOpenBlob' in navigator) {
            navigator.msSaveOrOpenBlob(this.response, name);
            return;
          }
          const url = URL.createObjectURL(this.response);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          resolve();
        } else {
          reject();
        }
      };
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * 下载文件
 * @param {String} path - 文件地址
 * @param {String} name - 文件名,eg: test.png
 */
export const downloadFileBase64 = (path, name) => {
  const xhr = new XMLHttpRequest();
  xhr.open('get', path);
  xhr.responseType = 'blob';
  xhr.send();
  xhr.onload = function () {
    if (this.status === 200 || this.status === 304) {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(this.response);
      fileReader.onload = function () {
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = this.result;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };
    }
  };
};
/**
 * 下载excel
 * @param {blob} fileArrayBuffer 文件流
 * @param {String} filename 文件名称
 */
export const downloadXls = (fileArrayBuffer, filename) => {
  let data = new Blob([fileArrayBuffer], { type: 'application/vnd.ms-excel,charset=utf-8' });
  if (typeof window.chrome !== 'undefined') {
    var link = document.createElement('a');
    link.href = window.URL.createObjectURL(data);
    link.download = filename;
    link.click();
  } else if (typeof window.navigator.msSaveBlob !== 'undefined') {
    var blob = new Blob([data], { type: 'application/force-download' });
    window.navigator.msSaveBlob(blob, filename);
  } else {
    var file = new File([data], filename, { type: 'application/force-download' });
    window.open(URL.createObjectURL(file));
  }
};

export const downloadPdf = (fileArrayBuffer, filename) => {
  let data = new Blob([fileArrayBuffer], { type: 'application/pdf' });
  if (typeof window.chrome !== 'undefined') {
    var link = document.createElement('a');
    link.href = window.URL.createObjectURL(data);
    link.download = filename;
    link.click();
  } else if (typeof window.navigator.msSaveBlob !== 'undefined') {
    var blob = new Blob([data], { type: 'application/force-download' });
    window.navigator.msSaveBlob(blob, filename);
  } else {
    var file = new File([data], filename, { type: 'application/force-download' });
    window.open(URL.createObjectURL(file));
  }
};

// 字符串格式化(%s )
export function sprintf(str) {
  var args = arguments,
    flag = true,
    i = 1;
  str = str.replace(/%s/g, function () {
    var arg = args[i++];
    if (typeof arg === 'undefined') {
      flag = false;
      return '';
    }
    return arg;
  });
  return flag ? str : '';
}

// 转换字符串，undefined,null等转化为""
export function parseStrEmpty(str) {
  if (!str || str == 'undefined' || str == 'null') {
    return '';
  }
  return str;
}

// 数据合并
export function mergeRecursive(source, target) {
  for (var p in target) {
    try {
      if (target[p].constructor == Object) {
        source[p] = mergeRecursive(source[p], target[p]);
      } else {
        source[p] = target[p];
      }
    } catch (e) {
      source[p] = target[p];
    }
  }
  return source;
}

/**
 * 构造树型结构数据
 * @param {*} data 数据源
 * @param {*} id id字段 默认 'id'
 * @param {*} parentId 父节点字段 默认 'parentId'
 * @param {*} children 孩子节点字段 默认 'children'
 */
export function handleTree(data, id, parentId, children) {
  let config = {
    id: id || 'id',
    parentId: parentId || 'parentId',
    childrenList: children || 'children',
  };

  var childrenListMap = {};
  var nodeIds = {};
  var tree = [];

  for (let d of data) {
    let parentId = d[config.parentId];
    if (childrenListMap[parentId] == null) {
      childrenListMap[parentId] = [];
    }
    nodeIds[d[config.id]] = d;
    childrenListMap[parentId].push(d);
  }

  for (let d of data) {
    let parentId = d[config.parentId];
    if (nodeIds[parentId] == null) {
      tree.push(d);
    }
  }

  for (let t of tree) {
    adaptToChildrenList(t);
  }

  function adaptToChildrenList(o) {
    if (childrenListMap[o[config.id]] !== null) {
      o[config.childrenList] = childrenListMap[o[config.id]];
    }
    if (o[config.childrenList]) {
      for (let c of o[config.childrenList]) {
        adaptToChildrenList(c);
      }
    }
  }

  return tree;
}

/**
 * 参数处理
 * @param {*} params  参数
 */
export function tansParams(params) {
  let result = '';
  for (const propName of Object.keys(params)) {
    const value = params[propName];
    var part = encodeURIComponent(propName) + '=';
    if (value !== null && value !== '' && typeof value !== 'undefined') {
      if (typeof value === 'object') {
        for (const key of Object.keys(value)) {
          if (value[key] !== null && value[key] !== '' && typeof value[key] !== 'undefined') {
            let params = propName + '[' + key + ']';
            var subPart = encodeURIComponent(params) + '=';
            result += subPart + encodeURIComponent(value[key]) + '&';
          }
        }
      } else {
        result += part + encodeURIComponent(value) + '&';
      }
    }
  }
  if (typeof result === 'string') result = result.replace(/&$/, '');
  return result;
}

// 返回项目路径
export function getNormalPath(p) {
  if (!p || p.length === 0 || p == 'undefined') {
    return p;
  }
  let res = p.replace('//', '/');
  if (res[res.length - 1] === '/') {
    return res.slice(0, res.length - 1);
  }
  return res;
}

// 验证是否为blob格式
export function blobValidate(data) {
  return data?.type !== 'application/json';
}

/**
 * 秒、分钟、小时之间的时间单位转换
 */
export const convertTime = ({ value, from, to, decimal = 3 }) => {
  const unitToSeconds = {
    s: 1,
    m: 60,
    h: 3600,
  };

  if (!unitToSeconds[from] || !unitToSeconds[to]) {
    const fallbackMessage = `不支持的时间单位: ${from} 或 ${to}`;
    throw new Error(translate('common.time.unsupportedUnit', fallbackMessage, { from, to }));
  }

  const valueInSeconds = value * unitToSeconds[from];
  const result = valueInSeconds / unitToSeconds[to];

  return parseFloat(result.toFixed(decimal));
};

// 截取文件类型
export function getFileExtension(url) {
  if (!url) return '';
  const parts = url.split('?')[0].split('.'); // 忽略查询参数
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

export const isExternalUrl = (url) => {
  const link = document.createElement('a');
  link.href = url;
  const currentHost = window.location.hostname;
  return link.hostname !== currentHost;
};

// 根据name获取地址拦参数值
export function getUrlCode(name) {
  return (
    decodeURIComponent(
      (new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(new URL(location.href)) || [
        ,
        '',
      ])[1].replace(/\+/g, '%20')
    ) || null
  );
}

export const withBase = (p) => import.meta.env.BASE_URL + p.replace(/^\/+/, '');
