<template>
  <div
    class="dc-select-dialog"
    :style="{ width, '--dc-select-dialog-footer-height': footerHeight }"
  >
    <span v-if="$slots.customize" :class="{ disabled }" @click="openPopup">
      <slot name="customize"></slot>
    </span>
    <div v-else-if="$slots.default" class="dc-select-dialog__trigger" :class="{ disabled }">
      <div class="dc-select-dialog__slot" @click="openPopup">
        <slot></slot>
      </div>
      <div class="dc-select-dialog__icons">
        <van-icon
          v-if="displayClearIcon"
          name="cross"
          class="dc-select-dialog__clear"
          @click.stop="handleClearClick"
        />
        <van-icon name="arrow" class="dc-select-dialog__arrow" @click="openPopup" />
      </div>
    </div>
    <van-field
      v-else
      :label="fieldLabel"
      readonly
      clickable
      is-link
      :disabled="disabled"
      :model-value="!multiple ? singleDisplayText : undefined"
      :placeholder="!multiple ? placeholderText : undefined"
      class="dc-select-dialog__field"
      @click="openPopup"
    >
      <template v-if="multiple" #input>
        <div class="dc-select-dialog__field-input" :class="{ 'has-value': displayTags.length }">
          <template v-if="displayTags.length">
            <div class="dc-select-dialog__tags">
              <van-tag
                v-for="tag in displayTags"
                :key="tag.key"
                type="primary"
                size="medium"
                :color="tagColor"
                :text-color="tagTextColor"
                :closeable="clearable"
                @close.stop="removeTag(tag.key)"
              >
                {{ tag.label }}
              </van-tag>
            </div>
          </template>
          <span v-else class="dc-select-dialog__field-placeholder">{{ placeholderText }}</span>
        </div>
      </template>
      <template #extra>
        <div class="dc-select-dialog__icons">
          <van-icon
            v-if="displayClearIcon"
            name="cross"
            class="dc-select-dialog__clear"
            @click.stop="handleClearClick"
          />
          <van-icon name="arrow" class="dc-select-dialog__arrow" />
        </div>
      </template>
    </van-field>

    <van-popup
      v-model:show="open"
      position="bottom"
      round
      class="dc-select-dialog__popup"
      teleport="body"
      close-icon="close"
      closeable
      :style="{ height: popupHeight }"
      @close="handleClose"
    >
      <div class="dc-select-dialog__header">
        <span class="dc-select-dialog__title">{{ popupTitle }}</span>
      </div>

      <div class="dc-select-dialog__body">
        <div class="dc-select-dialog__list">
          <DcPagination
            ref="pagerRef"
            class="dc-select-dialog__pagination"
            :fetcher="paginationFetcher"
            :page-size="pageSize"
            :offset="120"
            :add-visible="false"
            :immediate="false"
            :back-top-threshold="Infinity"
            :get-nav-el="getNavElement"
          >
            <template #sticky="{ resetAndLoad }">
              <div class="dc-select-dialog__sticky">
                <div
                  v-if="searchFields.length"
                  class="dc-select-dialog__search"
                  :class="{ 'is-collapsed': searchCollapsed }"
                >
                  <div class="dc-select-dialog__search-preview">
                    <div class="dc-select-dialog__search-chips" @click="toggleSearchPanel">
                      <template v-if="searchPreviewChips.length">
                        <span
                          v-for="chip in searchPreviewChips"
                          :key="chip.key"
                          class="dc-select-dialog__search-chip"
                        >
                          {{ chip.text }}
                        </span>
                      </template>
                      <span v-else class="dc-select-dialog__search-placeholder"
                        >点击展开筛选条件</span
                      >
                    </div>
                    <div class="dc-select-dialog__search-controls">
                      <van-button text size="small" type="primary" @click="toggleSearchPanel">
                        {{ searchCollapsed ? '展开' : '收起' }}
                        <van-icon :name="searchCollapsed ? 'arrow-down' : 'arrow-up'" size="14" />
                      </van-button>
                      <van-button
                        type="default"
                        size="small"
                        plain
                        @click="() => resetSearch(false, resetAndLoad)"
                      >
                        重置
                      </van-button>
                      <van-button type="primary" size="small" @click="() => onSearch(resetAndLoad)">
                        查询
                      </van-button>
                    </div>
                  </div>
                  <transition name="van-fade">
                    <div v-show="!searchCollapsed" class="dc-select-dialog__search-panel">
                      <div class="dc-select-dialog__search-grid">
                        <van-field
                          v-for="field in searchFields"
                          :key="field.prop"
                          v-model="searchState[field.prop]"
                          :label="field.label"
                          :placeholder="field.searchProps?.placeholder || `请输入${field.label}`"
                          clearable
                          label-width="auto"
                          @clear="() => onSearch(resetAndLoad)"
                        />
                      </div>
                    </div>
                  </transition>
                </div>

                <div
                  v-if="selectedRows.length"
                  class="dc-select-dialog__selected"
                  :class="{ 'is-collapsed': selectedCollapsed }"
                >
                  <div class="dc-select-dialog__selected-header">
                    <span>已选 {{ selectedRows.length }}</span>
                    <div class="dc-select-dialog__selected-actions">
                      <van-button
                        v-if="clearable"
                        text
                        type="danger"
                        size="mini"
                        @click="clearSelection"
                      >
                        清空
                      </van-button>
                      <van-button text size="mini" @click="toggleSelectedCollapsed">
                        {{ selectedCollapsed ? '展开' : '收起' }}
                        <van-icon :name="selectedCollapsed ? 'arrow-down' : 'arrow-up'" size="14" />
                      </van-button>
                    </div>
                  </div>
                  <div
                    class="dc-select-dialog__selected-tags"
                    :class="{ 'is-collapsed': selectedCollapsed }"
                  >
                    <van-tag
                      v-for="row in selectedRows"
                      :key="getKey(row)"
                      type="danger"
                      plain
                      size="small"
                      :closeable="clearable"
                      @close.stop="removeTag(getKey(row))"
                    >
                      {{ getDisplayLabel(row) }}
                    </van-tag>
                  </div>
                </div>
              </div>
            </template>

            <template #item="{ item }">
              <div
                class="dc-select-dialog__row"
                :class="{ active: isSelected(item) }"
                @click="toggleRow(item)"
              >
                <van-checkbox
                  v-if="multiple"
                  :model-value="isSelected(item)"
                  @click.stop="toggleRow(item)"
                />
                <van-radio
                  v-else
                  :name="getKey(item)"
                  :model-value="singleValue"
                  @update:model-value="() => toggleSingle(item)"
                />
                <div class="dc-select-dialog__row-content">
                  <div v-for="col in modelColumns" :key="col.prop" class="dc-select-dialog__cell">
                    <span class="dc-select-dialog__cell-label">{{ col.label }}</span>
                    <div class="dc-select-dialog__cell-value">
                      <template v-if="col.component === 'dc-view'">
                        <dc-view
                          v-model="item[col.prop]"
                          type="text"
                          :object-name="col.objectName"
                        />
                      </template>
                      <template v-else-if="col.component === 'dc-dict'">
                        <dc-dict
                          type="text"
                          :value="item[col.prop]"
                          :options="dictMaps[col.dictData]"
                        />
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
      </div>

      <div class="dc-select-dialog__footer">
        <div class="dc-select-dialog__footer-actions">
          <van-button size="mini" type="default" plain @click="cancelSelection">关闭</van-button>
          <van-button size="mini" type="primary" @click="confirmSelection">确认</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch, nextTick, getCurrentInstance } from 'vue';
import { useGlobalCacheStore } from '@/store/global-cache';
import { useDictStore } from '@/store/dict';
import cacheRequest from '@/components/dc-ui/util/request';
import cacheData from '@/components/dc-ui/constant/cacheData';
import DcPagination from '@/components/dc-ui/components/Pagination/index.vue';

defineOptions({ name: 'SelectDialog' });

const props = defineProps({
  modelValue: { type: [Array, Object, String, Number], default: null },
  objectName: { type: String, default: '' },
  placeholder: { type: String, default: '请选择' },
  label: { type: String, default: '' },
  width: { type: String, default: '100%' },
  disabled: { type: Boolean, default: false },
  clearable: { type: Boolean, default: true },
  showClearIcon: { type: Boolean, default: true },
  multiple: { type: Boolean, default: true },
  showValue: { type: Boolean, default: true },
  showKey: { type: String, default: '' },
  masterKey: { type: String, default: '' },
  returnType: { type: String, default: 'array' },
  dialogWidth: { type: [String, Number], default: '100%' },
  title: { type: String, default: '' },
  query: { type: Object, default: () => ({}) },
  change: { type: Function, default: null },
  dynamicIndex: { type: [Number, String], default: null },
  column: { type: Object, default: null },
  tagColor: { type: String, default: '#ecf5ff' },
  tagTextColor: { type: String, default: '#1989fa' },
});

const emit = defineEmits(['update:modelValue', 'change', 'init']);

const instance = getCurrentInstance();
if (instance?.type) {
  instance.type.dcAliases = ['wf-select-dialog'];
}

const open = ref(false);
const loading = ref(false);
const pagerRef = ref(null);
const pageSize = ref(20);
const selectedRows = ref([]);
const searchCollapsed = ref(true);
const selectedCollapsed = ref(true);
const dictMaps = reactive({});
const searchState = reactive({});
const initDefaultSearch = ref(true);
const model = ref(null);
const rowKeyRef = ref('id');

const zeroNavEl = { getBoundingClientRect: () => ({ height: 0 }) };

const cacheStore = useGlobalCacheStore();
const dictStore = useDictStore();
const getNavElement = () => zeroNavEl;

const popupHeight = computed(() => '100vh');
const popupTitle = computed(() => props.title || model.value?.title || '请选择');
const confirmText = computed(() => model.value?.submitTitle || '确认');
const fieldLabel = computed(() => props.label || model.value?.title || model.value?.label || '');
const placeholderText = computed(() => {
  if (props.placeholder) return props.placeholder;
  if (model.value?.placeholder) return model.value.placeholder;
  if (fieldLabel.value) return `请选择${fieldLabel.value}`;
  return '请选择';
});
const footerHeight = computed(() => '96px');

const keyField = computed(() => props.masterKey || model.value?.rowKey || rowKeyRef.value || 'id');
const modelColumns = computed(() => (Array.isArray(model.value?.column) ? model.value.column : []));
const searchFields = computed(() => modelColumns.value.filter((col) => col?.search));
const multiple = computed(() => props.multiple !== false);
const displayTags = computed(() => {
  return selectedRows.value.map((row) => ({
    key: getKey(row),
    label: getDisplayLabel(row) || getKey(row) || '-',
  }));
});

const singleDisplayText = computed(() => {
  if (multiple.value) {
    return '';
  }
  if (displayTags.value.length) {
    return displayTags.value[0]?.label || '';
  }
  if (!props.showValue) {
    const value = props.modelValue;
    if (value && typeof value === 'object') {
      const key = keyField.value;
      const candidate =
        value?.[props.showKey] ??
        value?.[model.value?.defaultLabel] ??
        value?.label ??
        value?.name ??
        value?.[key];
      if (candidate !== undefined && candidate !== null && `${candidate}` !== '') {
        return candidate;
      }
    } else if (value !== undefined && value !== null && `${value}` !== '') {
      return `${value}`;
    }
  }
  return '';
});

const singleValue = computed(() => {
  if (multiple.value) {
    return null;
  }
  const first = selectedRows.value[0];
  return first ? getKey(first) : null;
});

const hasModelValue = computed(() => {
  if (selectedRows.value.length) {
    return true;
  }
  const value = props.modelValue;
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (value && typeof value === 'object') {
    return Object.keys(value).length > 0;
  }
  if (typeof value === 'string') {
    return value.trim() !== '';
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return true;
  }
  return value !== undefined && value !== null;
});

const displayClearIcon = computed(
  () =>
    props.showClearIcon !== false &&
    props.clearable !== false &&
    !props.disabled &&
    hasModelValue.value
);

const searchPreviewChips = computed(() => {
  return searchFields.value
    .map((field) => {
      const value = searchState[field.prop];
      const hasValue = value !== undefined && value !== null && `${value}`.trim() !== '';
      return {
        key: field.prop,
        label: field.label,
        value,
        hasValue,
        text: hasValue ? `${field.label}: ${value}` : field.label,
      };
    })
    .filter((item) => item.hasValue);
});

const dictCodes = computed(() => {
  const codes = new Set();
  modelColumns.value.forEach((col) => {
    if (col?.dictData) codes.add(col.dictData);
  });
  return Array.from(codes);
});

/** ✅ 新增：init 事件只触发一次（当回显/初始化完成时） */
const initEmitted = ref(false);

function emitInitPayload() {
  if (initEmitted.value) return;

  let payload;
  if (multiple.value) {
    payload = selectedRows.value.map((item) => ({ ...item }));
  } else {
    const row = selectedRows.value.length ? selectedRows.value[0] : null;
    payload = row;
  }
  initEmitted.value = true;
  emit('init', payload);
}

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
    initEmitted.value = false; // ✅ 新增：切换 objectName 重新允许触发 init

    model.value = cacheData?.[name] || null;
    if (model.value?.rowKey) {
      rowKeyRef.value = model.value.rowKey;
    }
    const sizeFromModel =
      Number(model.value?.search?.params?.size ?? model.value?.pageSize ?? 0) || 20;
    pageSize.value = sizeFromModel;
    initDefaultSearch.value = true;
    resetSearch(true);
    searchCollapsed.value = true;
  },
  { immediate: true }
);

function parseIds(val) {
  const key = keyField.value;
  if (Array.isArray(val)) {
    return val
      .map((item) => (typeof item === 'object' ? item?.[key] : item))
      .filter((id) => id !== undefined && id !== null && `${id}` !== '');
  }
  if (val && typeof val === 'object') {
    const id = val?.[key];
    return id != null ? [id] : [];
  }
  if (typeof val === 'string') return val.split(',').filter(Boolean);
  if (typeof val === 'number') return [`${val}`];
  return [];
}

watch(
  [() => props.modelValue, () => props.objectName],
  async ([newVal]) => {
    // ✅ 只有 modelValue 有值才允许触发 init
    const shouldInit = hasAnyValue(newVal);

    // modelValue 为空：清空，但不触发 init
    if (!shouldInit) {
      selectedRows.value = [];
      return;
    }

    // showValue=false：你本来就不回显对象，这里仍然可以触发 init
    // （payload 会按当前 selectedRows 逻辑算出来；但此时 selectedRows 可能为空）
    // 更合理：直接把 newVal 当作初始化结果返回（建议这样）
    if (!props.showValue) {
      initEmitted.value = true;
      emit('init', newVal);
      return;
    }

    await nextTick();
    const ids = parseIds(newVal);

    // model/url 不具备：也不触发 init（因为无法回显你期望的对象）
    // 如果你想“只要有值就触发init（即使拿不到对象）”，我下面也给你可选版本
    if (!ids.length || !model.value?.url) {
      selectedRows.value = [];
      return;
    }

    try {
      await cacheRequest.getView({
        url: model.value.url,
        data: ids,
        masterKey: keyField.value,
      });
    } catch (error) {
      console.error('Failed to fetch cache data:', error);
      // 继续兜底
    }

    const bucket = cacheStore.globalData[model.value.url] || {};
    const rows = Array.isArray(bucket) ? bucket : Object.values(bucket);
    const key = keyField.value;
    const valueMap = new Map();

    if (Array.isArray(newVal)) {
      newVal.forEach((item) => {
        if (item && typeof item === 'object') {
          const itemKey = item?.[key];
          if (itemKey != null) valueMap.set(`${itemKey}`, { ...item });
        }
      });
    } else if (newVal && typeof newVal === 'object') {
      const itemKey = newVal?.[key];
      if (itemKey != null) valueMap.set(`${itemKey}`, { ...newVal });
    }

    selectedRows.value = ids.map((id) => {
      const idKey = `${id}`;
      if (valueMap.has(idKey)) return valueMap.get(idKey);
      const hit = rows.find((item) => `${item?.[key]}` === idKey);
      return hit ? { ...hit } : { [key]: id };
    });

    await nextTick();

    // ✅ 有值时才触发 init（并且只触发一次）
    emitInitPayload();
  },
  { immediate: true, deep: true }
);

watch(
  () => selectedRows.value.length,
  (len) => {
    if (!len) {
      selectedCollapsed.value = true;
    }
  }
);

watch(
  searchFields,
  (fields) => {
    if (!fields.length) {
      searchCollapsed.value = true;
    }
  },
  { immediate: true }
);

function hasAnyValue(val) {
  if (val === undefined || val === null) return false;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === 'string') return val.trim() !== '';
  if (typeof val === 'number') return true; // 0 也算有值
  if (typeof val === 'boolean') return true;
  if (typeof val === 'object') return Object.keys(val).length > 0;
  return false;
}

function openPopup() {
  if (props.disabled) return;
  open.value = true;
  triggerReload();
}

function toggleSearchPanel() {
  searchCollapsed.value = !searchCollapsed.value;
}

function toggleSelectedCollapsed() {
  selectedCollapsed.value = !selectedCollapsed.value;
}

function handleClose() {
  loading.value = false;
  pagerRef.value?.scrollToTop?.();
}

function triggerReload() {
  nextTick(() => {
    pagerRef.value?.resetAndLoad?.();
  });
}

function mergeSelectionWithRows(rows) {
  if (!selectedRows.value.length || !Array.isArray(rows) || !rows.length) return;
  const map = new Map(rows.map((row) => [getKey(row), row]));
  let updated = false;
  const next = selectedRows.value.map((item) => {
    const hit = map.get(getKey(item));
    if (hit) {
      updated = true;
      return { ...hit };
    }
    return item;
  });
  if (updated) {
    selectedRows.value = next;
  }
}

function normalizeResponse(res, fallbackPageNo, fallbackSize) {
  const raw = model.value?.callBack
    ? model.value.callBack(res)
    : (res?.data?.data ?? res?.data ?? {});
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
  if (
    !pages &&
    total === 0 &&
    normalizedRecords.length > 0 &&
    typeof size === 'number' &&
    size > 0
  ) {
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
    ...(props.query || {}),
    ...paginationParams,
    ...searchState,
  };

  try {
    const response = await model.value.dialogGet(requestPayload);
    const normalized = normalizeResponse(response, pageNo, size);
    mergeSelectionWithRows(normalized.records);
    if (
      typeof normalized.size === 'number' &&
      normalized.size > 0 &&
      normalized.size !== pageSize.value
    ) {
      pageSize.value = normalized.size;
    }
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

function isSelected(row) {
  const key = getKey(row);
  return selectedRows.value.some((item) => getKey(item) === key);
}

function toggleRow(row) {
  if (!multiple.value) {
    toggleSingle(row);
    return;
  }
  const key = getKey(row);
  const index = selectedRows.value.findIndex((item) => getKey(item) === key);
  if (index > -1) {
    selectedRows.value.splice(index, 1);
  } else {
    selectedRows.value.push({ ...row });
  }
}

function toggleSingle(row) {
  if (isSelected(row)) {
    selectedRows.value = [];
  } else {
    selectedRows.value = [{ ...row }];
  }
}

function removeTag(key) {
  const index = selectedRows.value.findIndex((item) => getKey(item) === key);
  if (index > -1) {
    selectedRows.value.splice(index, 1);
    applySelection();
  }
}

function handleClearClick() {
  if (props.disabled || props.clearable === false) {
    return;
  }
  clearSelection();
}

function clearSelection() {
  selectedRows.value = [];
  applySelection();
}

function getKey(row) {
  const key = keyField.value;
  return row?.[key] != null ? `${row[key]}` : '';
}

function getDisplayLabel(row) {
  const labelKey = props.showKey || model.value?.defaultLabel || keyField.value;
  const value = row?.[labelKey];
  if (value !== undefined && value !== null && `${value}` !== '') {
    return value;
  }
  const fallbackKey = modelColumns.value?.[0]?.prop;
  if (fallbackKey && row?.[fallbackKey] != null && `${row[fallbackKey]}` !== '') {
    return row[fallbackKey];
  }
  return row?.[keyField.value];
}

function formatCell(row, column) {
  const value = row?.[column.prop];
  if (value === undefined || value === null || value === '') return '-';
  return value;
}

function applySelection() {
  const key = keyField.value;
  if (multiple.value) {
    const payload =
      props.returnType === 'string'
        ? selectedRows.value
            .map((item) => item?.[key])
            .filter((v) => v != null && v !== '')
            .join(',')
        : selectedRows.value.map((item) => ({ ...item }));
    emit('update:modelValue', payload);
    emit(
      'change',
      selectedRows.value.map((item) => ({ ...item }))
    );
    if (typeof props.change === 'function') {
      props.change({ value: selectedRows.value, column: props.column, index: props.dynamicIndex });
    }
  } else {
    const row = selectedRows.value.length ? selectedRows.value[0] : null;
    const payload =
      props.returnType === 'string' ? (row ? (row?.[key] ?? null) : null) : row ? { ...row } : null;
    emit('update:modelValue', payload);
    emit('change', row ? { ...row } : null);
    if (typeof props.change === 'function') {
      props.change({ value: row, column: props.column, index: props.dynamicIndex });
    }
  }
}

function confirmSelection() {
  applySelection();
  open.value = false;
}

function cancelSelection() {
  open.value = false;
}

function onSearch(resetFn) {
  if (typeof resetFn === 'function') {
    resetFn();
  } else {
    triggerReload();
  }
}

function resetSearch(force = false, resetFn) {
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
  } else if (!force) {
    if (typeof resetFn === 'function') {
      resetFn();
    } else {
      triggerReload();
    }
  }
}
</script>

<style lang="scss" scoped>
.dc-select-dialog {
  width: 100%;
  :deep(.van-field__value) {
    min-height: unset !important;
  }
  :deep(.van-cell__right-icon) {
    display: none !important;
  }
}

.dc-select-dialog__trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #ebedf0;
  border-radius: 6px;
  color: #323233;
  position: relative;
  flex-wrap: wrap;
  &.disabled {
    opacity: 0.6;
  }
}

.dc-select-dialog__icons {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}

.dc-select-dialog__clear {
  color: #c8c9cc;
  font-size: 16px;
  cursor: pointer;
}

.dc-select-dialog__clear:active {
  color: #969799;
}

.dc-select-dialog__field {
  width: 100%;
}

.dc-select-dialog__field :deep(.van-field__control) {
  cursor: pointer;
}

.dc-select-dialog__field :deep(.van-field__value) {
  display: flex;
  align-items: center;
  min-height: 44px;
}

.dc-select-dialog__field-input {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  width: 100%;
  min-height: 24px;
  overflow: hidden;
}

.dc-select-dialog__field-input.has-value {
  flex-wrap: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.dc-select-dialog__field-input.has-value::-webkit-scrollbar {
  display: none;
}

.dc-select-dialog__field-placeholder {
  color: #969799;
}

.dc-select-dialog__slot {
  flex: 1;
  min-width: 0;
  width: 100%;
}

.dc-select-dialog__tags {
  display: inline-flex;
  flex: 1 0 auto;
  gap: 6px;
  flex-wrap: nowrap;
  max-width: none;
}

.dc-select-dialog__tags :deep(.van-tag),
.dc-select-dialog__selected-tags :deep(.van-tag) {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.dc-select-dialog__tags :deep(.van-tag__text),
.dc-select-dialog__selected-tags :deep(.van-tag__text) {
  white-space: nowrap;
}

.dc-select-dialog__text {
  flex: 1;
}

.dc-select-dialog__placeholder {
  flex: 1;
  color: #969799;
}

.dc-select-dialog__arrow {
  color: var(--van-cell-right-icon-color);
  height: var(--van-cell-line-height);
  font-size: var(--van-cell-icon-size);
  line-height: var(--van-cell-line-height);
}

.dc-select-dialog__popup {
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  padding: 0;
}

.dc-select-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f5f6f7;
  flex-shrink: 0;
}

.dc-select-dialog__title {
  font-weight: 500;
  font-size: 16px;
}

.dc-select-dialog__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.dc-select-dialog__list {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dc-select-dialog__pagination {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.dc-select-dialog__pagination :deep(.dc-paged-infinite-list) {
  background: transparent;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.dc-select-dialog__pagination :deep(.dc-sticky-header) {
  position: sticky !important;
  top: 0 !important;
  left: 0;
  right: 0;
  background: transparent;
  box-shadow: none;
  padding: 0;
}

.dc-select-dialog__sticky {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px 10px;
  background: #fff;
  border-bottom: 1px solid #f5f6f7;
}

.dc-select-dialog__search {
  background: #f7f8fa;
  padding: 10px 12px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: padding 0.2s ease;
}

.dc-select-dialog__search.is-collapsed {
  padding-bottom: 8px;
}

.dc-select-dialog__search-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.dc-select-dialog__search-chips {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 2px;
  cursor: pointer;
}

.dc-select-dialog__search-chip {
  flex: 0 0 auto;
  background: #fff;
  border-radius: 12px;
  padding: 4px 10px;
  font-size: 12px;
  color: #323233;
  border: 1px solid #ebedf0;
}

.dc-select-dialog__search-placeholder {
  font-size: 12px;
  color: #969799;
  white-space: nowrap;
}

.dc-select-dialog__search-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.dc-select-dialog__search-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dc-select-dialog__search-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
}

.dc-select-dialog__search :deep(.van-field) {
  padding: 4px 0;
}

.dc-select-dialog__search :deep(.van-field__label) {
  color: #646566;
  font-size: 12px;
  min-width: 48px;
}

.dc-select-dialog__selected {
  background: #fff7e6;
  padding: 10px 12px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dc-select-dialog__selected.is-collapsed {
  padding-bottom: 8px;
}

.dc-select-dialog__selected-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  gap: 8px;
}

.dc-select-dialog__selected-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dc-select-dialog__selected-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.dc-select-dialog__selected-tags.is-collapsed {
  flex-wrap: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.dc-select-dialog__pagination :deep(.dc-content) {
  position: relative !important;
  top: 0 !important;
  bottom: auto;
  left: 0;
  right: 0;
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 12px 16px
    calc(var(--dc-select-dialog-footer-height, 96px) + 32px + var(--van-safe-area-bottom, 0px));
}

.dc-select-dialog__pagination :deep(.dc-content .van-pull-refresh) {
  min-height: 100%;
}

.dc-select-dialog__pagination :deep(.dc-content .van-empty) {
  padding: 40px 0;
}

.dc-select-dialog__pagination :deep(.dc-back-top),
.dc-select-dialog__pagination :deep(.dc-fab-add) {
  display: none !important;
}

.dc-select-dialog__row {
  display: flex;
  align-items: stretch;
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

.dc-select-dialog__row-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.dc-select-dialog__cell {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 13px;
  color: #323233;
  text-align: left;
  flex-wrap: nowrap;
  min-width: 0;
}

.dc-select-dialog__cell-label {
  color: #969799;
  font-size: 12px;
  flex: 0 0 auto;
  white-space: nowrap;
}

.dc-select-dialog__footer {
  padding: 12px 16px calc(16px + var(--van-safe-area-bottom, 0px));
  border-top: 1px solid #f5f6f7;
  flex-shrink: 0;
  background: #fff;
}

.dc-select-dialog__footer-actions {
  display: flex;
  gap: 12px;
}

.dc-select-dialog__footer-actions :deep(.van-button) {
  flex: 1;
}

.dc-select-dialog__cell-value {
  color: #323233;
  width: 100%;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
