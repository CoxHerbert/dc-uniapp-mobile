<template>
  <div class="wf-sign">
    <van-image
      v-if="text"
      :src="text"
      width="700"
      height="350"
      fit="contain"
      class="wf-sign__preview"
      @click="handlePreview"
    />
    <van-button
      v-if="!disabled"
      class="wf-sign__button"
      type="primary"
      size="small"
      @click="handleSign"
    >
      签名
    </van-button>
    <signature-pad v-if="!disabled" ref="signature" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { Button, Image as VanImage, showToast } from 'vant';
import Props from '../../mixins/props.js';
import SignaturePad from './components/signature.vue';
import { DIC_HTTP_PROPS } from '../../util/variable.js';
import { getAsVal } from '../../util/index.js';

export default defineComponent({
  name: 'WfSign',
  components: {
    [Button.name]: Button,
    [VanImage.name]: VanImage,
    SignaturePad,
  },
  mixins: [Props],
  data() {
    return {
      signId: `nf-sign-${Date.now() + Math.ceil(Math.random() * 999)}`,
    };
  },
  computed: {
    options() {
      return this.column.options;
    },
    action() {
      return this.column.action;
    },
    penColor() {
      return this.options ? this.options.penColor || '#000' : '#000';
    },
    propsHttp() {
      return { ...DIC_HTTP_PROPS, ...this.column.propsHttp };
    },
    fileName() {
      return this.propsHttp.fileName || 'file';
    },
  },
  methods: {
    handleSign() {
      const pad = this.$refs.signature;
      if (!pad || typeof pad.sign !== 'function') {
        return;
      }
      pad
        .sign({
          width: '700',
          height: '350',
          color: this.penColor,
        })
        .then((path) => {
          this.httpUpload({ file: path })
            .then((url) => {
              this.text = url;
            })
            .catch(() => {
              this.text = path;
            });
        })
        .catch(() => {});
    },
    handlePreview() {
      if (!this.text) return;
      if (typeof window !== 'undefined' && window.open) {
        window.open(this.text, '_blank');
      } else {
        uni.previewImage({
          urls: [this.text],
        });
      }
    },
    httpUpload(config) {
      return new Promise((resolve, reject) => {
        if (!this.action) {
          const message = '未配置上传地址，保存为base64';
          const tag = sessionStorage.getItem(this.signId);
          if (!tag) {
            showToast({ message, position: 'bottom' });
            sessionStorage.setItem(this.signId, 1);
          }
          reject();
          return;
        }
        const params = {
          filePath: config.file,
          name: this.fileName,
        };

        this.$http
          .upload(this.action, params)
          .then((res) => {
            const data = getAsVal(res, this.propsHttp.res || 'data');
            const url = getAsVal(data, this.propsHttp.url);
            if (url) {
              resolve(url);
            } else {
              reject();
            }
          })
          .catch(() => {
            reject();
          });
      });
    },
  },
});
</script>

<style lang="scss" scoped>
.wf-sign {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;

  &__preview {
    border: 1px solid #f2f3f5;
    border-radius: 4px;
  }

  &__button {
    width: 96px;
  }
}
</style>
