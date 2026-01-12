import request from '@/utils/http';

export default {
  /**
   * 获取微信JS-SDK配置信息
   * @param {String} url - 当前页面URL
   */
  getWxConfig(url) {
    return request({
      url: '/blade-auth/social/skip-url/getWxJsapiTicket',
      method: 'get',
      params: { url },
    });
  },

  /**
   * 获取企业微信JS-SDK配置信息
   * @param {String} url - 当前页面URL
   */
  getWwConfig(url) {
    return request({
      url: '/blade-auth/social/skip-url/getQyWxJsapiTicket',
      method: 'get',
      params: { url },
    });
  },

  /**
   * 获取微信用户信息
   * @param {String} code - 微信授权code
   */
  getWxUserInfo(code) {
    return request({
      url: '/wx/user-info',
      method: 'get',
      params: { code },
    });
  },

  /**
   * 获取企业微信用户信息
   * @param {String} code - 企业微信授权code
   */
  getWwUserInfo(code) {
    return request({
      url: '/ww/user-info',
      method: 'get',
      params: { code },
    });
  },

  /**
   * 获取微信AccessToken
   */
  getWxAccessToken() {
    return request({
      url: '/wx/access-token',
      method: 'get',
    });
  },

  /**
   * 获取企业微信AccessToken
   */
  getWwAccessToken() {
    return request({
      url: '/ww/access-token',
      method: 'get',
    });
  },

  /**
   * 获取微信jsapiTicket
   */
  getWxJsApiTicket() {
    return request({
      url: '/wx/jsapi-ticket',
      method: 'get',
    });
  },

  /**
   * 获取企业微信jsapiTicket
   */
  getWwJsApiTicket() {
    return request({
      url: '/ww/jsapi-ticket',
      method: 'get',
    });
  },
};
