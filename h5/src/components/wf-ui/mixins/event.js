import { initVal } from '../util/dataformat.js';
import { DIC_SPLIT } from '../util/variable.js';

function bindEvent(safe, name, event) {
  typeof safe[name] === 'function' &&
    safe[name]({ value: safe.value, column: safe.column, index: safe.dynamicIndex });
  safe.$emit(name, safe.value, event);
}
export default {
  methods: {
    initVal() {
      this.stringMode = typeof this.modelValue == 'string';
      this.text = initVal(this.modelValue, this.column);
    },
    handleFocus(event) {
      bindEvent(this, 'focus', event);
    },
    handleBlur(event) {
      bindEvent(this, 'blur', event);
    },
    handleClick(event) {
      bindEvent(this, 'click', event);
    },
    handleChange(value) {
      let result =
        value && typeof value === 'object' && 'target' in value ? value?.target?.value : value;
      let flag =
        this.isString || this.isNumber || this.stringMode || this.listType === 'picture-img';
      if (flag && Array.isArray(value)) {
        result = value.join(this.separator || DIC_SPLIT);
      }
      if (value !== result && typeof result !== 'undefined') {
        this.text = result;
      }
      if (typeof this.change === 'function' && this.column.cell !== true) {
        this.change({ value: result, column: this.column, index: this.dynamicIndex });
      }
      this.$emit('update:modelValue', result);
      this.$emit('change', result);
    },
  },
};
