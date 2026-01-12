<template>
  <div class="dc-scan-code">
    <div
      v-if="hasTriggerSlot"
      class="dc-scan-code__trigger"
      :class="{ 'is-disabled': isDisabled }"
      @click.stop="handleTriggerClick"
    >
      <slot
        :open="handleTriggerClick"
        :loading="loading"
        :disabled="isDisabled"
        :show="show"
      ></slot>
    </div>

    <van-popup
      v-model:show="show"
      position="top"
      :closeable="true"
      :style="{ width: '100vw', height: '100vh' }"
      @close="handleManualClose"
    >
      <div class="scan-code">
        <!-- 相机画面 -->
        <div id="reader" class="reader"></div>

        <!-- 取景框 UI（不拦截事件） -->
        <div class="scan-ui" aria-hidden="true">
          <div class="frame" :style="frameStyle">
            <span class="corner tl"></span>
            <span class="corner tr"></span>
            <span class="corner bl"></span>
            <span class="corner br"></span>
            <div v-if="showScanLine" class="scan-line"></div>
          </div>
        </div>

        <!-- 底部按钮（美化版） -->
        <van-button
          class="btn btn-close"
          round
          size="large"
          icon="cross"
          @click="handleManualClose"
        >
          关闭
        </van-button>
      </div>
    </van-popup>
  </div>
</template>

<script>
import { nextTick } from 'vue';
import { Html5Qrcode } from 'html5-qrcode';
import Api from '@/api';
import { getLoginEnv } from '@/utils/env';
import { initWxSDK, wxScanQRCode } from '@/utils/wxsdk';
import { initWwSDK, wwScanQRCode } from '@/utils/wwxsdk';

export default {
  name: 'DcScanCode',
  props: {
    modelValue: {
      type: [String, Number],
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['confirm', 'error', 'change', 'update:modelValue'],
  data() {
    return {
      loading: false,
      scanResult: '',
      show: false,
      scanner: null,
      scanning: false,
      resolveFn: null,
      rejectFn: null,
      openPromise: null,
      stopPromise: null,
      // UI 配置
      frameWidth: 0, // 运行时计算
      frameHeight: 0, // 运行时计算
      showScanLine: true,
      // SDK 初始化状态
      wxInitPromise: null,
      wwInitPromise: null,
    };
  },
  computed: {
    hasTriggerSlot() {
      return Boolean(this.$slots.default);
    },
    isDisabled() {
      return this.disabled || this.loading;
    },
    frameStyle() {
      return {
        '--frame-w': this.frameWidth + 'px',
        '--frame-h': this.frameHeight + 'px',
      };
    },
  },
  mounted() {
    this.preInitSdk();
  },
  beforeUnmount() {
    this.stopScan();
  },
  methods: {
    preInitSdk() {
      const env = getLoginEnv();

      if (env === 'WECHAT_MP') {
        this.ensureWxSDK().catch((err) => {
          console.error('[dc-scan-code] 微信 SDK 初始化失败', err);
        });
        return;
      }

      if (env === 'WECHAT_ENTERPRISE') {
        this.ensureWwSDK().catch((err) => {
          console.error('[dc-scan-code] 企业微信 SDK 初始化失败', err);
        });
      }
    },

    open(options = {}) {
      if (this.loading && this.openPromise) {
        return this.openPromise;
      }

      this.loading = true;

      const runner = async () => {
        const env = getLoginEnv();

        try {
          if (env === 'WECHAT_MP') {
            return await this.openWechatScan(options);
          }

          if (env === 'WECHAT_ENTERPRISE') {
            return await this.openWecomScan(options);
          }

          return await this.openH5Scan();
        } catch (error) {
          if (error?.code === 'SCAN_CANCELLED') {
            return;
          } else {
            // 用户主动取消时不再降级
            if (this.isUserCancelError(error) || env === 'normal') {
              throw this.normalizeError(error);
            }

            console.warn('[dc-scan-code] SDK 扫码失败，尝试切换为 H5 扫码', error);
            return this.openH5Scan();
          }
        }
      };

      const promise = runner();

      this.openPromise = promise.finally(() => {
        this.loading = false;
        this.openPromise = null;
      });

      return this.openPromise;
    },

    openH5Scan() {
      return new Promise((resolve, reject) => {
        this.resolveFn = (result) => {
          const normalized = this.normalizeScanResult(result);
          this.$emit('update:modelValue', normalized);
          this.$emit('change', normalized);
          this.$emit('confirm', normalized);
          resolve(normalized);
        };
        this.rejectFn = (err) => {
          const error = this.normalizeError(err);
          if (!this.isUserCancelError(error)) {
            this.$emit('error', error);
          }
          reject(error);
        };
        this.show = true;
        nextTick(() => {
          this.calcFrameSize();
          this.startScan();
        });
      });
    },

    async openWechatScan(options = {}) {
      await this.ensureWxSDK();
      const result = await wxScanQRCode(options);
      const normalized = this.normalizeScanResult(result);
      this.$emit('update:modelValue', normalized);
      this.$emit('change', normalized);
      this.$emit('confirm', normalized);
      return normalized;
    },

    async openWecomScan(options = {}) {
      await this.ensureWwSDK();
      const result = await wwScanQRCode(options);
      const normalized = this.normalizeScanResult(result);
      this.$emit('update:modelValue', normalized);
      this.$emit('change', normalized);
      this.$emit('confirm', normalized);
      return normalized;
    },

    // 根据屏幕尺寸计算竖向取景框（与截图一致）
    calcFrameSize() {
      const w = window.innerWidth || document.documentElement.clientWidth;
      const h = window.innerHeight || document.documentElement.clientHeight;

      // 竖向：宽度占屏幕 70%，高度占 60%，并做上限保护
      const fw = Math.min(Math.round(w * 0.72), 320);
      const fh = Math.min(Math.round(h * 0.62), 560);

      this.frameWidth = fw;
      this.frameHeight = fh;
    },

    getQrbox() {
      // 与取景框尺寸一致，提升体验
      return { width: this.frameWidth, height: this.frameHeight };
    },

    async startScan() {
      if (this.scanning) return;

      if (this.stopPromise) {
        try {
          await this.stopPromise;
        } catch (err) {
          console.warn('[dc-scan-code] 上一次扫码停止失败', err);
        }
      }
      if (!this.scanner) {
        this.scanner = new Html5Qrcode('reader');
      }

      this.scanner
        .start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: this.getQrbox(),
          },
          (code) => {
            if (!this.scanning) return;
            this.scanning = false;
            this.stopScan();
            this.resolveFn?.(code);
            this.cleanup();
          },
          () => {} // 忽略高频错误回调
        )
        .then(() => {
          this.scanning = true;
        })
        .catch((err) => {
          console.error('摄像头启动失败:', err);
          this.rejectFn?.(err);
          this.cleanup();
        });

      // 旋转/尺寸变化时自适应（可选）
      window.addEventListener('resize', this.handleResize, { passive: true });
    },

    stopScan() {
      window.removeEventListener('resize', this.handleResize);
      this.scanning = false;

      if (!this.scanner) {
        return Promise.resolve();
      }

      if (this.stopPromise) {
        return this.stopPromise;
      }

      const stopTask = Promise.resolve()
        .then(() => this.scanner.stop?.())
        .catch((err) => {
          console.error('停止扫码失败:', err);
        })
        .finally(() => {
          try {
            this.scanner?.clear?.();
          } catch (err) {
            console.error('清理扫码实例失败:', err);
          }
          this.stopPromise = null;
        });

      this.stopPromise = stopTask;

      return stopTask;
    },

    handleResize() {
      // 只更新 UI，不强制重启相机（避免闪烁）
      this.calcFrameSize();
    },

    handleManualClose() {
      this.stopScan();
      this.rejectFn?.(new Error('用户取消扫码'));
      this.cleanup();
    },

    cleanup() {
      this.show = false;
      this.resolveFn = null;
      this.rejectFn = null;
    },

    async ensureWxSDK() {
      if (!this.wxInitPromise) {
        const url = window.location.href.split('#')[0];
        this.wxInitPromise = Api.common.wechat
          .getWxConfig(url)
          .then(
            (res) =>
              new Promise((resolve, reject) => {
                console.log(res, 'ensureWxSDK');
                const { code, data } = res.data;
                if (code === 200) {
                  initWxSDK(
                    data || {},
                    () => resolve(),
                    (err) => {
                      this.wxInitPromise = null;
                      reject(err);
                    }
                  );
                } else {
                  this.wxInitPromise = null;
                  reject();
                }
              })
          )
          .catch((err) => {
            this.wxInitPromise = null;
            throw err;
          });
      }

      return this.wxInitPromise;
    },

    async ensureWwSDK() {
      if (!this.wwInitPromise) {
        const url = window.location.href.split('#')[0];
        this.wwInitPromise = Api.common.wechat
          .getWwConfig(url)
          .then(
            (res) =>
              new Promise((resolve, reject) => {
                const { data } = res.data;
                initWwSDK(
                  data || {},
                  () => resolve(),
                  (err) => {
                    this.wwInitPromise = null;
                    reject(err);
                  }
                );
              })
          )
          .catch((err) => {
            this.wwInitPromise = null;
            throw err;
          });
      }

      return this.wwInitPromise;
    },

    normalizeScanResult(payload) {
      if (payload == null) return '';

      if (typeof payload === 'string') {
        const str = payload.trim();
        if (!str) return '';
        const parts = str.split(',');
        return parts.length > 1 ? parts[parts.length - 1].trim() : str;
      }

      if (typeof payload === 'object') {
        const candidate =
          payload.resultStr ??
          payload.resultString ??
          payload.text ??
          payload.code ??
          payload.rawData;

        if (typeof candidate === 'string') {
          return this.normalizeScanResult(candidate);
        }

        if (candidate != null) {
          return this.normalizeScanResult(String(candidate));
        }
      }

      return String(payload);
    },

    normalizeError(error) {
      if (error instanceof Error) return error;
      const message =
        error?.message || error?.errMsg || error?.desc || error?.toString?.() || '扫码失败';
      return new Error(message);
    },

    isUserCancelError(error) {
      const message = (error?.message || error?.errMsg || '').toLowerCase();
      return message.includes('cancel');
    },

    handleTriggerClick() {
      if (this.isDisabled) {
        return;
      }
      this.open().catch(() => {
        // 错误会通过 error 事件向外抛出
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.dc-scan-code {
  position: relative;

  &__trigger {
    display: inline-flex;
    cursor: pointer;

    &.is-disabled {
      cursor: not-allowed;
      pointer-events: none;
      opacity: 0.6;
    }
  }
}

.scan-code {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;

  #reader {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    /* html5-qrcode 会填充 video；确保其铺满 */
    video {
      object-fit: cover !important;
      width: 100% !important;
      height: 100% !important;
    }
  }

  .scan-ui {
    pointer-events: none;
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
  }

  /* 中央取景框：用超大 box-shadow 做遮罩，外侧变暗，内侧通透 */
  .frame {
    position: relative;
    width: var(--frame-w);
    height: var(--frame-h);
    border-radius: 8px; /* 取景框圆角（可调） */
    box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.72);
    /* 让遮罩不过度锐利 */
    outline: 1px solid rgba(255, 255, 255, 0.04);
  }

  /* 四角描边（白色 L 形） */
  .corner {
    position: absolute;
    width: 34px;
    height: 34px;
    border: 3px solid #fff;
  }
  .corner.tl {
    top: -2px;
    left: -2px;
    border-right: none;
    border-bottom: none;
    border-top-left-radius: 6px;
  }
  .corner.tr {
    top: -2px;
    right: -2px;
    border-left: none;
    border-bottom: none;
    border-top-right-radius: 6px;
  }
  .corner.bl {
    bottom: -2px;
    left: -2px;
    border-right: none;
    border-top: none;
    border-bottom-left-radius: 6px;
  }
  .corner.br {
    bottom: -2px;
    right: -2px;
    border-left: none;
    border-top: none;
    border-bottom-right-radius: 6px;
  }

  /* 扫描线（可选） */
  .scan-line {
    position: absolute;
    left: 6%;
    right: 6%;
    height: 2px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 2px;
    animation: slideY 2.2s ease-in-out infinite;
  }
  @keyframes slideY {
    0% {
      top: 8%;
      opacity: 0.2;
    }
    10% {
      opacity: 1;
    }
    50% {
      top: 50%;
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      top: 92%;
      opacity: 0.2;
    }
  }

  /* 底部关闭按钮：浮动胶囊样式 */
  .btn {
    position: fixed;
    left: 16px;
    right: 16px;
    bottom: calc(16px + env(safe-area-inset-bottom));
    z-index: 10000;

    /* 自身样式 */
    border: none;
    border-radius: 999px;
    height: 48px;
    padding: 0 20px;

    /* 质感：红橙渐变 + 玻璃模糊 + 阴影 */
    background: linear-gradient(135deg, #ff5f6c, #ff9966);
    color: #ffffff;
    box-shadow:
      0 12px 32px rgba(0, 0, 0, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
    backdrop-filter: saturate(160%) blur(14px);

    /* 让按钮真正撑满整个胶囊区域 */
    width: auto;
    display: flex;
    align-items: center;
    justify-content: center;

    /* 按压反馈 */
    transition:
      transform 0.12s ease,
      filter 0.18s ease,
      box-shadow 0.18s ease;
    &:active {
      transform: translateY(1px);
      filter: brightness(0.95);
      box-shadow:
        0 8px 20px rgba(0, 0, 0, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.18);
    }

    /* 内部内容微调 */
    :deep(.van-button__content) {
      height: 100%;
      justify-content: center;
      gap: 6px;
      font-weight: 600;
      letter-spacing: 0.04em;
      font-size: 15px;
    }

    :deep(.van-icon) {
      font-size: 18px;
    }
  }

  /* 细腻的玻璃态（可选） */
  .btn.btn-close {
    backdrop-filter: saturate(160%) blur(10px);
  }
}
</style>
