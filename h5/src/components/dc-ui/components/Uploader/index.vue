<!-- src/components/DcUploader.vue -->
<template>
  <div class="dc-uploader">
    <van-uploader
      v-model="fileList"
      :accept="acceptStr"
      :multiple="multiple"
      :max-count="maxCountAttr"
      :disabled="disabled"
      :preview-full-image="false"
      :before-read="handleBeforeRead"
      :after-read="handleAfterRead"
      result-type="file"
      :deletable="deletable && !disabled"
      upload-icon="description"
      @delete="onDelete"
    />

    <div class="dc-uploader__header">
      <div v-if="placeholder && simpleModels.length === 0" class="placeholder">
        {{ placeholder }}
      </div>
      <div v-if="showTypeHint && acceptDisplay" class="type-hint">
        支持：{{ acceptDisplay }}
        <span v-if="maxSizeMB">，单文件 ≤ {{ maxSizeMB }}MB</span>
        <span v-if="maxCount && maxCount !== Infinity">，最多 {{ maxCount }} 个</span>
      </div>
    </div>

    <!-- 列表（统一多文件样式 + 仅展示文件名称） -->
    <van-cell-group v-if="fileObjs.length" inset class="dc-uploader__list">
      <van-cell
        v-for="(obj, i) in fileObjs"
        :key="(obj.attachId || obj.name || '') + '_' + i"
        :title="displayName(obj)"
        is-link
        @click="downloadAt(i)"
      >
        <template #right-icon>
          <van-icon v-if="deletable && !disabled" name="delete-o" @click.stop="removeAt(i)" />
        </template>
      </van-cell>
    </van-cell-group>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { showToast } from 'vant';
import Api from '@/api/index';
import { DownloadUtil } from '@/utils/download';

/**
 * v-model：
 * - multiple=false: { path: string, attachId: string } | null
 * - multiple=true : Array<{ path: string, attachId: string }>
 *
 * @change：返回 [{ link, name, originalName, attachId }]
 */
const props = defineProps({
  modelValue: { type: [Object, Array, String, null], default: null },
  multiple: { type: Boolean, default: true },
  maxCount: { type: Number, default: Infinity },
  disabled: { type: Boolean, default: false },
  accept: { type: [String, Array], default: () => ['image/*'] },
  maxSizeMB: { type: Number, default: null },
  uploader: { type: Function, default: Api?.common?.upload?.postFile },
  placeholder: { type: String, default: '请上传文件' },
  showTypeHint: { type: Boolean, default: true },
  deletable: { type: Boolean, default: true },
  previewBaseDomain: { type: String, default: '' },
  serverDir: { type: String, default: 'upload/selfResume' },
  apiPrefix: { type: String, default: '/api' },
});

const emits = defineEmits(['update:modelValue', 'change']);

/** 仅保存四字段 */
const fileObjs = ref([]); // [{ link, name, originalName, attachId }]
const simpleModels = ref([]); // [{ path, attachId }]
const fileList = ref([]); // Vant 预览

/* ============ accept / maxCount ============ */
const acceptStr = computed(() =>
  Array.isArray(props.accept) ? props.accept.join(',') : props.accept || ''
);
const acceptDisplay = computed(() =>
  acceptStr.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .join('、')
);
const maxCountAttr = computed(() =>
  !props.multiple ? 1 : props.maxCount === Infinity ? undefined : props.maxCount
);

/* ============ 工具 ============ */
const extname = (nameOrUrl = '') => {
  const clean = String(nameOrUrl || '').split('?')[0];
  const i = clean.lastIndexOf('.');
  return i >= 0 ? clean.slice(i).toLowerCase() : '';
};
const basename = (p = '') => {
  const clean = String(p || '').split('?')[0];
  const i = clean.lastIndexOf('/');
  return i >= 0 ? clean.slice(i + 1) : clean;
};
const isImageExt = (ex) => ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg'].includes(ex);
const isImageObj = (obj) => {
  const hint = obj?.originalName || obj?.name || obj?.link || '';
  return isImageExt(extname(hint));
};
const displayName = (obj) => obj?.originalName || basename(obj?.name || obj?.link || '');
const joinUrl = (a, b) => {
  const A = String(a || ''),
    B = String(b || '');
  if (!A) return B;
  if (!B) return A;
  return `${A.replace(/\/+$/, '')}/${B.replace(/^\/+/, '')}`;
};
const isHttpUrl = (val) => /^(https?:)?\/\//i.test(String(val || ''));

const composeLink = (obj) => {
  const link = String(obj?.link || '');
  const name = String(obj?.name || '');
  if (link) return link;
  if (!name) return '';
  if (isHttpUrl(name)) return name;
  if (props.previewBaseDomain) return joinUrl(props.previewBaseDomain, name);
  if (name.startsWith('/')) return joinUrl(props.apiPrefix, name);
  if (props.apiPrefix) return joinUrl(props.apiPrefix, name);
  return name;
};

/* ============ 入口保险：深提取 path / attachId，强制字符串化 ============ */
const getPathFromAny = (val) => {
  // 字符串
  if (typeof val === 'string') return val.trim();

  // File
  if (typeof File !== 'undefined' && val instanceof File) return val.name || '';

  // 对象（含嵌套）
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
};

const getAttachIdFromAny = (val) => {
  if (val && typeof val === 'object') {
    if (typeof val.attachId === 'string') return val.attachId;
    if (typeof val.id === 'string') return val.id;
  }
  return '';
};

/* ============ 简化模型 <-> 展示对象（四字段），中间再强制字符串化 ============ */
const toSimple = (full) => ({
  path: String(full?.link || ''),
  attachId: String(full?.attachId || ''),
});

const fromSimple = (simple) => {
  const rawPath = getPathFromAny(simple?.path ?? simple);
  const name = String(rawPath || '');
  const attachId = String(getAttachIdFromAny(simple) || '');

  // 若 name 是 URL 也能用，但我们仍把 link 作为最终预览入口
  const tentative = { name, link: '', originalName: '' };
  const link = composeLink(tentative); // 会用 previewBaseDomain + name 拼
  const originalName = String(basename(name) || basename(link) || '');

  return {
    link: String(link || ''),
    name: String(name || ''),
    originalName,
    attachId,
  };
};

/* ============ emit：出口再保险，全部 String(...) ============ */
const emitChange = () => {
  const list = fileObjs.value.map((o) => ({
    link: String(o.link || composeLink(o) || ''),
    name: String(o.name || ''),
    originalName: String(o.originalName || basename(o.name || o.link || '') || ''),
    attachId: String(o.attachId || ''),
  }));
  emits('change', list);
};

const emitModel = () => {
  if (props.multiple) {
    emits(
      'update:modelValue',
      simpleModels.value.map((x) => ({
        path: String(x.path || ''),
        attachId: String(x.attachId || ''),
      }))
    );
  } else {
    const first = simpleModels.value[0];
    emits(
      'update:modelValue',
      first ? { path: String(first.path || ''), attachId: String(first.attachId || '') } : null
    );
  }
};

/* ============ 模型 <-> 视图 同步（入口加固） ============ */
const rebuildFileListFromObjs = () => {
  fileList.value = fileObjs.value.map((obj) => ({
    url: composeLink(obj),
    isImage: isImageObj(obj),
    status: 'done',
  }));
};

const syncFromModel = () => {
  const mv = props.modelValue;
  let simples = [];
  if (Array.isArray(mv)) {
    simples = mv
      .map((x) => ({ path: getPathFromAny(x?.path ?? x), attachId: getAttachIdFromAny(x) }))
      .filter((x) => x.path);
  } else if (mv && typeof mv === 'object') {
    const path = getPathFromAny(mv?.path ?? mv);
    const attachId = getAttachIdFromAny(mv);
    simples = path ? [{ path, attachId }] : [];
  } else if (typeof mv === 'string') {
    simples = mv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((p) => ({ path: p, attachId: '' }));
  } else {
    simples = [];
  }

  // 统一字符串化
  simples = simples.map((s) => ({
    path: String(s.path || ''),
    attachId: String(s.attachId || ''),
  }));

  simpleModels.value = props.multiple ? simples : simples.slice(0, 1);
  fileObjs.value = simpleModels.value.map(fromSimple);
  rebuildFileListFromObjs();
};

watch(() => props.modelValue, syncFromModel, { immediate: true });

/* ============ 删除 ============ */
const removeAt = (index) => {
  fileObjs.value.splice(index, 1);
  simpleModels.value.splice(index, 1);
  fileList.value.splice(index, 1);
  emitModel();
  emitChange();
};

const onDelete = (item, detail) => {
  const idx =
    typeof detail?.index === 'number' ? detail.index : fileList.value.findIndex((x) => x === item);
  if (idx >= 0) removeAt(idx);
};

/* ============ 选择前校验 ============ */
const normalizeAcceptItems = computed(() =>
  acceptStr.value
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
);

const matchAccept = (file) => {
  if (!normalizeAcceptItems.value.length) return true;
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();
  const ex = extname(name);

  return normalizeAcceptItems.value.some((rule) => {
    if (rule === '*/*') return true;
    if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, rule.indexOf('/*')) + '/');
    if (rule.startsWith('.')) return ex === rule;
    return type === rule;
  });
};

const handleBeforeRead = (fileOrFiles) => {
  const arr = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];

  if (props.maxCount !== Infinity) {
    const current = simpleModels.value.length;
    const will = current + arr.length;
    if (will > (maxCountAttr.value ?? Infinity)) {
      showToast(`最多上传 ${maxCountAttr.value} 个文件`);
      return false;
    }
  }
  for (const it of arr) {
    const f = it instanceof File ? it : it.file;
    if (!matchAccept(f)) {
      showToast('文件类型不支持');
      return false;
    }
    if (props.maxSizeMB && f.size > props.maxSizeMB * 1024 * 1024) {
      showToast(`单文件不能超过 ${props.maxSizeMB}MB`);
      return false;
    }
  }
  return true;
};

/* ============ 选择后上传（固定 {code,success,data}） ============ */
const handleAfterRead = async (fileOrFiles) => {
  const items = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
  const params = { filePath: props.serverDir };

  for (const it of items) {
    const rawFile = it.file || it;
    it.status = 'uploading';
    it.message = '上传中...';

    const formData = new FormData();
    formData.append('file', rawFile);

    try {
      const { data: resp } = await props.uploader(formData, params);
      if (!resp || resp.code !== 200 || !resp.data) throw new Error(resp?.msg || '上传失败');

      // 出口强制字符串化
      const full = {
        link: String(
          resp.data.link ||
            (props.previewBaseDomain && resp.data.link
              ? joinUrl(props.previewBaseDomain, resp.data.link)
              : '') ||
            ''
        ),
        name: String(resp.data.link || ''),
        originalName: String(resp.data.originalName || rawFile.link || ''),
        attachId: String(resp.data.attachId || ''),
      };

      if (!full.link) throw new Error('上传接口未返回文件路径（link）');

      it.status = 'done';
      it.url = composeLink(full);
      it.isImage = isImageObj(full);

      if (props.multiple) {
        fileObjs.value.push(full);
        simpleModels.value.push(toSimple(full));
      } else {
        fileObjs.value = [full];
        simpleModels.value = [toSimple(full)];
      }

      emitModel();
      emitChange();
    } catch (e) {
      it.status = 'failed';
      it.message = '上传失败';
      showToast(e?.message || '上传失败');
    }
  }

  rebuildFileListFromObjs();
};

const downloadAt = (index) => {
  const obj = fileObjs.value[index];
  if (!obj) return;

  // 原始可访问地址：优先后端 link，否则用 previewBaseDomain + name
  const raw = composeLink(obj);
  if (!raw) {
    showToast('暂无可下载地址');
    return;
  }

  // 直接用工具类下载（会生成 /api/upload/... 并处理中文/空格）
  DownloadUtil.download(
    raw,
    {
      previewBaseDomain: props.previewBaseDomain,
      apiPrefix: props.apiPrefix, // 可按页面传入覆盖
    },
    displayName(obj)
  );
};
</script>

<style lang="scss" scoped>
.dc-uploader {
  display: inline-flex;
  flex-direction: column;
  .van-cell-group {
    margin: 0;
  }
}
.dc-uploader__header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
}
.placeholder {
  color: var(--van-gray-6);
}
.type-hint {
  color: var(--van-gray-6);
  font-size: 12px;
}
.dc-uploader__single {
  :deep(.van-cell) {
    padding: 0;
  }
}
.dc-uploader__list {
  :deep(.van-cell) {
    padding: 0 !important; /* 无内边距 */
    display: flex;
    align-items: center; /* 垂直居中 */
    justify-content: space-between;
    min-height: 44px; /* 可选：行高更友好 */
  }
  :deep(.van-cell__title) {
    display: flex;
    align-items: center; /* 文本与右侧图标基线对齐更自然 */
    width: 120px;
    overflow: hidden;
  }
  :deep(.van-cell__title span) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  :deep(.van-cell__value) {
    /* 防止 value 区域撑开布局（有右侧删除图标） */
    display: flex;
    align-items: center;
  }
}

.mr8 {
  margin-right: 8px;
}
</style>
