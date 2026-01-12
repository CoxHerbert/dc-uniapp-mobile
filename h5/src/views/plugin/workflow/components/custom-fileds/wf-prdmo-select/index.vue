<template>
  <div class="wl-wrapper">
    <!-- 只读选择输入框 -->
    <van-field
      v-model="name"
      class="wl-field"
      :class="sizeClass"
      is-link
      readonly
      :disabled="disabled"
      :placeholder="placeholder || '专案物料查询'"
      :right-icon="readonly || disabled ? '' : 'search'"
      @click="handleSelect"
      @click-right-icon="handleSelect"
    />

    <!-- 选择弹窗 -->
    <nf-prdmo-select
      ref="prdmoSelect"
      :check-type="checkType"
      :default-checked="modelValue"
      @on-confirm="handleSelectConfirm"
    />
  </div>
</template>

<script>
import NfPrdmoSelect from '../../wf-prdmo-select/index.vue';

export default {
  name: 'PrdmoSelect', // 或 WfPrdmoSelect，跟 wf-form 那边注册一致
  components: { NfPrdmoSelect },
  props: {
    modelValue: [String, Number, Object],

    // 关键补丁：接收动态表单透传来的 children，防止落到 DOM 上
    children: {
      type: [Array, Object],
      default: () => [],
    },

    // radio 单选 / checkbox 多选
    checkType: {
      type: String,
      default: () => 'radio',
    },
    size: {
      type: String,
      default: () => 'default',
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    placeholder: String,
    change: Function,
  },
  emits: ['update:modelValue', 'change'],

  data() {
    return {
      name: '',
    };
  },

  computed: {
    sizeClass() {
      return this.size ? `wl-field--${this.size}` : '';
    },
  },

  watch: {
    modelValue: {
      handler(val) {
        if (val && typeof val === 'object') {
          this.name = val.materialName || '';
        } else if (typeof val === 'string' || typeof val === 'number') {
          this.name = String(val);
        } else {
          this.name = '';
        }
      },
      immediate: true,
    },
  },

  methods: {
    handleSelect() {
      if (this.readonly || this.disabled) return;
      if (this.$refs.prdmoSelect) {
        this.$refs.prdmoSelect.visible = true;
      }
    },

    handleSelectConfirm(list) {
      if (!list || !list.length) return;
      const value = list[0];

      this.name = value.materialName || '';
      this.$emit('update:modelValue', value);

      if (this.change && typeof this.change === 'function') {
        this.change({ value });
      }
      this.$emit('change', { value });
    },
  },
};
</script>

<style lang="scss" scoped>
.wl-wrapper {
  display: flex;
  align-items: center;

  .organization {
    margin-right: 20px;
  }
}

.wl-field {
  width: 100%;
}

.wl-field--small {
  font-size: 12px;
}

.wl-field--default {
  font-size: 14px;
}

.wl-field--large {
  font-size: 16px;
}
</style>
