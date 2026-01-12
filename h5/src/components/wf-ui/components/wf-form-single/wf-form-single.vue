<template>
  <div class="dc-select-dialog">
    <van-field
      v-model="label"
      style="width: 100%"
      :placeholder="placeholder"
      :disabled="disabled"
      readonly
      @blur="openPopup"
    />
    <van-popup
      v-model:show="open"
      :round="10"
      :closeable="false"
      :loading="loading"
      :z-index="zIndex"
      :close-on-click-overlay="false"
      position="bottom"
      @close="closePopup"
    >
      <div class="search-box">
        <div class="search-box__title">
          <van-search
            v-model="searchKeyword"
            :placeholder="cacheDataplaceholder"
            show-action
            @search="handleSearch"
            @clear="handleClearSearch"
          >
            <template #action>
              <div @click="handleSearch">搜索</div>
            </template>
          </van-search>
        </div>
        <div style="height: 60px"></div>

        <van-radio-group v-model="radioValue">
          <div
            v-for="item in dataList"
            :key="item.id"
            :class="['radio-item', { selected: radioValue === item.id }]"
          >
            <van-radio :name="item.id">
              <div class="radioIndexClass">
                <div v-for="(col, index) in columns" :key="index" class="radio-column">
                  {{ item[col.prop] }}
                </div>
              </div>
            </van-radio>
          </div>
        </van-radio-group>
        <div style="height: 60px"></div>
        <div v-if="loading" class="loading-container">
          <van-loading type="spinner" size="24px">加载中</van-loading>
        </div>

        <div v-if="dataList.length === 0 && !loading" class="loading-container">
          <van-empty description="暂无数据" />
        </div>

        <div class="dc-select-dialog__footer">
          <van-button type="danger" style="flex: 1" size="small" @click="doAction('close')"
            >关闭</van-button
          >
          <van-button type="warning" style="flex: 1" size="small" @click="doAction('clear')"
            >清空</van-button
          >
          <van-button
            type="primary"
            size="small"
            style="flex: 1"
            :disabled="!radioValue"
            @click="doAction('confirm')"
          >
            确认
          </van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script>
import { ref } from 'vue';
import { showToast } from 'vant';
import cacheApi from '@/components/dc-ui/api/index';
import cacheData from '@/components/dc-ui/constant/cacheData';
// import selectProps from './../../mixins/select-props';
import Props from '@/components/wf-ui/mixins/props.js';

export default {
  name: 'WfFormSingle',
  mixins: [Props],
  props: {
    // Props mixin 中的属性
    modelValue: {
      type: [String, Number, Object, Array, Boolean],
      default: '',
    },
    column: {
      type: Object,
      default: () => {
        return {};
      },
    },
    disabled: { type: Boolean, default: false },
    dynamicIndex: {
      type: Number,
    },
    dic: {
      type: Array,
      default: () => {
        return [];
      },
    },

    // 组件自定义属性
    title: { type: String, default: '' },
    objectName: {
      type: String,
      default: '',
      validator: (value) => Object.keys(cacheData).includes(value),
    },
    returnType: {
      type: String,
      default: 'string',
      validator: (value) => ['string', 'object'].includes(value),
    },
    width: { type: String, default: '100%' },
    placeholder: { type: String, default: '请点击选择' },
    dialogWidth: { type: String, default: '1200px' },
    query: {
      type: Object,
      default: () => {
        return {};
      },
    },
    rowKey: { type: String, default: () => 'id' },
    multiple: { type: Boolean, default: false },
    clearable: { type: Boolean, default: false },
    showKey: { type: String, default: '' },
    inputProps: { type: Object, default: () => ({}) },
  },
  emits: ['change', 'update:modelValue'],
  data() {
    return {
      // Props mixin 中的数据
      text: undefined,
      stringMode: false,
      textLabel: '',
      blur: this.column.blur,
      focus: this.column.focus,
      change: this.column.change,
      click: this.column.click,

      // 组件自定义数据
      open: false,
      loading: false,
      model: null,
      label: null,
      radioValue: '',
      paginationProps: {},
      dataList: [],
      inputValue: [],
      selected: [],
      openSelected: false,
      searchKeyword: '',
      searchColumn: 'name', // 默认搜索列
      searchableColumns: [], // 可搜索的列
      zIndex: 10090, // 提高z-index确保弹窗在最上层
    };
  },
  computed: {
    // Props mixin 中的计算属性
    isArray() {
      return this.column && this.column.dataType === 'array';
    },
    isString() {
      return this.column && this.column.dataType === 'string';
    },
    isNumber() {
      return this.column && this.column.dataType === 'number';
    },
    valueKey() {
      if (!this.column || !this.column.props) return 'value';
      const DIC_PROPS = { value: 'value', label: 'label', children: 'children' };
      return { ...DIC_PROPS, ...this.column.props }.value;
    },
    labelKey() {
      if (!this.column || !this.column.props) return 'label';
      const DIC_PROPS = { value: 'value', label: 'label', children: 'children' };
      return { ...DIC_PROPS, ...this.column.props }.label;
    },
    childrenKey() {
      if (!this.column || !this.column.props) return 'children';
      const DIC_PROPS = { value: 'value', label: 'label', children: 'children' };
      return { ...DIC_PROPS, ...this.column.props }.children;
    },
    descKey() {
      if (!this.column || !this.column.props) return 'desc';
      const DIC_PROPS = { value: 'value', label: 'label', children: 'children' };
      return { ...DIC_PROPS, ...this.column.props }.desc;
    },

    // 组件自定义计算属性
    // label() {
    //     return this.inputValue.map((item) => item[this.showKey || this.model.defaultLabel] || item.id).join('，');
    // },
    popuplabel() {
      return this.selected
        .map((item) => item[this.showKey || this.model.defaultLabel] || item.id)
        .join(',');
    },
    // 获取可搜索的列
    searchableFields() {
      if (!this.model || !this.model.column) return [];
      return this.model.column.filter((col) => col.search === true).map((col) => col.prop);
    },
    cacheDataplaceholder() {
      return cacheData[this.objectName].placeholder;
    },
    cacheDatadefaultLabel() {
      return cacheData[this.objectName].defaultLabel;
    },
  },
  watch: {
    // Props mixin 中的监听器
    text: {
      handler(val) {
        if (this.initValue && typeof this.initValue == 'function') {
          this.initValue();
        }
        if (
          this.column &&
          this.column.type &&
          ['select', 'radio', 'checkbox', 'tree'].includes(this.column.type)
        ) {
          this.initTextLabel();
        }
        this.handleChange(val);
      },
    },

    // 合并 modelValue 监听器
    modelValue: {
      immediate: true,
      deep: true,
      handler(newVal) {
        console.log('wf-form-single modelValue changed:', newVal, 'objectName:', this.objectName);

        // Props mixin 中的处理
        this.initVal();

        // 组件自定义处理
        // 只有当newVal是字符串或数字时才直接赋值给label
        if (typeof newVal === 'string' || typeof newVal === 'number') {
          this.label = newVal;
        } else if (typeof newVal === 'object' && newVal !== null) {
          // 如果是对象，尝试提取显示值
          const labelKey = this.showKey || (this.model && this.model.defaultLabel) || 'name';
          this.label = newVal[labelKey] || newVal.id || String(newVal);
        } else {
          this.label = '';
        }
        this.text = newVal; // 同步到 text 属性

        // 当外部值变化时，异步加载数据并更新选中状态
        this.$nextTick(() => {
          let ids = [];

          // 提取ID数组
          if (typeof newVal === 'string' && newVal) {
            ids = newVal.split(',');
          } else if (Array.isArray(newVal)) {
            ids = newVal.map((item) => item.id).filter(Boolean);
          } else if (typeof newVal === 'object' && newVal?.id) {
            ids = [newVal.id];
          }

          if (!ids.length) {
            this.inputValue = [];
            this.selected = [];
            return;
          }

          if (!this.model?.url) {
            console.warn('model.url 未定义');
            return;
          }

          // 异步加载数据并设置选中状态
          // cacheApi.cache
          //   .getView({
          //     url: this.model.url,
          //     data: [JL2109212],
          //   })
          //   .then((response) => {
          //     console.log('response:', response);
          //     const data = response || [];
          //     this.inputValue = this.deepClone(data);
          //     console.log('wf-form-single inputValue:', this.inputValue);
          //     this.selected = this.deepClone(data);
          //     if (data.length > 0) {
          //       this.radioValue = data[0].id;
          //       // 更新显示标签
          //       const labelKey = this.showKey || this.model.defaultLabel || 'name';
          //       this.label = data[0][labelKey] || data[0].id || '';
          //     }
          //   })
          //   .catch((error) => {
          //     console.error('Error fetching data:', error);
          //   });
        });
      },
    },

    radioValue: {
      immediate: true,
      deep: true,
      handler(newVal) {
        console.log('radioValue changed:', newVal);
        if (!this.multiple && newVal) {
          const findItem = Array.isArray(this.dataList)
            ? this.dataList.find((item) => item.id === newVal)
            : null;
          if (findItem) {
            this.selected = [findItem];
          }
        }
      },
    },
  },
  created() {
    // 初始化 Props mixin 中的数据
    if (this.column) {
      this.blur = this.column.blur;
      this.focus = this.column.focus;
      this.change = this.column.change;
      this.click = this.column.click;
    }

    // 初始化组件自定义数据
    this.model = cacheData[this.objectName];
    if (this.model) {
      this.columns = this.model.column;
    }

    console.log('wf-form-single created:', {
      objectName: this.objectName,
      model: this.model,
      modelValue: this.modelValue,
      returnType: this.returnType,
    });
  },
  methods: {
    // Props mixin 中的方法
    getPlaceholder() {
      if (!this.column) return '请选择';
      return this.column.placeholder || '请选择';
    },
    initTextLabel() {
      if (!this.text || !this.dic || this.dic.length === 0) {
        this.$set(this, 'textLabel', '');
        this.$emit('label-change', '');
        return;
      }

      const textLabel = [];
      let arr = this.deepClone(this.dic);
      const val = (this.text + '').split(',');
      val.forEach((t) => {
        const { list, label } = this.handleTextLabel(arr, t);
        if (list && list.length > 0) arr = list;
        if (label) textLabel.push(label);
      });
      this.$set(this, 'textLabel', textLabel.join('/'));
      this.$emit('label-change', this.stringMode ? textLabel.join('/') : textLabel);
    },
    handleTextLabel(list, value) {
      let result = {};
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (item[this.valueKey] == value) {
          result.label = item[this.labelKey];
          result.list = item[this.childrenKey];
          break;
        }
        const children = item[this.childrenKey];
        if (children && children.length > 0) {
          result = this.handleTextLabel(children, value);
          if (result.label) return result;
        }
      }
      if (Object.keys(result).length == 0) result = { list, label: value };
      return result;
    },
    deepClone(obj) {
      if (obj === null || typeof obj !== 'object') return obj;
      if (obj instanceof Date) return new Date(obj);
      if (obj instanceof Array) return obj.map((item) => this.deepClone(item));
      if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            clonedObj[key] = this.deepClone(obj[key]);
          }
        }
        return clonedObj;
      }
    },
    validateNull(val) {
      return val === null || val === undefined || val === '';
    },
    initVal() {
      // 初始化值，可以根据需要实现
    },
    initValue() {
      // 初始化值，可以根据需要实现
    },
    handleChange(val) {
      // 处理值变化，可以根据需要实现
    },

    // 组件自定义方法
    async loadData() {
      if (!this.model || !this.model.dialogGet) {
        console.error('模型或请求方法未定义');
        return;
      }
      this.loading = true;
      try {
        // 构建请求参数，设置一个较大的页面大小以获取所有数据
        const params = {
          ...this.model.query,
          current: 1,
          size: 10, // 设置一个较大的值以获取所有数据
        };
        const response = await this.model.dialogGet(params);

        // 处理响应数据
        if (response && response.data) {
          this.dataList = response.data.data.records || response.data || [];
        } else {
          this.dataList = [];
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        this.dataList = [];
        showToast({
          message: '加载数据失败',
          type: 'fail',
        });
      } finally {
        this.loading = false;
      }
    },
    handleSearch() {
      console.log(this.cacheDatadefaultLabel);
      // 确保 model.query 是对象类型
      if (!this.model.query || typeof this.model.query !== 'object') {
        this.model.query = {};
      }
      this.model.query[this.cacheDatadefaultLabel] = this.searchKeyword;
      this.loadData();
    },
    handleClearSearch() {
      // 清除搜索关键词和参数
      this.searchKeyword = '';
    },
    openPopup() {
      this.searchKeyword = '';
      this.open = true;
      this.dataList = [];
      this.selected = [];
      this.radioValue = null;

      // 打开弹窗时加载数据
      this.loadData();
    },
    closePopup() {
      this.open = false;
      this.selected = [];
    },
    doAction(action) {
      if (action === 'close') {
        this.handleClose();
      } else if (action === 'clear') {
        this.handleClear();
      } else if (action === 'confirm') {
        this.handleConfirm();
      } else if (action === 'expand') {
        this.openSelected = true;
      }
    },
    handleRowClick(row) {
      if (this.selected.some((item) => item.id === row.id)) {
        this.selected.splice(
          this.selected.findIndex((item) => item.id === row.id),
          1
        );
      } else {
        this.selected.push(row);
      }
    },
    handleConfirm() {
      const updateVal =
        this.selected && this.selected.length > 0
          ? this.selected[0][this.showKey || this.model.defaultLabel]
          : null;
      console.log('handleConfirm selected:', this.selected);
      console.log('updateVal:', updateVal);

      // 更新内部label值
      this.label = updateVal;

      // 根据returnType决定返回的数据类型
      let emitValue;
      if (this.returnType === 'object' && this.selected && this.selected.length > 0) {
        emitValue = this.selected[0];
      } else {
        emitValue = updateVal;
      }

      // 触发change事件，传递完整的数据对象，便于表单联动
      const changeData = this.selected && this.selected.length > 0 ? this.selected[0] : null;
      console.log('emit change:', changeData);
      this.$emit('change', changeData);

      // 触发input事件，根据returnType传递相应格式的值
      this.$emit('update:modelValue', emitValue);

      // 触发update:modelValue事件，用于v-model双向绑定
      this.$emit('update:modelValue', emitValue);

      this.handleClose();
    },
    handleClear() {
      this.radioValue = null;
      this.selected = [];

      this.handleConfirm();
    },
    handleClose() {
      this.open = false;

      this.selected = [];
    },
  },
};
</script>
<style lang="scss" scoped>
// .dc-select-dialog{
// 	width: 100%;
// }
.search-box {
  padding: 0 30rpx;
  background-color: #fff;
  border-radius: 20rpx 20rpx 0 0;
  height: 50vh;
  overflow-y: scroll;
  // 搜索框标题样式
  .search-box__title {
    padding: 40rpx 0;
    margin: 0 auto;
    position: absolute;
    top: 0;
    left: 0;

    background-color: #fff;
    width: 100%;
    z-index: 100;
  }

  // 单选框组样式
  :deep(.van-radio-group) {
    .radio-item {
      width: 100%;
      padding: 20rpx;

      margin-bottom: 10rpx;
      background-color: #f8f9fa;
      border-radius: 8rpx;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;

      // 选中背景色
      &.selected {
        background-color: #e6f7ff;
        border: 1rpx solid #91d5ff;
      }

      &:last-child {
        margin-bottom: 0;
      }

      .van-radio {
        width: 100%;
        margin: 8px 12px;

        .van-radio__label {
          width: 100%;

          .radioIndexClass {
            display: flex;
            flex-direction: column;
            width: 100%;

            padding: 8rpx 0; // 添加上下内边距，增加间隔

            .radio-column {
              font-size: 26rpx; // 字体从28rpx减小到26rpx
              color: #333;
              line-height: 1.6; // 增加行高，提高可读性
              margin-bottom: 6rpx; // 添加底部间距

              &:last-child {
                margin-bottom: 0; // 最后一个元素不添加底部间距
              }
            }
          }
        }

        // 确保radio图标显示
        .van-radio__icon {
          margin-right: 20rpx;

          .van-radio__icon--checked {
            background-color: #007aff;
            border-color: #007aff;
          }
        }
      }
    }
  }

  // 加载状态样式
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60rpx 0;

    .loading-text {
      margin-top: 20rpx;
      font-size: 28rpx;
      color: #999;
    }
  }

  // 底部按钮区域
  .dc-select-dialog__footer {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    display: flex;
    justify-content: space-between;
    padding: 30rpx 0 0;
    margin-top: 30rpx;
    background-color: #fff;
    border-top: 1rpx solid #f0f0f0;
  }
}

// 弹窗样式优化
:deep(.van-popup) {
  .van-popup__content {
    border-radius: 20rpx 20rpx 0 0;
    overflow-y: scroll;
    // 确保内容区域有足够的底部间距，避免被固定按钮遮挡
    padding-bottom: 120rpx;
  }
}
</style>
