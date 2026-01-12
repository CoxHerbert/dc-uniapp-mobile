<template>
  <div class="wf-form-item" :class="itemClass">
    <div v-if="column.label" class="wf-form-item__label" :style="labelStyle">
      <span v-if="isRequired" class="wf-form-item__asterisk">*</span>
      <span>{{ column.label }}：</span>
    </div>
    <div class="wf-form-item__content">
      <wf-input
        v-if="
          [undefined, 'input', 'password', 'textarea', 'number'].includes(column.type) &&
          !column.component
        "
        v-model="text"
        :column="column"
        :disabled="disabled"
        :dynamic-index="dynamicIndex"
      />
      <wf-select
        v-else-if="['select'].includes(column.type)"
        v-model="text"
        :column="column"
        :dic="dic"
        :disabled="disabled"
        :dynamic-index="dynamicIndex"
        @label-change="handleLabelChange"
      />
      <wf-cascader
        v-else-if="['cascader', 'tree'].includes(column.type)"
        v-model="text"
        :column="column"
        :dic="dic"
        :disabled="disabled"
        :dynamic-index="dynamicIndex"
        @label-change="handleLabelChange"
      />
      <wf-radio
        v-else-if="column.type === 'radio'"
        v-model="text"
        :column="column"
        :dic="dic"
        :disabled="disabled"
        :dynamic-index="dynamicIndex"
        @label-change="handleLabelChange"
      />
      <wf-checkbox
        v-else-if="column.type === 'checkbox'"
        v-model="text"
        :column="column"
        :dic="dic"
        :disabled="disabled"
        :dynamic-index="dynamicIndex"
        @label-change="handleLabelChange"
      />
      <wf-rate
        v-else-if="column.type === 'rate'"
        v-model="text"
        :column="column"
        :disabled="disabled"
        :dynamic-index="dynamicIndex"
      />
      <wf-slider
        v-else-if="column.type === 'slider'"
        v-model="text"
        :column="column"
        :disabled="disabled"
        :dynamic-index="dynamicIndex"
      />
      <wf-switch
        v-else-if="column.type === 'switch'"
        v-model="text"
        :column="column"
        :disabled="disabled"
        :dynamic-index="dynamicIndex"
      />
      <wf-date
        v-else-if="DATE_LIST.includes(column.type)"
        v-model="text"
        :column="column"
        :disabled="disabled"
        :dynamic-index="dynamicIndex"
      />
      <wf-upload
        v-else-if="column.type === 'upload'"
        v-model="text"
        :column="column"
        :disabled="disabled"
        :dynamic-index="dynamicIndex"
      />
      <wf-map
        v-else-if="column.type === 'map'"
        ref="temp"
        v-model="text"
        :column="column"
        :disabled="disabled"
        :dynamic-index="dynamicIndex"
      />
      <wf-table-select
        v-else-if="column.type === 'table-select'"
        ref="temp"
        v-model="text"
        :column="column"
        :disabled="disabled"
        :dynamic-index="dynamicIndex"
      />
      <wf-sign
        v-else-if="column.type === 'sign'"
        ref="temp"
        v-model="text"
        :column="column"
        :disabled="disabled"
        :dynamic-index="dynamicIndex"
      />
      <component
        :is="column.component"
        v-else-if="column.component"
        v-model="text"
        v-bind="column"
        :column="Object.assign(column, column.params || {})"
        :dic="dic"
        :disabled="disabled"
        :dynamic-index="dynamicIndex"
      />
    </div>
  </div>
</template>

<script>
import { DATE_LIST } from '../../util/variable.js';
import { mpFormInitVal } from '../../util/dataformat.js';

export default {
  name: 'WkfFormItem',
  props: {
    column: {
      type: Object,
      default: () => ({}),
    },
    modelValue: {
      type: [Object, Array, String, Number],
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    dic: {
      type: Array,
      default: () => [],
    },
    labelPosition: String,
    labelWidth: Number,
    dynamicIndex: undefined,
  },
  data() {
    return { text: undefined, init: false, DATE_LIST };
  },
  computed: {
    isRequired() {
      return !this.validateNull(this.column.rules);
    },
    itemClass() {
      const position = this.column.type === 'dynamic' ? 'top' : this.labelPositionValue;
      return [`wf-form-item--${position}`, { 'wf-form-item--required': this.isRequired }];
    },
    labelPositionValue() {
      return this.labelPosition || this.column.labelPosition || 'left';
    },
    labelStyle() {
      const width = this.column.labelWidth ?? this.labelWidth;
      if (width) {
        const widthNumber = Number(String(width).replace(/px|rpx/g, ''));
        if (!Number.isNaN(widthNumber)) {
          const pxWidth = widthNumber / 2;
          return {
            minWidth: `${pxWidth}px`,
            width: `${pxWidth}px`,
          };
        }
        return {
          minWidth: width,
          width: width,
        };
      }
      return {};
    },
  },
  watch: {
    text: {
      handler(val) {
        if (this.init || !this.validateNull(val)) {
          this.init = true;
          this.$emit('update:modelValue', val);
          this.$emit('change', val);
        } else {
          this.init = true;
        }
      },
    },
    modelValue: {
      handler(val) {
        const nextVal = this.validateNull(val) ? mpFormInitVal(this.column) : val;
        this.text = nextVal;
      },
      immediate: true,
    },
  },
  methods: {
    handleLabelChange(val) {
      this.text = val;
      this.$emit('label-change', { prop: this.column.prop, value: val, index: this.dynamicIndex });
    },
  },
};
</script>

<style lang="scss" scoped>
.wf-form-item {
  width: 100%;
  display: flex;
  align-items: flex-start;
  padding: 10px 0;

  &__label {
    flex: 0 0 auto;
    min-width: 80px;
    padding-right: 10px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    color: #303133;
    font-size: 14px;
  }

  &__asterisk {
    color: #ee0a24;
    margin-right: 3px;
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &--top {
    // flex-direction: column;

    .wf-form-item__label {
      // width: 100%;
      margin-bottom: 5px;
    }

    .wf-form-item__content {
      width: 100%;
    }
  }

  &--left {
    flex-direction: row;
  }
}
</style>
