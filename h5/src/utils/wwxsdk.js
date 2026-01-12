/**
 * 企业微信JS-SDK工具类 - 专注于扫一扫功能
 */
import ww from 'wework-js-sdk';

/**
 * 初始化企业微信JS-SDK
 * @param {Object} config - 企业微信JS-SDK配置参数
 * @param {Function} success - 初始化成功回调
 * @param {Function} error - 初始化失败回调
 */
export function initWwSDK(config, success, error) {
  ww.config({
    beta: true, // 必须这么写，否则wx.invoke调用形式的jsapi会有问题
    debug: false, // 开启调试模式
    appId: config.appId, // 必填，企业微信的corpID
    timestamp: config.timestamp, // 必填，生成签名的时间戳
    nonceStr: config.nonceStr, // 必填，生成签名的随机串
    signature: config.signature, // 必填，签名
    jsApiList: config.jsApiList || [
      'scanQRCode', // 只注册扫一扫接口
    ], // 必填，需要使用的JS接口列表
  });

  ww.ready(() => {
    console.log('企业微信JS-SDK初始化成功');
    if (typeof success === 'function') {
      success(ww);
    }
  });

  ww.error((res) => {
    console.error('企业微信JS-SDK初始化失败:', res);
    if (typeof error === 'function') {
      error(res);
    }
  });
}

/**
 * 企业微信扫一扫
 * @param {Object} options - 扫码配置
 * @param {Function} success - 成功回调（兼容旧版本）
 * @param {Function} error - 失败回调（兼容旧版本）
 * @returns {Promise} 返回Promise对象（新版本）
 */
function isScanCancelled(res) {
  if (!res || typeof res !== 'object') {
    return false;
  }

  const errInfo = String(res.err_Info || '').toLowerCase();
  const errMsg = String(res.errMsg || '').toLowerCase();

  return errInfo === 'cancel' || errMsg.includes(':cancel');
}

export function wwScanQRCode(options = {}, success, error) {
  // 默认配置
  const defaultOptions = {
    desc: '扫码获取设备信息', // 扫码提示文本
    scanType: ['qrCode', 'barCode'], // 扫码类型
    needResult: 1, // 默认为1，直接返回扫码结果
  };

  // 合并配置
  const scanOptions = Object.assign({}, defaultOptions, options);

  // 如果传入了回调函数，则使用回调模式（兼容旧版本）
  if (typeof success === 'function' || typeof error === 'function') {
    ww.scanQRCode({
      desc: scanOptions.desc,
      scanType: scanOptions.scanType,
      needResult: scanOptions.needResult,
      success: function (res) {
        if (isScanCancelled(res)) {
          error(
            Object.assign(new Error('企业微信扫码已取消'), {
              code: 'SCAN_CANCELLED',
              detail: res,
            })
          );
          return;
        }
        if (typeof success === 'function') {
          success(res);
        }
      },
      cancel: function (res) {
        console.log('企业微信扫码取消:', res);
        error(
          Object.assign(new Error('企业微信扫码已取消'), {
            code: 'SCAN_CANCELLED',
            detail: res,
          })
        );
      },
      error: function (err) {
        console.error('企业微信扫码失败:', err);
        if (typeof error === 'function') {
          reject({ code: 'error', detail: err });
        }
      },
    });
    return; // 回调模式不返回Promise
  }

  // 否则返回Promise对象（新版本）
  return new Promise((resolve, reject) => {
    try {
      // 检查企业微信SDK是否已初始化
      if (!ww || typeof ww.scanQRCode !== 'function') {
        reject(new Error('企业微信SDK未初始化或scanQRCode方法不可用'));
        return;
      }

      ww.scanQRCode({
        desc: scanOptions.desc,
        scanType: scanOptions.scanType,
        needResult: scanOptions.needResult,
        success: function (res) {
          console.log('企业微信扫码成功:', res);
          if (isScanCancelled(res)) {
            reject(
              Object.assign(new Error('企业微信扫码已取消'), {
                code: 'SCAN_CANCELLED',
                detail: res,
              })
            );
            return;
          }

          resolve(res);
        },
        cancel: function (res) {
          console.log('企业微信扫码取消:', res);
          reject(
            Object.assign(new Error('企业微信扫码已取消'), { code: 'SCAN_CANCELLED', detail: res })
          );
        },
        error: function (err) {
          console.error('企业微信扫码失败:', err);
          reject({ code: 'error', detail: err });
        },
      });
    } catch (error) {
      console.error('调用企业微信扫码API时发生异常:', error);
      reject(error);
    }
  });
}

/**
 * 检查是否在企业微信环境中
 * @returns {Boolean} 是否在企业微信环境
 */
export function isWwEnvironment() {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('wxwork') || ua.includes('micromessenger');
}

/**
 * 初始化企业微信扫码功能（简化版）
 * @param {Function} success - 扫码成功回调
 * @param {Function} error - 扫码失败回调
 * @param {Object} options - 扫码配置
 */
export function initWwScanQRCode(success, error, options = {}) {
  // 检查是否在企业微信环境
  if (!isWwEnvironment()) {
    console.warn('当前不在企业微信环境中');
    if (typeof error === 'function') {
      error(new Error('当前不在企业微信环境中'));
    }
    return;
  }

  // 获取当前页面URL
  const url = window.location.href.split('#')[0];

  // 获取企业微信配置
  getWwConfig(url)
    .then((config) => {
      // 初始化企业微信SDK
      initWwSDK(
        config,
        () => {
          // 初始化成功后执行扫码
          wwScanQRCode(options, success, error);
        },
        (initError) => {
          console.error('企业微信SDK初始化失败:', initError);
          if (typeof error === 'function') {
            error(initError);
          }
        }
      );
    })
    .catch((configError) => {
      console.error('获取企业微信配置失败:', configError);
      if (typeof error === 'function') {
        error(configError);
      }
    });
}

// 导出企业微信对象，以便直接使用
export default ww;
