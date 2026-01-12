<!-- src/components/DcUploaderVant.vue -->
<template>
  <div class="dc-uploader-vant">
    <!-- Header: 上传按钮 + 类型提示 -->
    <div class="header">
      <van-uploader
        :accept="acceptStr"
        :multiple="actualMultiple"
        :disabled="disabled"
        :max-count="maxCountAttr"
        :before-read="handleBeforeRead"
        :after-read="handleAfterRead"
        :preview-image="false"
        :preview-full-image="false"
        :deletable="false"
      >
        <van-button type="primary" :disabled="disabled" icon="plus" size="small">
          {{ actualPlaceholder }}
        </van-button>
      </van-uploader>

      <div class="meta">
        <span v-if="actualPlaceholder && simpleModels.length === 0" class="placeholder"></span>
        <span v-if="actualShowTypeHint && acceptDisplay" class="type-hint">
          支持：{{ acceptDisplay }}
          <span v-if="actualMaxSizeMB">，单文件 ≤ {{ actualMaxSizeMB }}MB</span>
          <span v-if="actualEnableImageCompression"
            >，图片压缩至 ≤ {{ actualImageCompressionSizeKB }}KB</span
          >
          <span v-if="actualEnableSquareCrop">，图片将裁剪为1:1比例</span>
          <span v-if="actualMaxCount && actualMaxCount !== Infinity"
            >，最多 {{ actualMaxCount }} 个</span
          >
        </span>
      </div>
    </div>

    <!-- 文件列表 -->
    <van-cell-group v-if="fileObjs.length" inset class="list-card">
      <van-cell
        v-for="(obj, i) in fileObjs"
        :key="(obj.attachId || obj.name || '') + '_' + i"
        :title="displayName(obj)"
        is-link
        @click="previewAt(i)"
      >
        <template #icon>
          <van-icon name="description" class="mr-6" />
        </template>

        <template #right-icon>
          <div class="ops">
            <van-icon
              v-if="actualDeletable && !disabled"
              name="delete-o"
              class="op danger"
              @click.stop="removeAt(i)"
            />
            <van-icon name="eye-o" class="op" @click.stop="previewAt(i)" />
            <!-- <van-icon name="down" class="op" @click.stop="downloadAt(i)" /> -->
          </div>
        </template>
      </van-cell>
    </van-cell-group>

    <!-- 预览弹窗 -->
    <van-popup v-model:show="previewVisible" position="bottom" :style="{ height: '85vh' }" round>
      <div class="preview-header">
        <div class="title">{{ previewTitle || '预览' }}</div>
        <van-icon name="cross" class="close" @click="previewVisible = false" />
      </div>

      <div class="preview-body">
        <iframe
          v-if="finalUrl"
          :src="finalUrl"
          title="文件预览"
          frameborder="0"
          border="0"
          marginwidth="0"
          marginheight="0"
          scrolling="auto"
          allowtransparency="yes"
        ></iframe>
        <div v-else class="no-file">暂无可预览的文件</div>
      </div>
    </van-popup>

    <!-- 图片裁剪弹窗（1:1） -->
    <van-popup
      v-model:show="cropVisible"
      position="bottom"
      :style="{ height: '85vh' }"
      round
      lock-scroll
      @closed="cancelCrop"
    >
      <div class="crop-popup-wrapper">
        <div class="crop-header">
          <div class="title">裁剪图片</div>
          <van-icon name="cross" class="close" @click="cancelCrop" />
        </div>

        <div class="crop-content">
          <div class="crop-container">
            <div class="crop-main-area">
              <div class="crop-wrapper">
                <canvas ref="cropCanvas" class="crop-canvas"></canvas>

                <div ref="cropOverlay" class="crop-overlay">
                  <div
                    ref="cropBox"
                    class="crop-box"
                    @mousedown="startDrag"
                    @touchstart.stop.prevent="startTouchDrag"
                  >
                    <div
                      class="crop-handle nw"
                      @mousedown.stop="startDrag"
                      @touchstart.stop.prevent="startTouchDrag"
                    ></div>
                    <div
                      class="crop-handle ne"
                      @mousedown.stop="startDrag"
                      @touchstart.stop.prevent="startTouchDrag"
                    ></div>
                    <div
                      class="crop-handle sw"
                      @mousedown.stop="startDrag"
                      @touchstart.stop.prevent="startTouchDrag"
                    ></div>
                    <div
                      class="crop-handle se"
                      @mousedown.stop="startDrag"
                      @touchstart.stop.prevent="startTouchDrag"
                    ></div>
                  </div>
                </div>
              </div>

              <div class="crop-tips">
                <van-icon name="info-o" size="14" />
                <span>拖拽方框调整裁剪区域，双指缩放调整大小</span>
              </div>
            </div>

            <div class="crop-sidebar">
              <div class="preview-section">
                <div class="preview-title">预览效果</div>
                <div class="preview-box">
                  <canvas ref="previewCanvas" width="180" height="180"></canvas>
                </div>
                <div class="preview-desc">1:1 正方形</div>
              </div>

              <div class="quick-actions">
                <van-button size="small" plain type="primary" icon="replay" @click="resetCropBox">
                  重置
                </van-button>
              </div>
            </div>
          </div>
        </div>

        <div class="crop-footer">
          <van-button style="flex: 1" @click="cancelCrop">取消</van-button>
          <van-button type="primary" style="flex: 1" @click="confirmCrop">确认裁剪</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script>
import { showToast } from 'vant';
import Api from '@/api/index';
import { downloadFileBlob } from '@/utils/util';

export default {
  name: 'WfUploadV2',
  props: {
    modelValue: { type: [Object, Array, String, null], default: null },
    column: { type: Object, default: () => ({}) },
    multiple: { type: Boolean, default: undefined },
    maxCount: { type: Number, default: undefined },
    disabled: { type: Boolean, default: false },
    accept: { type: [String, Array], default: undefined },
    maxSizeMB: { type: Number, default: undefined },
    uploader: { type: Function, default: Api?.common?.upload?.postFile },
    placeholder: { type: String, default: undefined },
    showTypeHint: { type: Boolean, default: undefined },
    deletable: { type: Boolean, default: undefined },
    previewBaseDomain: { type: String, default: undefined },
    serverDir: { type: String, default: undefined },
    apiPrefix: { type: String, default: undefined },
    filePreviewBase: { type: String, default: import.meta.env.VITE_FILE_URL },
    change: Function,
    enableImageCompression: { type: Boolean, default: undefined },
    imageCompressionSizeKB: { type: Number, default: undefined },
    enableSquareCrop: { type: Boolean, default: undefined },
  },
  emits: ['update:modelValue', 'change'],
  data() {
    return {
      /** 仅保存四字段 */
      fileObjs: [], // [{ link, name, originalName, attachId }]
      simpleModels: [], // [{ path, attachId }]

      previewVisible: false,
      previewTitle: '',
      previewTitleMuted: '',
      previewIndex: -1,

      // 裁剪相关
      cropVisible: false,
      currentFile: null,
      cropData: {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        scale: 1,
        imageWidth: 0,
        imageHeight: 0,
        startX: 0,
        startY: 0,
        startWidth: 0,
        startHeight: 0,
      },

      // 拖拽/缩放
      isDragging: false,
      isResizing: false,
      dragStartX: 0,
      dragStartY: 0,
      resizeHandle: '',

      // 触摸拖拽/缩放
      touchId: null,
      touchAnimationFrame: null,
      previewPending: false,
    };
  },
  computed: {
    // 从 column.params 获取参数，如果没有则使用默认值
    params() {
      return this.column?.params || {};
    },
    actualMultiple() {
      return this.multiple !== undefined
        ? this.multiple
        : this.params.multiple !== undefined
          ? this.params.multiple
          : true;
    },
    actualMaxCount() {
      return this.maxCount !== undefined
        ? this.maxCount
        : this.params.maxCount !== undefined
          ? this.params.maxCount
          : Infinity;
    },
    actualAccept() {
      return this.accept !== undefined
        ? this.accept
        : this.params.accept !== undefined
          ? this.params.accept
          : ['image/*'];
    },
    actualMaxSizeMB() {
      return this.maxSizeMB !== undefined
        ? this.maxSizeMB
        : this.params.maxSizeMB !== undefined
          ? this.params.maxSizeMB
          : null;
    },
    actualPlaceholder() {
      return this.placeholder !== undefined
        ? this.placeholder
        : this.params.placeholder !== undefined
          ? this.params.placeholder
          : '请上传文件';
    },
    actualShowTypeHint() {
      return this.showTypeHint !== undefined
        ? this.showTypeHint
        : this.params.showTypeHint !== undefined
          ? this.params.showTypeHint
          : true;
    },
    actualDeletable() {
      return this.deletable !== undefined
        ? this.deletable
        : this.params.deletable !== undefined
          ? this.params.deletable
          : true;
    },
    actualPreviewBaseDomain() {
      return this.previewBaseDomain !== undefined
        ? this.previewBaseDomain
        : this.params.previewBaseDomain !== undefined
          ? this.params.previewBaseDomain
          : '';
    },
    actualServerDir() {
      return this.serverDir !== undefined
        ? this.serverDir
        : this.params.serverDir !== undefined
          ? this.params.serverDir
          : 'upload';
    },
    actualChange() {
      return this.change !== undefined
        ? this.change
        : this.params.change !== undefined
          ? this.params.change
          : undefined;
    },
    actualApiPrefix() {
      return this.apiPrefix !== undefined
        ? this.apiPrefix
        : this.params.apiPrefix !== undefined
          ? this.params.apiPrefix
          : '/api';
    },
    actualFilePreviewBase() {
      return this.filePreviewBase !== undefined
        ? this.filePreviewBase
        : this.params.filePreviewBase !== undefined
          ? this.params.filePreviewBase
          : import.meta.env.VITE_FILE_URL;
    },
    actualEnableImageCompression() {
      return this.enableImageCompression !== undefined
        ? this.enableImageCompression
        : this.params.enableImageCompression !== undefined
          ? this.params.enableImageCompression
          : false;
    },
    actualImageCompressionSizeKB() {
      return this.imageCompressionSizeKB !== undefined
        ? this.imageCompressionSizeKB
        : this.params.imageCompressionSizeKB !== undefined
          ? this.params.imageCompressionSizeKB
          : 10;
    },
    actualEnableSquareCrop() {
      return this.enableSquareCrop !== undefined
        ? this.enableSquareCrop
        : this.params.enableSquareCrop !== undefined
          ? this.params.enableSquareCrop
          : false;
    },
    actualUploader() {
      return this.uploader !== undefined
        ? this.uploader
        : this.params.uploader !== undefined
          ? this.params.uploader
          : Api?.common?.upload?.postFile;
    },
    acceptStr() {
      const accept = this.actualAccept;
      return Array.isArray(accept) ? accept.join(',') : accept || '';
    },
    acceptDisplay() {
      return this.acceptStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .join('、');
    },
    maxCountAttr() {
      if (!this.actualMultiple) return 1;
      return this.actualMaxCount === Infinity ? 9999 : this.actualMaxCount;
    },
    normalizeAcceptItems() {
      return this.acceptStr
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    },
    finalUrl() {
      if (this.previewIndex < 0 || this.previewIndex >= this.fileObjs.length) return '';
      const obj = this.fileObjs[this.previewIndex];
      if (!obj) return '';

      const raw = obj.link || obj.name || '';
      const abs = this.absoluteUrl(raw);
      if (!abs) return '';

      const base = String(this.filePreviewBase || '').trim();
      if (!base) return abs;

      try {
        const utf8Bytes = new TextEncoder().encode(abs);
        let binaryString = '';
        utf8Bytes.forEach((byte) => (binaryString += String.fromCharCode(byte)));
        const base64 = btoa(binaryString);
        return `${base}?url=${encodeURIComponent(base64)}`;
      } catch (e) {
        console.error('base64编码失败:', e);
        // 编码失败就直接用原地址
        return abs;
      }
    },
  },
  watch: {
    modelValue: {
      immediate: true,
      handler() {
        // 只在初始化时同步，避免上传过程中覆盖
        console.log(this.modelValue, 'modelValue');
        if (this.fileObjs.length === 0) {
          this.syncFromModel();
        }
      },
    },
  },
  methods: {
    validate() {
      // 触发表单验证
      this.$nextTick(() => {
        this.emitChange();
      });
    },
    /* ============ 工具 ============ */
    extname(nameOrUrl = '') {
      const clean = String(nameOrUrl || '').split('?')[0];
      const i = clean.lastIndexOf('.');
      return i >= 0 ? clean.slice(i).toLowerCase() : '';
    },
    basename(p = '') {
      const clean = String(p || '').split('?')[0];
      const i = clean.lastIndexOf('/');
      return i >= 0 ? clean.slice(i + 1) : clean;
    },
    isImageExt(ex) {
      return ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg'].includes(ex);
    },
    displayName(obj) {
      return obj?.originalName || this.basename(obj?.name || obj?.link || '');
    },
    joinUrl(a, b) {
      const A = String(a || ''),
        B = String(b || '');
      if (!A) return B;
      if (!B) return A;
      return `${A.replace(/\/+$/, '')}/${B.replace(/^\/+/, '')}`;
    },
    composeLink(obj) {
      const link = String(obj?.link || '');
      const name = String(obj?.name || '');
      if (link) return link;
      if (this.actualPreviewBaseDomain && name)
        return this.joinUrl(this.actualPreviewBaseDomain, name);
      return '';
    },
    getPathFromAny(val) {
      if (typeof val === 'string') return val.trim();
      if (typeof File !== 'undefined' && val instanceof File) return val.name || '';
      if (val && typeof val === 'object') {
        const pick = (obj) => {
          if (!obj || typeof obj !== 'object') return '';
          if (typeof obj.path === 'string' && obj.path) return obj.path.trim();
          if (typeof obj.name === 'string' && obj.name) return obj.name.trim();
          if (typeof obj.url === 'string' && obj.url) return obj.url.trim();
          if (typeof obj.link === 'string' && obj.link) return obj.link.trim();
          return '';
        };
        let p = pick(val);
        if (p) return p;
        if (val.path && typeof val.path === 'object') {
          p = pick(val.path);
          if (p) return p;
        }
      }
      return '';
    },
    getAttachIdFromAny(val) {
      if (val && typeof val === 'object') {
        if (typeof val.attachId === 'string') return val.attachId;
        if (typeof val.id === 'string') return val.id;
      }
      return '';
    },
    toSimple(full) {
      return {
        path: String(full?.link || full?.name || ''),
        attachId: String(full?.attachId || ''),
      };
    },
    fromSimple(simple) {
      const rawPath = this.getPathFromAny(simple?.path ?? simple);
      const name = String(rawPath || '');
      const attachId = String(this.getAttachIdFromAny(simple) || '');
      const tentative = { name, link: '' };
      const link = this.composeLink(tentative);
      const originalName = String(this.basename(name) || this.basename(link) || '');
      return {
        link: String(link || ''),
        name: String(name || ''),
        originalName,
        attachId,
      };
    },

    /* ============ emit：出口再保险 ============ */
    emitChange() {
      const list = this.fileObjs.map((o) => ({
        link: String(o.link || this.composeLink(o) || ''),
        name: String(o.name || ''),
        originalName: String(o.originalName || this.basename(o.name || o.link || '') || ''),
        attachId: String(o.attachId || ''),
      }));
      this.$emit('change', list);
      if (this.actualChange && typeof this.actualChange === 'function') {
        this.actualChange({ value: list });
      }
    },
    emitModel() {
      if (this.actualMultiple) {
        this.$emit(
          'update:modelValue',
          this.simpleModels.map((x) => ({
            path: String(x.path || ''),
            attachId: String(x.attachId || ''),
          }))
        );
      } else {
        const first = this.simpleModels[0];
        this.$emit(
          'update:modelValue',
          first ? { path: String(first.path || ''), attachId: String(first.attachId || '') } : null
        );
      }
    },

    /* ============ 模型同步 ============ */
    syncFromModel() {
      const mv = this.modelValue;
      let simples = [];
      if (Array.isArray(mv)) {
        simples = mv
          .map((x) => ({
            path: this.getPathFromAny(x?.path ?? x),
            attachId: this.getAttachIdFromAny(x),
          }))
          .filter((x) => x.path);
      } else if (mv && typeof mv === 'object') {
        const path = this.getPathFromAny(mv?.path ?? mv);
        const attachId = this.getAttachIdFromAny(mv);
        simples = path ? [{ path, attachId }] : [];
      } else if (typeof mv === 'string') {
        try {
          const multi = JSON.parse(mv);
          const path = this.getPathFromAny(multi?.path ?? multi);
          const attachId = this.getAttachIdFromAny(multi);
          simples = path ? [{ path, attachId }] : [];
        } catch (e) {
          console.error('JSON解析失败:', e);
          const path = this.getPathFromAny(mv);
          simples = path ? [{ path, attachId: '' }] : [];
        }
      } else {
        simples = [];
      }

      simples = simples.map((s) => ({
        path: String(s.path || ''),
        attachId: String(s.attachId || ''),
      }));
      this.simpleModels = this.actualMultiple ? simples : simples.slice(0, 1);
      this.fileObjs = this.simpleModels.map(this.fromSimple);
    },

    /* ============ 列表操作 ============ */
    removeAt(index) {
      this.fileObjs.splice(index, 1);
      this.simpleModels.splice(index, 1);
      this.emitModel();
      this.emitChange();
      // 触发验证
      this.$nextTick(() => {
        this.validate();
      });
      // 触发验证
      this.$nextTick(() => {
        this.validate();
      });
    },

    /* ============ 校验（类型/大小/数量） ============ */
    matchAccept(file) {
      if (!this.normalizeAcceptItems.length) return true;
      const name = (file?.name || '').toLowerCase();
      const type = (file?.type || '').toLowerCase();
      const ex = this.extname(name);

      return this.normalizeAcceptItems.some((rule) => {
        if (rule === '*/*') return true;
        if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, rule.indexOf('/*')) + '/');
        if (rule.startsWith('.')) return ex === rule;
        return type === rule;
      });
    },
    currentCount() {
      return this.simpleModels.length;
    },

    // van-uploader: before-read
    handleBeforeRead(fileOrFiles) {
      // Vant 可能传 File 或 File[]
      const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
      const incoming = files.length;

      const maxCount = this.actualMaxCount === Infinity ? Infinity : this.maxCountAttr;
      if (maxCount !== Infinity && this.currentCount() + incoming > maxCount) {
        showToast(`最多上传 ${maxCount} 个文件`);
        return false;
      }

      for (const f of files) {
        if (!this.matchAccept(f)) {
          showToast('文件类型不支持');
          return false;
        }
        if (this.actualMaxSizeMB && f.size > this.actualMaxSizeMB * 1024 * 1024) {
          showToast(`单文件不能超过 ${this.actualMaxSizeMB}MB`);
          return false;
        }
      }
      return true;
    },

    // van-uploader: after-read
    async handleAfterRead(items) {
      // items: { file, content, url } | Array<...>
      const list = Array.isArray(items) ? items : [items];

      for (const it of list) {
        const file = it?.file;
        if (!file) continue;

        try {
          // 启用1:1裁剪且是图片 → 打开裁剪弹窗，等待 confirmCrop 再上传
          if (this.actualEnableSquareCrop && String(file.type || '').startsWith('image/')) {
            this.currentFile = file;
            await this.showCropDialog(file);
            // 等用户确认裁剪后再上传
            continue;
          }

          await this.processAndUpload(file);
        } catch (e) {
          showToast(e?.message || '上传失败');
        }
      }
    },

    /* ============ 图片压缩 ============ */
    compressImage(file, maxSizeKB) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const maxSizeBytes = maxSizeKB * 1024;
            let quality = 0.8;

            const tryCompress = () => {
              canvas.toBlob(
                (blob) => {
                  if (!blob) return reject(new Error('压缩失败：无法生成图片数据'));
                  if (blob.size <= maxSizeBytes || quality <= 0.1) {
                    const compressedFile = new File(
                      [blob],
                      file.name.replace(/\.[^/.]+$/, '.jpg'),
                      {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                      }
                    );
                    resolve(compressedFile);
                  } else {
                    quality -= 0.1;
                    tryCompress();
                  }
                },
                'image/jpeg',
                quality
              );
            };

            tryCompress();
          };
          img.onerror = () => reject(new Error('图片加载失败'));
          img.src = event.target.result;
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsDataURL(file);
      });
    },

    /* ============ 覆盖上传请求（与后端结构适配） ============ */
    async processAndUpload(file) {
      // 图片压缩
      let processedFile = file;
      if (this.actualEnableImageCompression && String(file.type || '').startsWith('image/')) {
        try {
          processedFile = await this.compressImage(file, this.actualImageCompressionSizeKB);
          showToast(`图片已压缩至 ${(processedFile.size / 1024).toFixed(2)}KB`);
        } catch (err) {
          // 不改变逻辑：压缩失败 -> 用原图继续上传
          console.error('图片压缩失败:', err);
          showToast('图片压缩失败，使用原图上传');
          processedFile = file;
        }
      }

      const formData = new FormData();
      formData.append('file', processedFile);
      const params = { filePath: this.actualServerDir };

      const uploaderFn = this.actualUploader || Api?.common?.upload?.postFile;
      const { data: resp } = await uploaderFn(formData, params);
      console.log('resp', resp);
      if (!resp || resp.code !== 200 || !resp.data) throw new Error(resp?.msg || '上传失败');

      const full = {
        link: String(resp.data.link || ''),
        name: String(resp.data.link || ''),
        originalName: String(resp.data.originalName || file.name || ''),
        attachId: String(resp.data.attachId || ''),
      };

      if (!full.link && this.actualPreviewBaseDomain && resp?.data?.link) {
        full.link = this.joinUrl(this.actualPreviewBaseDomain, resp.data.link);
      }
      if (!full.link) throw new Error('上传接口未返回文件路径（link）');

      // 写入本地状态（保持原逻辑）
      if (this.actualMultiple) {
        this.fileObjs.push(full);
        this.simpleModels.push(this.toSimple(full));
      } else {
        this.fileObjs = [full];
        this.simpleModels = [this.toSimple(full)];
      }

      this.emitModel();
      this.emitChange();
    },

    /* ============ 下载 ============ */
    downloadAt(index) {
      const obj = this.fileObjs[index];
      if (!obj) return;

      const finalUrl = obj.link || '';
      if (!finalUrl) {
        showToast('暂无可下载地址');
        return;
      }

      const filename = this.displayName(obj) || 'download';
      try {
        downloadFileBlob(finalUrl, filename);
      } catch (err) {
        showToast(err?.message || '下载失败');
      }
    },

    /* ============ 预览 ============ */
    absoluteUrl(u) {
      if (!u) return '';
      if (/^https?:\/\//i.test(u)) return u;
      if (u.startsWith('/')) return `${location.origin}${u}`;
      return `${location.origin}/${u}`;
    },
    previewAt(index) {
      const obj = this.fileObjs[index];
      if (!obj) return;

      this.previewIndex = index;
      this.previewVisible = true;
      this.previewTitle = this.displayName(obj) || '预览';
      this.previewTitleMuted = obj.originalName || '';
    },

    /* ============ 图片裁剪：显示弹窗 ============ */
    showCropDialog(file) {
      return new Promise((resolve, reject) => {
        this.cropVisible = true;
        this.cropResolve = resolve;
        this.cropReject = reject;

        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = this.$refs.cropCanvas;
            const ctx = canvas.getContext('2d');

            const maxSize = Math.min(600, window.innerWidth - 40, window.innerHeight * 0.45);

            let scale = 1;
            if (img.width > maxSize) scale = maxSize / img.width;
            if (img.height > maxSize) scale = Math.min(scale, maxSize / img.height);

            const displayWidth = img.width * scale;
            const displayHeight = img.height * scale;

            const canvasSize = Math.max(displayWidth, displayHeight);
            canvas.width = canvasSize;
            canvas.height = canvasSize;

            const offsetX = (canvasSize - displayWidth) / 2;
            const offsetY = (canvasSize - displayHeight) / 2;

            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvasSize, canvasSize);
            ctx.drawImage(img, offsetX, offsetY, displayWidth, displayHeight);

            const size = Math.min(displayWidth, displayHeight);
            const x = (canvasSize - size) / 2;
            const y = (canvasSize - size) / 2;

            this.cropData = {
              x,
              y,
              width: size,
              height: size,
              scale,
              imageWidth: img.width,
              imageHeight: img.height,
              offsetX,
              offsetY,
              displayWidth,
              displayHeight,
              startX: x,
              startY: y,
              startWidth: size,
              startHeight: size,
            };

            this.updateCropBox();
            this.updatePreview();
          };

          img.onerror = () => {
            this.cropVisible = false;
            reject(new Error('图片加载失败'));
          };
          img.src = e.target.result;
        };

        reader.onerror = () => {
          this.cropVisible = false;
          reject(new Error('文件读取失败'));
        };
        reader.readAsDataURL(file);
      });
    },

    updateCropBox() {
      const box = this.$refs.cropBox;
      if (!box) return;
      const { x, y, width, height } = this.cropData;
      box.style.transform = `translate(${x}px, ${y}px)`;
      box.style.width = `${width}px`;
      box.style.height = `${height}px`;
    },

    updatePreview() {
      if (this.previewPending) return;
      this.previewPending = true;

      requestAnimationFrame(() => {
        const previewCanvas = this.$refs.previewCanvas;
        const cropCanvas = this.$refs.cropCanvas;
        if (!previewCanvas || !cropCanvas) {
          this.previewPending = false;
          return;
        }

        const ctx = cropCanvas.getContext('2d');
        const previewCtx = previewCanvas.getContext('2d');

        const { x, y, width, height } = this.cropData;

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = width;
        tempCanvas.height = height;

        const imageData = ctx.getImageData(x, y, width, height);
        tempCtx.putImageData(imageData, 0, 0);

        previewCtx.clearRect(0, 0, 200, 200);
        previewCtx.drawImage(tempCanvas, 0, 0, 200, 200);

        this.previewPending = false;
      });
    },

    /* ============ PC Mouse 拖拽/缩放（保留） ============ */
    startDrag(event) {
      if (event.target.classList.contains('crop-handle')) {
        this.isResizing = true;
        this.resizeHandle = event.target.className.split(' ')[1];
      } else {
        this.isDragging = true;
      }

      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;

      this.cropData.startX = this.cropData.x;
      this.cropData.startY = this.cropData.y;
      this.cropData.startWidth = this.cropData.width;
      this.cropData.startHeight = this.cropData.height;

      // 添加拖拽状态样式
      const cropBox = this.$refs.cropBox;
      if (cropBox) {
        cropBox.classList.add('dragging');
      }

      document.addEventListener('mousemove', this.handleMouseMove);
      document.addEventListener('mouseup', this.handleMouseUp);
      event.preventDefault();
    },
    handleMouseMove(event) {
      const deltaX = event.clientX - this.dragStartX;
      const deltaY = event.clientY - this.dragStartY;
      this.applyDragResize(deltaX, deltaY);
    },
    handleMouseUp() {
      this.isDragging = false;
      this.isResizing = false;
      this.resizeHandle = '';

      // 移除拖拽状态样式
      const cropBox = this.$refs.cropBox;
      if (cropBox) {
        cropBox.classList.remove('dragging');
      }

      document.removeEventListener('mousemove', this.handleMouseMove);
      document.removeEventListener('mouseup', this.handleMouseUp);
    },

    /* ============ Mobile Touch 拖拽/缩放（优化版） ============ */
    startTouchDrag(event) {
      const t = event.changedTouches[0];
      if (!t) return;

      const target = event.target;
      if (target.classList && target.classList.contains('crop-handle')) {
        this.isResizing = true;
        this.resizeHandle = target.className.split(' ')[1];
      } else {
        this.isDragging = true;
      }

      this.touchId = t.identifier;
      this.dragStartX = t.clientX;
      this.dragStartY = t.clientY;

      this.cropData.startX = this.cropData.x;
      this.cropData.startY = this.cropData.y;
      this.cropData.startWidth = this.cropData.width;
      this.cropData.startHeight = this.cropData.height;

      this.touchAnimationFrame = null;
      this.lastTouchTime = Date.now();

      document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
      document.addEventListener('touchend', this.handleTouchEnd, { passive: false });
      document.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });
    },
    handleTouchMove(event) {
      const touch = Array.from(event.changedTouches).find((t) => t.identifier === this.touchId);
      if (!touch) return;

      event.preventDefault();

      if (this.touchAnimationFrame) {
        cancelAnimationFrame(this.touchAnimationFrame);
      }

      this.touchAnimationFrame = requestAnimationFrame(() => {
        const deltaX = touch.clientX - this.dragStartX;
        const deltaY = touch.clientY - this.dragStartY;
        this.applyDragResize(deltaX, deltaY);
        this.touchAnimationFrame = null;
      });
    },
    handleTouchEnd(event) {
      const touch = Array.from(event.changedTouches).find((t) => t.identifier === this.touchId);
      if (!touch) return;

      if (this.touchAnimationFrame) {
        cancelAnimationFrame(this.touchAnimationFrame);
        this.touchAnimationFrame = null;
      }

      this.isDragging = false;
      this.isResizing = false;
      this.resizeHandle = '';
      this.touchId = null;

      document.removeEventListener('touchmove', this.handleTouchMove);
      document.removeEventListener('touchend', this.handleTouchEnd);
      document.removeEventListener('touchcancel', this.handleTouchEnd);
    },

    /* ============ 拖拽/缩放：核心逻辑（与原版一致） ============ */
    applyDragResize(deltaX, deltaY) {
      const cropCanvas = this.$refs.cropCanvas;
      if (!cropCanvas) return;

      if (this.isDragging) {
        const newX = this.cropData.startX + deltaX;
        const newY = this.cropData.startY + deltaY;

        const canvasWidth = cropCanvas.width;
        const canvasHeight = cropCanvas.height;

        this.cropData.x = Math.max(0, Math.min(newX, canvasWidth - this.cropData.width));
        this.cropData.y = Math.max(0, Math.min(newY, canvasHeight - this.cropData.height));

        this.updateCropBox();
        this.updatePreview();
        return;
      }

      if (this.isResizing) {
        const handle = this.resizeHandle;
        const startX = this.cropData.startX;
        const startY = this.cropData.startY;
        const startWidth = this.cropData.startWidth;
        const startHeight = this.cropData.startHeight;

        let newWidth = startWidth;
        let newHeight = startHeight;

        if (handle.includes('w')) newWidth = startWidth - deltaX;
        if (handle.includes('e')) newWidth = startWidth + deltaX;
        if (handle.includes('n')) newHeight = startHeight - deltaY;
        if (handle.includes('s')) newHeight = startHeight + deltaY;

        const minSize = 50;
        const maxSize = Math.min(cropCanvas.width, cropCanvas.height);
        const size = Math.max(minSize, Math.min(newWidth, newHeight, maxSize));

        if (handle === 'nw') {
          this.cropData.x = startX + startWidth - size;
          this.cropData.y = startY + startHeight - size;
        } else if (handle === 'ne') {
          this.cropData.x = startX;
          this.cropData.y = startY + startHeight - size;
        } else if (handle === 'sw') {
          this.cropData.x = startX + startWidth - size;
          this.cropData.y = startY;
        } else if (handle === 'se') {
          this.cropData.x = startX;
          this.cropData.y = startY;
        }

        this.cropData.width = size;
        this.cropData.height = size;

        const maxPositionX = Math.max(0, cropCanvas.width - this.cropData.width);
        const maxPositionY = Math.max(0, cropCanvas.height - this.cropData.height);

        this.cropData.x = Math.max(0, Math.min(this.cropData.x, maxPositionX));
        this.cropData.y = Math.max(0, Math.min(this.cropData.y, maxPositionY));

        this.updateCropBox();
        this.updatePreview();
      }
    },

    /* ============ 确认裁剪并上传 ============ */
    async confirmCrop() {
      if (!this.currentFile || !this.$refs.cropCanvas) return;

      try {
        const { x, y, width, height, scale } = this.cropData;

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        const actualX = x / scale;
        const actualY = y / scale;
        const actualWidth = width / scale;
        const actualHeight = height / scale;

        tempCanvas.width = actualWidth;
        tempCanvas.height = actualHeight;

        await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            tempCtx.drawImage(
              img,
              actualX,
              actualY,
              actualWidth,
              actualHeight,
              0,
              0,
              actualWidth,
              actualHeight
            );

            tempCanvas.toBlob(
              async (blob) => {
                if (!blob) {
                  showToast('裁剪失败：无法生成图片数据');
                  reject(new Error('裁剪失败：无法生成图片数据'));
                  return;
                }

                const croppedFile = new File([blob], this.currentFile.name, {
                  type: this.currentFile.type || 'image/jpeg',
                  lastModified: Date.now(),
                });

                this.cropVisible = false;
                showToast('图片已裁剪为1:1比例');

                await this.processAndUpload(croppedFile);
                this.currentFile = null;
                resolve();
              },
              this.currentFile.type || 'image/jpeg',
              0.95
            );
          };

          img.onerror = () => {
            showToast('图片加载失败');
            reject(new Error('图片加载失败'));
          };

          const reader = new FileReader();
          reader.onload = (e) => (img.src = e.target.result);
          reader.onerror = () => {
            showToast('文件读取失败');
            reject(new Error('文件读取失败'));
          };
          reader.readAsDataURL(this.currentFile);
        });

        if (this.cropResolve) {
          this.cropResolve(true);
          this.cropResolve = null;
        }
      } catch (err) {
        console.error('图片裁剪失败:', err);
        showToast('图片裁剪失败');
        if (this.cropReject) {
          this.cropReject(err);
          this.cropReject = null;
        }
      }
    },

    cancelCrop() {
      this.cropVisible = false;
      this.currentFile = null;
      if (this.cropReject) {
        this.cropReject(new Error('用户取消裁剪'));
        this.cropReject = null;
      }
      this.cropResolve = null;
    },
    // 新增：重置裁剪框
    resetCropBox() {
      const canvas = this.$refs.cropCanvas;
      if (!canvas) return;

      const { offsetX, offsetY, displayWidth, displayHeight } = this.cropData;
      const size = Math.min(displayWidth, displayHeight);
      const x = offsetX + (displayWidth - size) / 2;
      const y = offsetY + (displayHeight - size) / 2;

      this.cropData = {
        ...this.cropData,
        x,
        y,
        width: size,
        height: size,
        startX: x,
        startY: y,
        startWidth: size,
        startHeight: size,
      };

      this.updateCropBox();
      this.updatePreview();
    },
    // 新增：旋转图片（90度）
    rotateImage() {
      // 这里可以实现图片旋转逻辑
      showToast('旋转功能开发中');
    },

    /* ============ 兼容保留（原文件有） ============ */
    toApiUploadPath(input) {
      try {
        const u = new URL(input);
        const parts = u.pathname.split('/');
        const idx = parts.indexOf('upload');
        if (idx !== -1) return parts.slice(idx).join('/');
        return u.pathname.startsWith('/') ? u.pathname : '/' + u.pathname;
      } catch {
        const m = String(input)
          .replace(/^https?:\/\/[^/]+/, '')
          .match(/\/upload\/.*/);
        return m ? m[0] : String(input).startsWith('/') ? String(input) : '/' + String(input);
      }
    },
  },
};
</script>

<style scoped lang="scss">
.dc-uploader-vant {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  .meta {
    display: flex;
    align-items: baseline;
    gap: 10px;

    .placeholder {
      color: var(--van-text-color-2);
    }
    .type-hint {
      color: var(--van-text-color-2);
      font-size: 12px;
      line-height: 1.2;
    }
  }
}

.list-card {
  overflow: hidden;

  .ops {
    display: inline-flex;
    align-items: center;
    gap: 10px;

    .op {
      font-size: 18px;
      color: var(--van-text-color);
    }
    .danger {
      color: #ee0a24;
    }
  }
}

.mr-6 {
  margin-right: 6px;
}

/* 裁剪弹窗包装器 - 实现头部固定、内容可滑动、底部固定 */
.crop-popup-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 裁剪头部 - 固定 */
.crop-header {
  flex: 0 0 auto;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: #fff;
  z-index: 10;

  .title {
    font-size: 16px;
    font-weight: 600;
  }
  .close {
    font-size: 20px;
  }
}

/* 裁剪内容区域 - 可滑动 */
.crop-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.preview-body {
  height: calc(85vh - 44px);
  display: flex;

  > iframe {
    width: 100%;
    height: 100%;
    border: none;
    display: block;
  }

  .no-file {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
  }
}

/* ================= 裁剪区域美化 ================= */

/* 裁剪整体容器 - 优化为上下布局 */
.crop-container {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f7f8fa;
  min-height: 100%;
}

/* 主裁剪区域 */
.crop-main-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
  // flex: 1;
}

/* 图片区域 - 优化显示效果 */
.crop-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

/* 原图画布 */
.crop-canvas {
  display: block;
  max-width: 100%;
  border-radius: 12px;
}

/* 遮罩层（暗化非裁剪区域） */
.crop-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
  }
}

/* 裁剪框 - 优化视觉效果和拖动性能 */
.crop-box {
  position: absolute;
  left: 0;
  top: 0;
  border: 2px solid #fff;
  box-shadow:
    0 0 0 9999px rgba(0, 0, 0, 0.6),
    0 0 20px rgba(255, 255, 255, 0.8),
    inset 0 0 0 1px rgba(255, 255, 255, 0.9);
  background: transparent;
  cursor: move;
  touch-action: none;
  pointer-events: auto;
  border-radius: 8px;
  will-change: transform, width, height;

  /* 中心参考线 - 优化显示 */
  &::before,
  &::after {
    content: '';
    position: absolute;
    background: rgba(255, 255, 255, 0.8);
    z-index: 1;
  }

  /* 横线 */
  &::before {
    left: 0;
    right: 0;
    top: 50%;
    height: 1px;
    transform: translateY(-0.5px);
  }

  /* 竖线 */
  &::after {
    top: 0;
    bottom: 0;
    left: 50%;
    width: 1px;
    transform: translateX(-0.5px);
  }
}

/* 拖拽点 - 优化交互体验和触摸区域 */
.crop-handle {
  position: absolute;
  width: 24px;
  height: 24px;
  background: #fff;
  border: 3px solid #1989fa;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  pointer-events: auto;
  cursor: pointer;
  will-change: transform;
  touch-action: none;
}

.crop-handle:active {
  transform: scale(1.15);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

/* 四个角 - 优化位置 */
.crop-handle.nw {
  top: -9px;
  left: -9px;
  cursor: nw-resize;
}
.crop-handle.ne {
  top: -9px;
  right: -9px;
  cursor: ne-resize;
}
.crop-handle.sw {
  bottom: -9px;
  left: -9px;
  cursor: sw-resize;
}
.crop-handle.se {
  bottom: -9px;
  right: -9px;
  cursor: se-resize;
}

/* 侧边栏 - 优化布局 */
.crop-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 200px;
}

/* 预览区域 - 优化样式 */
.preview-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

.preview-title {
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 14px;
  color: #323233;
  text-align: center;
}

.preview-box {
  width: 180px;
  height: 180px;
  border-radius: 12px;
  overflow: hidden;
  background: #f7f8fa;
  border: 1px solid #ebedf0;
  margin-bottom: 8px;
}

.preview-desc {
  font-size: 12px;
  color: #969799;
  text-align: center;
}

/* 快速操作按钮 */
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 底部按钮区 - 固定 */
.crop-footer {
  flex: 0 0 auto;
  padding: 16px;
  display: flex;
  gap: 12px;
  background: #fff;
  border-top: 1px solid #ebedf0;
  z-index: 10;
}

/* 提示信息 */
.crop-tips {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(25, 137, 250, 0.1);
  border-radius: 8px;
  font-size: 12px;
  color: #1989fa;
  margin-top: 8px;
}

/* 响应式布局 - 小屏幕优化 */
@media (max-width: 768px) {
  .crop-container {
    flex-direction: column;
  }

  .crop-sidebar {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
  }

  .preview-section {
    flex: 1;
  }

  .quick-actions {
    flex-direction: row;
  }
}

/* 拖拽时的视觉反馈 */
.crop-box.dragging {
  opacity: 0.8;
  border-color: #07c160;
}
</style>
