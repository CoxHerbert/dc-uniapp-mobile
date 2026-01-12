<template>
  <div class="dc-select-single" :style="{ width }">
    <van-field
      :model-value="displayLabel"
      :placeholder="placeholderText"
      :disabled="disabled"
      readonly
      clickable
      is-link
      class="dc-select-single__trigger"
      @click="openPopup"
    >
      <template #right-icon>
        <van-icon
          v-if="clearable && !disabled && displayLabel"
          name="cross"
          class="dc-select-single__clear"
          @click.stop="clearValue"
        />
      </template>
    </van-field>

    <van-popup
      v-model:show="open"
      position="bottom"
      round
      class="dc-select-single__popup"
      teleport="body"
      :style="{ height: popupHeight }"
      @close="handleClose"
    >
      <div class="dc-select-single__header">
        <span class="dc-select-single__title">{{ popupTitle }}</span>
        <van-icon name="cross" class="dc-select-single__close" @click="closePopup" />
      </div>

      <div class="dc-select-single__body" :class="{ 'is-loading': loading }">
        <div v-if="loading" class="dc-select-single__loading">
          <van-loading size="24px">加载中...</van-loading>
        </div>

        <DcPagination
          ref="pagerRef"
          class="dc-select-single__pagination"
          :fetcher="paginationFetcher"
          :page-size="pageSize"
          :offset="120"
          :add-visible="false"
          :immediate="false"
          :back-top-threshold="Infinity"
          :get-nav-el="getNavElement"
        >
          <template #sticky="{ resetAndLoad }">
            <div v-if="searchFields.length" class="dc-select-single__search">
              <div class="dc-select-single__search-fields">
                <van-field
                  v-for="field in searchFields"
                  :key="field.prop"
                  v-model="searchState[field.prop]"
                  :label="field.label"
                  :placeholder="field.searchProps?.placeholder || `请输入${field.label}`"
                  clearable
                  label-width="auto"
                  @keyup.enter="resetAndLoad()"
                  @clear="resetAndLoad()"
                />
              </div>
              <div class="dc-select-single__search-actions">
                <van-button type="default" size="small" plain @click="() => resetSearch(resetAndLoad)">
                  重置
                </van-button>
                <van-button type="primary" size="small" @click="resetAndLoad">
                  查询
                </van-button>
              </div>
            </div>
          </template>

          <template #item="{ item }">
            <div
              class="dc-select-single__row"
              :class="{ active: isDraftSelected(item) }"
              @click="selectDraft(item)"
            >
              <van-radio :model-value="isDraftSelected(item)" @click.stop="selectDraft(item)" />
              <div class="dc-select-single__row-content">
                <div v-for="col in modelColumns" :key="col.prop" class="dc-select-single__cell">
                  <span class="dc-select-single__cell-label">{{ col.label }}</span>
                  <div class="dc-select-single__cell-value">
                    <template v-if="col.component === 'dc-view'">
                      <dc-view
                        v-model="item[col.prop]"
                        type="text"
                        :object-name="col.objectName"
                        :show-label="col.showKey || col.prop"
                      />
                    </template>
                    <template v-else-if="col.component === 'dc-dict'">
                      <dc-dict type="text" :value="item[col.prop]" :options="dictMaps[col.dictData]" />
                    </template>
                    <template v-else-if="col.component === 'dc-dict-key'">
                      <dc-dict-key type="text" :value="item[col.prop]" :options="dictMaps[col.dictData]" />
                    </template>
                    <template v-else>
                      {{ formatCell(item, col) }}
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <template #empty>
            <van-empty description="暂无数据" />
          </template>
        </DcPagination>
      </div>

      <div class="dc-select-single__footer">
        <van-button size="mini" type="default" plain @click="cancelSelection">取消</van-button>
        <van-button size="mini" type="primary" @click="confirmSelection">{{ confirmText }}</van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, reactive, ref, watch } from 'vue';
import DcPagination from '@/components/dc-ui/components/Pagination/index.vue';
import cacheData from '@/components/dc-ui/constant/cacheData';
import cacheRequest from '@/components/dc-ui/util/request';
import { useGlobalCacheStore } from '@/store/global-cache';
import { useDictStore } from '@/store/dict';

defineOptions({ name: 'SelectSingle' });

const props = defineProps({
  modelValue: { type: [String, Number, Object, null], default: null },
  objectName: { type: String, default: '' },
  placeholder: { type: String, default: '请选择' },
  width: { type: String, default: '100%' },
  disabled: { type: Boolean, default: false },
  clearable: { type: Boolean, default: true },
  title: { type: String, default: '' },
  dialogWidth: { type: [String, Number], default: '100%' },
  query: { type: Object, default: () => ({}) },
  change: { type: Function, default: null },
  dynamicIndex: { type: [Number, String], default: null },
  column: { type: Object, default: null },
  showValue: { type: Boolean, default: true },
  showKey: { type: String, default: '' },
  masterKey: { type: String, default: '' },
  returnType: { type: String, default: 'label' },
});

const emit = defineEmits(['update:modelValue', 'change']);

const instance = getCurrentInstance();
if (instance?.type) {
  instance.type.dcAliases = ['select-single'];
}

const open = ref(false);
const loading = ref(false);
const pagerRef = ref(null);
const pageSize = ref(20);
const model = ref(null);
const rowKeyRef = ref('id');
const initDefaultSearch = ref(true);
const searchState = reactive({});
const dictMaps = reactive({});
const selectedRow = ref(null);
const draftRow = ref(null);
const manualLabel = ref('');

const cacheStore = useGlobalCacheStore();
const dictStore = useDictStore();
const zeroNavEl = { getBoundingClientRect: () => ({ height: 0 }) };
const getNavElement = () => zeroNavEl;

const popupHeight = computed(() => '100vh');
const keyField = computed(() => props.masterKey || model.value?.rowKey || rowKeyRef.value || 'id');
const labelField = computed(() => props.showKey || model.value?.defaultLabel || keyField.value);
const modelColumns = computed(() => (Array.isArray(model.value?.column) ? model.value.column : []));
const searchFields = computed(() => modelColumns.value.filter((col) => col?.search));

const popupTitle = computed(() => props.title || model.value?.title || '请选择');
const confirmText = computed(() => model.value?.submitTitle || '确定');
const placeholderText = computed(() => props.placeholder || model.value?.placeholder || '请选择');

const displayLabel = computed(() => {
  if (!props.showValue) return '';
  if (selectedRow.value) {
    return getDisplayLabel(selectedRow.value);
  }
  return manualLabel.value || '';
});

const dictCodes = computed(() => {
  const codes = new Set();
  modelColumns.value.forEach((col) => {
    if (col?.dictData) codes.add(col.dictData);
  });
  return Array.from(codes);
});

watch(
  dictCodes,
  async (codes) => {
    Object.keys(dictMaps).forEach((key) => {
      if (!codes.includes(key)) delete dictMaps[key];
    });
    if (!codes.length) return;
    try {
      const result = await dictStore.getMany(codes);
      Object.entries(result).forEach(([code, items]) => {
        dictMaps[code] = items;
      });
    } catch (error) {
      console.error('Failed to load dict data:', error);
    }
  },
  { immediate: true }
);

watch(
  () => props.objectName,
  (name) => {
    model.value = cacheData?.[name] || null;
    if (model.value?.rowKey) {
      rowKeyRef.value = model.value.rowKey;
    }
    const sizeFromModel =
      Number(model.value?.search?.params?.size ?? model.value?.pageSize ?? 0) || 20;
    pageSize.value = sizeFromModel;
    initDefaultSearch.value = true;
    resetSearch(true);
  },
  { immediate: true }
);

watch(
  () => props.modelValue,
  async (value) => {
    if (!props.showValue) {
      if (!value) {
        selectedRow.value = null;
        manualLabel.value = '';
      }
      return;
    }

    if (value === null || value === undefined || value === '') {
      selectedRow.value = null;
      manualLabel.value = '';
      return;
    }

    if (typeof value === 'object') {
      selectedRow.value = { ...value };
      manualLabel.value = getDisplayLabel(value);
      return;
    }

    const id = `${value}`;
    if (!model.value?.url) {
      selectedRow.value = null;
      manualLabel.value = id;
      return;
    }

    try {
      await cacheRequest.getView({ url: model.value.url, data: [id], masterKey: keyField.value });
      const bucket = cacheStore.globalData[model.value.url] || {};
      const rows = Array.isArray(bucket) ? bucket : Object.values(bucket);
      const key = keyField.value;
      const found = rows.find((item) => `${item?.[key]}` === id);
      if (found) {
        selectedRow.value = { ...found };
        manualLabel.value = getDisplayLabel(found);
      } else {
        selectedRow.value = null;
        manualLabel.value = id;
      }
    } catch (error) {
      console.error('Failed to fetch cache data:', error);
      selectedRow.value = null;
      manualLabel.value = id;
    }
  },
  { immediate: true }
);

watch(
  () => selectedRow.value,
  (row) => {
    if (!row) return;
    draftRow.value = { ...row };
  }
);

function openPopup() {
  if (props.disabled) return;
  open.value = true;
  draftRow.value = selectedRow.value ? { ...selectedRow.value } : null;
  nextTick(() => {
    pagerRef.value?.resetAndLoad?.();
  });
}

function closePopup() {
  open.value = false;
}

function handleClose() {
  loading.value = false;
}

function cancelSelection() {
  draftRow.value = selectedRow.value ? { ...selectedRow.value } : null;
  closePopup();
}

function confirmSelection() {
  const row = draftRow.value ? { ...draftRow.value } : null;
  selectedRow.value = row;
  manualLabel.value = row ? getDisplayLabel(row) : '';

  const key = keyField.value;
  let payload = null;
  if (row) {
    if (props.returnType === 'id') {
      payload = row?.[key] ?? null;
    } else if (props.returnType === 'object') {
      payload = { ...row };
    } else {
      payload = getDisplayLabel(row);
    }
  } else if (props.returnType === 'label') {
    payload = '';
  }

  emit('update:modelValue', payload);
  emit('change', row);
  if (typeof props.change === 'function') {
    props.change({ value: row, column: props.column, index: props.dynamicIndex });
  }
  closePopup();
}

function clearValue() {
  selectedRow.value = null;
  draftRow.value = null;
  manualLabel.value = '';
  emit('update:modelValue', props.returnType === 'object' ? null : '');
  emit('change', null);
  if (typeof props.change === 'function') {
    props.change({ value: null, column: props.column, index: props.dynamicIndex });
  }
}

function resetSearch(force = false, reloadFn) {
  if (!force && !searchFields.value.length) return;
  Object.keys(searchState).forEach((key) => {
    delete searchState[key];
  });
  searchFields.value.forEach((field) => {
    searchState[field.prop] = '';
  });
  if (force && model.value?.search?.params && initDefaultSearch.value) {
    Object.assign(searchState, model.value.search.params);
    initDefaultSearch.value = false;
  } else if (!force && typeof reloadFn === 'function') {
    reloadFn();
  }
}

function getKey(row) {
  const key = keyField.value;
  return row?.[key] != null ? `${row[key]}` : '';
}

function getDisplayLabel(row) {
  if (!row) return '';
  const labelKey = labelField.value;
  const value = row?.[labelKey];
  if (value !== undefined && value !== null && `${value}` !== '') {
    return value;
  }
  const fallbackKey = modelColumns.value?.[0]?.prop;
  if (fallbackKey && row?.[fallbackKey] != null && `${row[fallbackKey]}` !== '') {
    return row[fallbackKey];
  }
  return row?.[keyField.value] ?? '';
}

function formatCell(row, column) {
  const value = row?.[column.prop];
  if (value === undefined || value === null || value === '') return '-';
  return value;
}

function isDraftSelected(row) {
  const draftKey = draftRow.value ? getKey(draftRow.value) : '';
  return draftKey && draftKey === getKey(row);
}

function selectDraft(row) {
  if (isDraftSelected(row)) {
    draftRow.value = null;
  } else {
    draftRow.value = { ...row };
  }
}

function syncDraftWithRecords(records) {
  if (!Array.isArray(records) || !records.length) return;
  const key = keyField.value;
  const draftKey = draftRow.value?.[key];
  if (draftKey != null) {
    const hit = records.find((item) => `${item?.[key]}` === `${draftKey}`);
    if (hit) {
      draftRow.value = { ...hit };
      return;
    }
  }
  if (!draftRow.value && manualLabel.value) {
    const labelKey = labelField.value;
    const hit = records.find((item) => `${item?.[labelKey]}` === manualLabel.value);
    if (hit) {
      draftRow.value = { ...hit };
    }
  }
}

function normalizeResponse(res, fallbackPageNo, fallbackSize) {
  const raw = model.value?.callBack ? model.value.callBack(res) : res?.data?.data ?? res?.data ?? {};
  let records = [];
  let total = 0;
  let current = fallbackPageNo;
  let pages;
  let size = fallbackSize;

  if (Array.isArray(raw)) {
    records = raw;
    total = raw.length;
  } else if (raw && typeof raw === 'object') {
    if (Array.isArray(raw.records)) {
      records = raw.records;
    } else if (Array.isArray(raw.list)) {
      records = raw.list;
    } else if (Array.isArray(raw.rows)) {
      records = raw.rows;
    }

    total =
      raw.total ??
      raw.count ??
      raw.totalCount ??
      raw.recordsTotal ??
      (Array.isArray(records) ? records.length : 0);
    current = raw.current ?? raw.pageNo ?? raw.page ?? raw.currentPage ?? current;
    pages = raw.pages ?? raw.pageCount ?? raw.totalPage ?? raw.pagesCount;
    size = raw.size ?? raw.pageSize ?? raw.limit ?? size;
  }

  const normalizedRecords = Array.isArray(records) ? records.map((item) => ({ ...item })) : [];
  if (!pages && typeof total === 'number' && total > 0 && typeof size === 'number' && size > 0) {
    pages = Math.ceil(total / size);
  }
  if (!pages && total === 0 && normalizedRecords.length > 0 && typeof size === 'number' && size > 0) {
    pages = normalizedRecords.length < size ? 1 : undefined;
  }

  return {
    records: normalizedRecords,
    total,
    current,
    pages,
    size,
  };
}

async function paginationFetcher({ pageNo, pageSize: sizeParam }) {
  if (!model.value?.dialogGet) {
    return { current: pageNo, pages: 0, total: 0, size: sizeParam || pageSize.value, records: [] };
  }

  const size = Number(sizeParam || pageSize.value || 20) || 20;
  if (pageNo === 1) {
    loading.value = true;
  }

  const paginationParams = props.query?.currentPage
    ? { currentPage: pageNo, pageSize: size }
    : { current: pageNo, size };
  const requestPayload = {
    ...(model.value?.defaultParams || {}),
    ...(props.query || {}),
    ...paginationParams,
    ...searchState,
  };

  try {
    const response = await model.value.dialogGet(requestPayload);
    const normalized = normalizeResponse(response, pageNo, size);
    if (typeof normalized.size === 'number' && normalized.size > 0 && normalized.size !== pageSize.value) {
      pageSize.value = normalized.size;
    }
    syncDraftWithRecords(normalized.records);
    return {
      current: normalized.current ?? pageNo,
      pages: normalized.pages,
      total:
        typeof normalized.total === 'number' && normalized.total > 0
          ? normalized.total
          : normalized.records.length,
      size: normalized.size ?? size,
      records: normalized.records,
    };
  } catch (error) {
    console.error('Failed to fetch dialog data:', error);
    throw error;
  } finally {
    if (pageNo === 1) {
      loading.value = false;
    }
  }
}
</script>

<style scoped lang="scss">
.dc-select-single {
  width: 100%;
}

.dc-select-single__trigger {
  --van-field-padding: 10px 12px;
  --van-field-label-width: 80px;
  :deep(.van-field__control) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.dc-select-single__clear {
  color: #c8c9cc;
  font-size: 16px;
}

.dc-select-single__popup {
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  padding: 0;
}

.dc-select-single__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f5f6f7;
  flex-shrink: 0;
}

.dc-select-single__title {
  font-weight: 500;
  font-size: 16px;
}

.dc-select-single__close {
  color: #969799;
  font-size: 18px;
}

.dc-select-single__body {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.dc-select-single__body.is-loading::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.6);
  z-index: 1;
}

.dc-select-single__loading {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.6);
}

.dc-select-single__pagination {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.dc-select-single__pagination :deep(.dc-sticky-header) {
  position: sticky !important;
  top: 0 !important;
  left: 0;
  right: 0;
  background: #fff;
  padding: 12px 16px 8px;
  border-bottom: 1px solid #f5f6f7;
  box-shadow: none;
}

.dc-select-single__search {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dc-select-single__search-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
}

.dc-select-single__search-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.dc-select-single__pagination :deep(.dc-content) {
  position: relative !important;
  top: 0 !important;
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px calc(16px + var(--van-safe-area-bottom, 0px) + 64px);
}

.dc-select-single__pagination :deep(.van-pull-refresh) {
  min-height: 100%;
}

.dc-select-single__pagination :deep(.dc-back-top),
.dc-select-single__pagination :deep(.dc-fab-add) {
  display: none !important;
}

.dc-select-single__row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #f1f2f3;
  margin-bottom: 8px;
  &.active {
    border-color: var(--van-primary-color, #1989fa);
    box-shadow: 0 0 0 2px rgba(25, 137, 250, 0.1);
  }
  &:last-child {
    margin-bottom: 0;
  }
}

.dc-select-single__row-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.dc-select-single__cell {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #323233;
  white-space: nowrap;
}

.dc-select-single__cell-label {
  color: #969799;
  font-size: 12px;
  flex: 0 0 auto;
}

.dc-select-single__cell-value {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dc-select-single__footer {
  padding: 12px 16px calc(16px + var(--van-safe-area-bottom, 0px));
  border-top: 1px solid #f5f6f7;
  display: flex;
  gap: 12px;
  flex-shrink: 0;
  background: #fff;
}

.dc-select-single__footer :deep(.van-button) {
  flex: 1;
}
</style>
