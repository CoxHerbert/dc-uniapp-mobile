<template>
  <div class="wf-upload">
    <van-uploader
      v-model="fileList"
      :max-count="limit"
      :max-size="fileSize * 1024 * 1024"
      :disabled="disabled"
      :after-read="handleAfterRead"
      :before-delete="handleBeforeDelete"
      :upload-text="column.buttonText || '点击上传'"
      :multiple="column.multiple !== false"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { Uploader } from 'vant';
import { DIC_HTTP_PROPS } from '../../util/variable.js';
import { getAsVal, deepClone } from '../../util/index.js';
import { uploadFile } from '../../util/uploader.js';
import Props from '../../mixins/props.js';

export default defineComponent({
  name: 'WfUpload',
  components: {
    [Uploader.name]: Uploader,
  },
  mixins: [Props],
  data() {
    return {
      fileList: [],
    };
  },
  computed: {
    action() {
      return this.column.action;
    },
    limit() {
      return this.column.limit || Number.MAX_VALUE;
    },
    fileSize() {
      return this.column.fileSize || Number.MAX_VALUE;
    },
    header() {
      return this.column.header || {};
    },
    formData() {
      return this.column.data || {};
    },
    propsHttp() {
      return { ...DIC_HTTP_PROPS, ...this.column.propsHttp };
    },
    fileName() {
      return this.propsHttp.fileName || 'file';
    },
  },
  watch: {
    text: {
      immediate: true,
      handler() {
        this.initValue();
      },
    },
    fileList: {
      deep: true,
      handler() {
        this.syncText();
      },
    },
  },
  methods: {
    initValue() {
      const value = deepClone(this.text);
      if (this.validateNull(value)) {
        this.fileList = [];
        return;
      }
      const normalized = [];
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (typeof item === 'object') {
            normalized.push({
              url: item[this.valueKey],
              name: item[this.labelKey],
              status: 'done',
            });
          } else if (typeof item === 'string') {
            normalized.push({ url: item, status: 'done' });
          }
        });
      } else if (typeof value === 'string') {
        value.split(',').forEach((url) => {
          if (url) {
            normalized.push({ url, status: 'done' });
          }
        });
      }
      this.fileList = normalized;
    },
    handleAfterRead(files) {
      const queue = Array.isArray(files) ? files : [files];
      queue.forEach((item) => {
        const target = {
          file: item.file || item,
          status: 'uploading',
          message: '上传中',
          url: item.content || '',
          name: item.file?.name || item.name,
        };
        this.fileList.push(target);
        this.uploadSingle(target);
      });
    },
    async uploadSingle(target) {
      try {
        const payload = await uploadFile({
          action: this.action,
          file: target.file,
          headers: this.header,
          data: this.formData,
          fieldName: this.fileName,
        });
        const data = getAsVal(payload, this.propsHttp.res);
        const url = getAsVal(data || payload, this.propsHttp.url) || target.url;
        const name = getAsVal(data || payload, this.propsHttp.name) || target.name || url;
        Object.assign(target, {
          url,
          name,
          status: 'done',
          message: '',
        });
      } catch (error) {
        Object.assign(target, {
          status: 'failed',
          message: error.message || '上传失败',
        });
      }
    },
    handleBeforeDelete(file, detail) {
      if (this.disabled) {
        return false;
      }
      this.fileList.splice(detail.index, 1);
      return false;
    },
    syncText() {
      const completed = this.fileList.filter((item) => item.status === 'done');
      let arr;
      if (this.validateNull(this.propsHttp.name) || this.stringMode) {
        arr = completed.map((f) => f.url);
      } else {
        arr = completed.map((f) => ({ [this.labelKey]: f.name, [this.valueKey]: f.url }));
      }
      const current = Array.isArray(this.text) ? JSON.stringify(this.text) : this.text;
      const next = Array.isArray(arr) ? JSON.stringify(arr) : arr;
      if (current === next) {
        return;
      }
      this.text = arr;
    },
  },
});
</script>

<style lang="scss" scoped>
.wf-upload {
  width: 100%;
}
</style>
