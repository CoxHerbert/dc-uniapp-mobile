<template>
  <div class="wf-select-single" :style="{ width }">
    <div
      v-if="$slots.default"
      class="wf-select-single__trigger"
      :class="{ disabled }"
      @click="openPopup"
    >
      <slot></slot>
    </div>

    <van-field
      v-else
      readonly
      clickable
      is-link
      :disabled="disabled"
      :model-value="displayLabel"
      :placeholder="displayPlaceholder"
      class="wf-select-single__field"
      @click="openPopup"
    >
      <template #input>
        <span :class="{ 'wf-select-single__placeholder': !displayLabel }">
          {{ displayLabel || displayPlaceholder }}
        </span>
      </template>
      <template #extra>
        <div class="wf-select-single__icons">
          <van-icon
            v-if="clearable && !disabled && displayLabel"
            name="cross"
            class="wf-select-single__clear"
            @click.stop="clearSelection"
          />
          <van-icon name="arrow" />
        </div>
      </template>
    </van-field>

    <van-popup
      v-model:show="open"
      position="bottom"
      round
      closeable
      teleport="body"
      class="wf-select-single__popup"
      :style="{ width: dialogWidth }"
      @close="closePopup"
    >
      <div class="wf-select-single__header">
        <span class="wf-select-single__title">{{ displayTitle }}</span>
        <van-icon name="cross" class="wf-select-single__close" @click="closePopup" />
      </div>

      <div class="wf-select-single__body">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <van-cell
            v-for="row in tableData"
            :key="getKey(row)"
            :title="getDisplayLabel(row)"
            clickable
            @click="selectRow(row)"
          >
            <template #label>
              <div class="wf-select-single__row-meta">
                <span
                  v-for="column in modelColumns"
                  :key="column.prop"
                  class="wf-select-single__meta-item"
                >
                  <strong>{{ column.label }}：</strong>
                  <span>{{ formatColumnValue(row, column) }}</span>
                </span>
              </div>
            </template>
            <template #right-icon>
              <van-radio :model-value="isSelected(row)" />
            </template>
          </van-cell>
          <div v-if="!loading && !tableData.length" class="wf-select-single__empty">
            <van-empty description="暂无数据" />
          </div>
        </van-list>
      </div>

      <div class="wf-select-single__footer">
        <van-button type="default" block @click="closePopup">取消</van-button>
        <van-button type="primary" block @click="confirm">确定</van-button>
      </div>
    </van-popup>
  </div>
</template>

<script>
import { nextTick } from 'vue';
import { useGlobalCacheStore } from '@/store/global-cache';
import ComponentApi from '@/components/dc-ui/api/index';
import cacheData from '@/components/dc-ui/constant/cacheData';

export default {
  name: 'SelectSingle',
  props: {
    modelValue: {
      type: [String, Number, Object],
      default: null,
    },
    placeholder: {
      type: String,
      default: '',
    },
    width: {
      type: String,
      default: '100%',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    clearable: {
      type: Boolean,
      default: true,
    },
    title: {
      type: String,
      default: '',
    },
    showKey: {
      type: String,
      default: '',
    },
    masterKey: {
      type: String,
      default: '',
    },
    dialogWidth: {
      type: [String, Number],
      default: '90%',
    },
    returnType: {
      type: String,
      default: 'label',
    },
    showValue: {
      type: Boolean,
      default: true,
    },
    query: {
      type: Object,
      default: () => ({}),
    },
    objectName: {
      type: String,
      default: '',
    },
    column: {
      type: Object,
      default: () => ({}),
    },
    dynamicIndex: {
      type: [Number, String],
      default: null,
    },
    change: {
      type: Function,
      default: null,
    },
  },
  emits: ['update:modelValue', 'change'],
  data() {
    return {
      rowKey: 'id',
      open: false,
      loading: false,
      finished: false,
      total: 0,
      queryParams: { current: 1, size: 20 },
      tableData: [],
      model: null,
      callBack: (res) => ({ ...res.data.data }),
      globalCacheStore: useGlobalCacheStore(),
      selected: null,
      manualLabel: '',
    };
  },
  computed: {
    displayPlaceholder() {
      return this.placeholder || this.model?.placeholder || '请选择';
    },
    displayTitle() {
      return this.title || this.model?.title || '-';
    },
    displayLabel() {
      if (!this.showValue) return '';
      if (this.selected) return this.getDisplayLabel(this.selected);
      return this.manualLabel || '';
    },
    modelColumns() {
      return Array.isArray(this.model?.column) ? this.model.column : [];
    },
  },
  watch: {
    modelValue: {
      immediate: true,
      deep: true,
      handler(newVal) {
        if (!this.showValue) {
          if (!newVal) {
            this.selected = null;
            this.manualLabel = '';
          }
          return;
        }

        if (newVal === null || newVal === undefined || newVal === '') {
          this.selected = null;
          this.manualLabel = '';
          return;
        }

        if (typeof newVal === 'object') {
          this.selected = { ...newVal };
          this.manualLabel = this.getDisplayLabel(newVal);
          return;
        }

        const ids = this.parseIds(newVal);
        if (!ids.length) {
          this.selected = null;
          this.manualLabel = '';
          return;
        }

        if (!this.model?.url) {
          this.selected = null;
          this.manualLabel = ids[0];
          return;
        }

        nextTick(() => this.fetchByIds(ids));
      },
    },
    objectName: {
      handler(newVal) {
        this.model = cacheData[newVal];
        if (!this.model) return;
        if (this.model?.rowKey) {
          this.rowKey = this.model.rowKey;
        }
        this.resetAndLoad();
      },
      immediate: true,
      deep: true,
    },
  },
  methods: {
    getKey(row) {
      const k = this.masterKey || this.rowKey || 'id';
      return row?.[k];
    },
    parseIds(val) {
      const k = this.masterKey || this.rowKey || 'id';
      if (Array.isArray(val)) {
        return val
          .map((item) => (typeof item === 'object' ? item?.[k] : item))
          .filter((item) => item !== undefined && item !== null && item !== '');
      }
      if (val && typeof val === 'object') {
        return [val?.[k]].filter((item) => item !== undefined && item !== null && item !== '');
      }
      if (typeof val === 'string' || typeof val === 'number') {
        return String(val)
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item !== '');
      }
      return [];
    },
    async fetchByIds(ids) {
      try {
        await ComponentApi.cache.getView({
          url: this.model.url,
          data: ids,
          masterKey: this.masterKey || this.rowKey,
        });
        const currentGlobalData = this.globalCacheStore.globalData[this.model.url] || {};
        const rows = Array.isArray(currentGlobalData)
          ? currentGlobalData
          : Object.values(currentGlobalData);
        const key = this.masterKey || this.rowKey || 'id';
        const hit = rows.find((item) => `${item?.[key]}` === `${ids[0]}`);
        if (hit) {
          this.selected = { ...hit };
          this.manualLabel = this.getDisplayLabel(hit);
        } else {
          this.selected = null;
          this.manualLabel = ids[0];
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        this.selected = null;
        this.manualLabel = ids[0];
      }
    },
    openPopup() {
      if (this.disabled) return;
      this.resetAndLoad();
      this.open = true;
    },
    closePopup() {
      this.open = false;
    },
    async resetAndLoad() {
      this.tableData = [];
      this.total = 0;
      this.finished = false;
      this.queryParams = { current: 1, size: this.queryParams.size || 20 };
      await this.loadData();
    },
    async onLoad() {
      if (this.loading || this.finished) return;
      this.queryParams.current += this.tableData.length ? 1 : 0;
      await this.loadData();
    },
    async loadData() {
      if (!this.model?.dialogGet) return;
      this.loading = true;
      const newParams = this.query?.currentPage
        ? { currentPage: this.queryParams.current, pageSize: this.queryParams.size }
        : {};
      try {
        const res = await this.model.dialogGet({
          ...(this.model?.defaultParams || {}),
          ...this.queryParams,
          ...this.query,
          ...newParams,
        });
        const callBackData = this.model?.callBack ? this.model.callBack(res) : this.callBack(res);
        const records = callBackData?.records || [];
        this.tableData = [...this.tableData, ...records];
        this.total = callBackData?.total || records.length || 0;
        this.finished = this.tableData.length >= this.total;
        await nextTick();
      } catch (e) {
        console.error(e);
      } finally {
        this.loading = false;
      }
    },
    selectRow(row) {
      if (this.isSelected(row)) {
        this.selected = null;
      } else {
        this.selected = row;
      }
      this.manualLabel = this.selected ? this.getDisplayLabel(this.selected) : '';
    },
    isSelected(row) {
      const k = this.getKey(row);
      return this.selected ? this.getKey(this.selected) === k : false;
    },
    clearSelection() {
      this.selected = null;
      this.manualLabel = '';
      this.applySelection();
    },
    applySelection() {
      const k = this.masterKey || this.rowKey || 'id';
      let payload = null;
      if (this.selected) {
        if (this.returnType === 'id') {
          payload = this.selected?.[k] ?? null;
        } else if (this.returnType === 'object') {
          payload = { ...this.selected };
        } else {
          payload = this.getDisplayLabel(this.selected);
        }
        this.manualLabel = this.getDisplayLabel(this.selected);
      } else if (this.returnType === 'label') {
        payload = '';
      }

      this.$emit('update:modelValue', payload);
      this.$emit('change', this.selected || null);
      const obj = { value: this.selected || null, column: this.column, index: this.dynamicIndex };
      if (typeof this.change === 'function') this.change(obj);
    },
    confirm() {
      this.applySelection();
      this.closePopup();
    },
    getDisplayLabel(row) {
      const key = this.showKey || this.model?.defaultLabel || this.masterKey || this.rowKey;
      return row?.[key] ?? '-';
    },
    formatColumnValue(row, column) {
      if (!column?.prop) return '-';
      const value = row?.[column.prop];
      if ([undefined, null, '', ' '].includes(value)) return '-';
      return value;
    },
  },
};
</script>

<style lang="scss" scoped>
.wf-select-single {
  width: 100%;

  &__field {
    width: 100%;
  }

  &__placeholder {
    color: var(--van-gray-6);
  }

  &__icons {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__clear {
    color: var(--van-gray-5);
  }

  &__popup {
    padding: 12px 12px 0;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 4px 12px;
    font-weight: 600;
  }

  &__body {
    max-height: 55vh;
    overflow: auto;
  }

  &__row-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    color: var(--van-gray-6);
  }

  &__meta-item strong {
    margin-right: 2px;
  }

  &__footer {
    display: flex;
    gap: 8px;
    padding: 12px 4px 16px;
  }

  &__empty {
    padding: 16px 0;
  }

  &__trigger.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}
</style>
