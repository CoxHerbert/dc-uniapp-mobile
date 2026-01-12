<template>
  <div class="wf-cascader">
    <!-- 展示字段 -->
    <van-field
      v-model="textLabel"
      is-link
      readonly
      :placeholder="getPlaceholder(column, column.type)"
      @click="onClick"
    />

    <!-- 底部弹出层 -->
    <van-popup v-model:show="show" position="bottom" round>
      <!-- 直接使用 Vant 的级联选择器 -->
      <van-cascader
        v-model="innerValue"
        v-bind="column.props"
        :title="column.label"
        :options="dic"
        @finish="handleFinish"
      />
    </van-popup>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { Field, Popup, Cascader as VanCascader } from 'vant';
import Props from '../../mixins/props.js';

export default defineComponent({
  name: 'WfCascader',
  components: {
    [Field.name]: Field, // van-field
    [Popup.name]: Popup, // van-popup
    [VanCascader.name]: VanCascader, // van-cascader
  },
  mixins: [Props],
  data() {
    return {
      show: false,
      textLabel: '',
      // 级联当前选中值（用于 v-model 绑定 van-cascader）
      innerValue: [],
    };
  },
  watch: {
    dic: {
      handler(val) {
        if (!this.validateNull(val)) this.initTextLabel();
      },
      deep: true,
    },
  },
  methods: {
    // 点击输入框，打开级联弹窗
    onClick() {
      if (!this.disabled) {
        // 根据当前 this.text 回填 van-cascader 的选中值
        if (this.column.type === 'cascader') {
          this.innerValue = Array.isArray(this.text)
            ? [...this.text]
            : this.text
              ? [this.text]
              : [];
        } else {
          this.innerValue = this.text || '';
        }

        this.show = true;
      }
      this.handleClick();
    },

    // 兼容原来 onConfirm 的逻辑，封装一层
    handleFinish({ value, selectedOptions }) {
      const val = {
        result: selectedOptions || [],
        [this.valueKey]: value,
      };
      this.onConfirm(val);
    },

    // 原来的确认逻辑：写回 this.text
    onConfirm(val) {
      const { result } = val;
      const value = val[this.valueKey];
      if (this.column.type === 'cascader') {
        // 级联：把选中节点数组映射成值数组
        this.text = result.map((r) => r[this.valueKey]);
      } else {
        // 普通单选：直接用 value
        this.text = value;
      }
      this.show = false;
    },
  },
});
</script>

<style lang="scss" scoped>
.wf-cascader {
  width: 100%;
}
</style>
