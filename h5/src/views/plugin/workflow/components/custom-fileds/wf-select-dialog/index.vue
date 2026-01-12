<template>
  <div class="wf-select-dialog" :style="{ width }">
    <div
      v-if="$slots.default"
      class="wf-select-dialog__trigger"
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
      :model-value="displayText"
      :placeholder="displayPlaceholder"
      class="wf-select-dialog__field"
      @click="openPopup"
    >
      <template #input>
        <div class="wf-select-dialog__field-input" :class="{ 'has-value': displayTags.length }">
          <template v-if="displayTags.length">
            <div class="wf-select-dialog__tags">
              <van-tag
                v-for="tag in displayTags"
                :key="getKey(tag)"
                size="medium"
                type="primary"
                plain
                :closeable="clearable"
                @close.stop="removeTag(getKey(tag))"
              >
                {{ getDisplayLabel(tag) }}
              </van-tag>
            </div>
          </template>
          <span v-else class="wf-select-dialog__placeholder">{{ displayPlaceholder }}</span>
        </div>
      </template>
      <template #extra>
        <div class="wf-select-dialog__icons">
          <van-icon
            v-if="clearable && displayTags.length"
            name="cross"
            class="wf-select-dialog__clear"
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
      close-icon="close"
      closeable
      teleport="body"
      class="wf-select-dialog__popup"
      @close="closePopup"
    >
      <div class="wf-select-dialog__header">
        <span class="wf-select-dialog__title">{{ displayTitle }}</span>
        <van-icon name="cross" class="wf-select-dialog__close" @click="closePopup" />
      </div>

      <div v-if="selected.length" class="wf-select-dialog__selected">
        <div class="wf-select-dialog__selected-title">
          <span>已选 {{ selected.length }}</span>
          <van-button v-if="clearable" size="mini" type="danger" text @click="clearSelection"
            >清空</van-button
          >
        </div>
        <div class="wf-select-dialog__selected-tags">
          <van-tag
            v-for="item in selected"
            :key="getKey(item)"
            size="small"
            type="danger"
            plain
            :closeable="clearable"
            @close.stop="removeTag(getKey(item))"
          >
            {{ getDisplayLabel(item) }}
          </van-tag>
        </div>
      </div>

      <div class="wf-select-dialog__body">
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
            @click="toggleRow(row)"
          >
            <template #label>
              <div class="wf-select-dialog__row-meta">
                <span
                  v-for="column in modelColumns"
                  :key="column.prop"
                  class="wf-select-dialog__meta-item"
                >
                  <strong>{{ column.label }}：</strong>
                  <span>{{ formatColumnValue(row, column) }}</span>
                </span>
              </div>
            </template>
            <template #right-icon>
              <van-checkbox v-if="multiple" :model-value="isSelected(row)" />
              <van-radio v-else :model-value="isSelected(row)" />
            </template>
          </van-cell>
          <div v-if="!loading && !tableData.length" class="wf-select-dialog__empty">
            <van-empty description="暂无数据" />
          </div>
        </van-list>
      </div>

      <div class="wf-select-dialog__footer">
        <van-button type="primary" block @click="confirm">确定</van-button>
        <van-button type="default" block @click="closePopup">取消</van-button>
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
  name: 'SelectDialog',
  props: {
    modelValue: {
      type: [String, Number, Object, Array],
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
    multiple: {
      type: Boolean,
      default: true,
    },
    returnType: {
      type: String,
      default: 'array',
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
      type: Number,
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
      value: [],
      queryParams: { current: 1, size: 20 },
      tableData: [],
      selected: [],
      model: null,
      callBack: (res) => ({ ...res.data.data }),
      globalCacheStore: useGlobalCacheStore(),
    };
  },
  computed: {
    displayPlaceholder() {
      return this.placeholder || this.model?.placeholder || '请选择';
    },
    displayTitle() {
      return this.title || this.model?.title || '-';
    },
    displayText() {
      if (this.multiple) return '';
      const first = this.value && this.value.length ? this.value[0] : this.modelValue;
      if (!first) return '';
      return typeof first === 'object' ? this.getDisplayLabel(first) : String(first);
    },
    displayTags() {
      if (Array.isArray(this.value)) return this.value;
      if (this.value) return [this.value];
      return [];
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
          if (!newVal || (Array.isArray(newVal) && newVal.length === 0) || newVal === '') {
            this.value = [];
            this.selected = [];
          }
          return;
        }
        nextTick(async () => {
          const ids = this.parseIds(newVal);
          if (!ids.length || !this.model?.url) {
            this.value = [];
            this.selected = [];
            return;
          }
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
            const k = this.masterKey || this.rowKey || 'id';
            this.selected = ids.map((id) => {
              const hit = rows.find((item) => item?.[k] == id);
              return hit ? { ...hit } : { [k]: id };
            });
            this.value = this.selected;
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        });
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
        return val.map((item) => (typeof item === 'object' ? item?.[k] : item)).filter(Boolean);
      }
      if (val && typeof val === 'object') {
        return [val?.[k]].filter(Boolean);
      }
      if (typeof val === 'string') {
        return val.split(',').filter(Boolean);
      }
      return [];
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
          ...this.queryParams,
          ...this.query,
          ...newParams,
        });
        const callBackData = this.model?.callBack ? this.model.callBack(res) : this.callBack(res);
        const records = callBackData?.records || [];
        this.tableData = [...this.tableData, ...records];
        this.total = callBackData?.total || 0;
        this.finished = this.tableData.length >= this.total;
        await nextTick();
      } catch (e) {
        console.error(e);
      } finally {
        this.loading = false;
      }
    },
    toggleRow(row) {
      const k = this.getKey(row);
      const has = this.selected.some((item) => this.getKey(item) === k);
      if (this.multiple) {
        this.selected = has
          ? this.selected.filter((item) => this.getKey(item) !== k)
          : [...this.selected, row];
      } else {
        this.selected = has ? [] : [row];
      }
      this.applySelection();
      if (!this.multiple && !has) {
        this.confirm();
      }
    },
    isSelected(row) {
      const k = this.getKey(row);
      return this.selected.some((item) => this.getKey(item) === k);
    },
    removeTag(key) {
      this.selected = this.selected.filter((item) => this.getKey(item) !== key);
      this.applySelection();
    },
    clearSelection() {
      this.selected = [];
      this.applySelection();
    },
    applySelection() {
      const k = this.masterKey || this.rowKey || 'id';
      if (this.multiple) {
        const data =
          this.returnType === 'string'
            ? this.selected.map((item) => item?.[k]).join(',')
            : this.selected;
        this.value = this.selected;
        this.$emit('update:modelValue', data);
        this.$emit('change', this.selected);
        const obj = { value: this.selected || null, column: this.column, index: this.dynamicIndex };
        if (typeof this.change === 'function') this.change(obj);
      } else {
        const data = this.selected.length ? this.selected[0] : null;
        this.value = this.selected;
        this.$emit('update:modelValue', data ? data?.[k] : null);
        this.$emit('change', data);
        const obj = { value: data || null, column: this.column, index: this.dynamicIndex };
        if (typeof this.change === 'function') this.change(obj);
      }
    },
    confirm() {
      this.applySelection();
      this.closePopup();
    },
    getDisplayLabel(row) {
      const key = this.showKey || this.model?.defaultLabel;
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
.wf-select-dialog {
  width: 100%;
  &__field {
    width: 100%;
  }
  &__field-input {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    min-height: 28px;
  }
  &__placeholder {
    color: var(--van-gray-6);
  }
  &__tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
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
  &__selected {
    padding: 0 4px 12px;
  }
  &__selected-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  &__selected-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  &__body {
    max-height: 50vh;
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
