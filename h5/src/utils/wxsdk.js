/**
 * 微信JS-SDK工具类
 */
import wx from 'weixin-js-sdk';
import commonApi from '@/api/modules/common';

function isScanCancelled(res) {
  if (!res || typeof res !== 'object') {
    return false;
  }

  const errInfo = String(res.err_Info || '').toLowerCase();
  const errMsg = String(res.errMsg || '').toLowerCase();

  return errInfo === 'cancel' || errMsg.includes(':cancel');
}

/**
 * 初始化微信JS-SDK
 * @param {Object} config - 微信JS-SDK配置参数
 * @param {Function} success - 初始化成功回调
 * @param {Function} error - 初始化失败回调
 */
export function initWxSDK(config, success, error) {
  wx.config({
    debug: false, // 开启调试模式
    appId: config.appId, // 必填，公众号的唯一标识
    timestamp: config.timestamp, // 必填，生成签名的时间戳
    nonceStr: config.nonceStr, // 必填，生成签名的随机串
    signature: config.signature, // 必填，签名
    jsApiList: config.jsApiList || ['scanQRCode'], // 必填，需要使用的JS接口列表
  });

  wx.ready(() => {
    console.log('微信JS-SDK初始化成功');
    if (typeof success === 'function') {
      success(wx);
    }
  });

  wx.error((res) => {
    console.error('微信JS-SDK初始化失败:', res);
    if (typeof error === 'function') {
      error(res);
    }
  });
}

/**
 * 获取微信配置信息
 * @param {String} url - 当前页面URL
 * @returns {Promise} 返回微信配置信息
 */
export function getWxConfig(url) {
  return commonApi.wechat.getWxConfig(url);
}

/**
 * 设置微信分享
 * @param {Object} shareData - 分享数据
 * @param {String} shareData.title - 分享标题
 * @param {String} shareData.desc - 分享描述
 * @param {String} shareData.link - 分享链接
 * @param {String} shareData.imgUrl - 分享图标
 */
export function setWxShare(shareData) {
  // 更新朋友圈分享
  wx.updateTimelineShareData({
    title: shareData.title,
    link: shareData.link,
    imgUrl: shareData.imgUrl,
    success: function () {
      console.log('设置朋友圈分享成功');
    },
  });

  // 更新朋友分享
  wx.updateAppMessageShareData({
    title: shareData.title,
    desc: shareData.desc,
    link: shareData.link,
    imgUrl: shareData.imgUrl,
    success: function () {
      console.log('设置朋友分享成功');
    },
  });
}

/**
 * 微信扫一扫
 * @param {Object} options - 扫码配置
 * @param {Function} success - 成功回调（兼容旧版本）
 * @param {Function} error - 失败回调（兼容旧版本）
 * @returns {Promise} 返回Promise对象（新版本）
 */
export function wxScanQRCode(options = {}, success, error) {
  // 默认配置
  const defaultOptions = {
    needResult: 1, // 默认为0，扫描结果由微信处理，1则直接返回扫描结果
    scanType: ['qrCode', 'barCode'], // 可以指定扫二维码还是一维码，默认二者都有
  };

  // 合并配置
  const scanOptions = Object.assign({}, defaultOptions, options);

  // // 如果传入了回调函数，则使用回调模式（兼容旧版本）
  if (typeof success === 'function' || typeof error === 'function') {
    wx.scanQRCode({
      needResult: scanOptions.needResult,
      scanType: scanOptions.scanType,
      success: function (res) {
        if (isScanCancelled(res)) {
          console.log('微信扫码已取消:', res);
          error(
            Object.assign(new Error('微信扫码已取消'), {
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
        console.log('微信扫码取消:', res);
        error(
          Object.assign(new Error('微信扫码已取消'), {
            code: 'SCAN_CANCELLED',
            detail: res,
          })
        );
      },
      error: function (err) {
        console.error('微信扫码失败:', err);
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
      // 检查微信SDK是否已初始化
      if (!wx || typeof wx.scanQRCode !== 'function') {
        reject(new Error('微信SDK未初始化或scanQRCode方法不可用'));
        return;
      }

      wx.scanQRCode({
        needResult: scanOptions.needResult,
        scanType: scanOptions.scanType,
        success: function (res) {
          console.log('微信扫码成功:', res);
          if (isScanCancelled(res)) {
            reject(
              Object.assign(new Error('微信扫码已取消'), { code: 'SCAN_CANCELLED', detail: res })
            );
            return;
          }

          resolve(res);
        },
        cancel: function (res) {
          console.log('微信扫码取消:', res);
          reject(
            Object.assign(new Error('微信扫码已取消'), { code: 'SCAN_CANCELLED', detail: res })
          );
        },
        error: function (err) {
          console.error('微信扫码失败:', err);
          reject({ code: 'error', detail: err });
        },
      });
    } catch (error) {
      console.error('调用微信扫码API时发生异常:', error);
      reject(error);
    }
  });
}

/**
 * 获取地理位置
 * @param {Function} success - 成功回调
 * @param {Function} error - 失败回调
 */
export function wxGetLocation(success, error) {
  wx.getLocation({
    type: 'wgs84', // 默认为wgs84的gps坐标，如果要返回直接给openLocation用的火星坐标，可传入'gcj02'
    success: function (res) {
      if (typeof success === 'function') {
        success(res);
      }
    },
    error: function (err) {
      if (typeof error === 'function') {
        error(err);
      }
    },
  });
}

/**
 * 选择图片
 * @param {Object} options - 图片选择配置
 * @param {Function} success - 成功回调
 * @param {Function} error - 失败回调
 */
export function wxChooseImage(options = {}, success, error) {
  wx.chooseImage({
    count: options.count || 1, // 默认9
    sizeType: options.sizeType || ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
    sourceType: options.sourceType || ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
    success: function (res) {
      if (typeof success === 'function') {
        success(res);
      }
    },
    error: function (err) {
      if (typeof error === 'function') {
        error(err);
      }
    },
  });
}

// 导出wx对象，以便直接使用
export default wx;
