import { DIC_PROPS, DIC_HTTP_PROPS, DIC_LIST } from '../util/variable.js';
import { getPlaceholder } from '../util/dataformat.js';
import Event from './event.js';
export default {
  mixins: [Event],
  watch: {
    text: {
      handler(val) {
        if (this.initValue && typeof this.initValue == 'function') {
          this.initValue();
        }
        if (DIC_LIST.includes(this.column.type)) {
          this.initTextLabel();
        }
        this.handleChange(val);
      },
    },
    modelValue: {
      handler(val) {
        this.initVal();
      },
      immediate: true,
    },
  },
  props: {
    modelValue: undefined,
    column: {},
    disabled: Boolean,
    dic: {
      type: Array,
      default: () => {
        return [];
      },
    },
    dynamicIndex: undefined,
  },
  data() {
    return {
      text: undefined,
      stringMode: false,
      textLabel: '',
      blur: this.column.blur,
      focus: this.column.focus,
      change: this.column.change,
      click: this.column.click,
    };
  },
  computed: {
    isArray() {
      return this.column.dataType === 'array';
    },
    isString() {
      return this.column.dataType === 'string';
    },
    isNumber() {
      return this.column.dataType === 'number';
    },
    valueKey() {
      return { ...DIC_PROPS, ...this.column.props }.value;
    },
    labelKey() {
      return { ...DIC_PROPS, ...this.column.props }.label;
    },
    childrenKey() {
      return { ...DIC_PROPS, ...this.column.props }.children;
    },
    descKey() {
      return { ...DIC_PROPS, ...this.column.props }.desc;
    },
  },
  methods: {
    getPlaceholder,
    initTextLabel() {
      if (!this.validateNull(this.text) && !this.validateNull(this.dic)) {
        const textLabel = [];
        let arr = this.deepClone(this.dic);
        const val = (this.text + '').split(',');
        val.forEach((t) => {
          const { list, label } = this.handleTextLabel(arr, t);
          if (!this.validateNull(list)) arr = list;
          if (label) textLabel.push(label);
        });
        this.textLabel = textLabel.join('/');
        this.$emit('label-change', this.stringMode ? textLabel.join('/') : textLabel);
      } else {
        this.textLabel = '';
        this.$emit('label-change', '');
      }
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
        if (!this.validateNull(children)) {
          result = this.handleTextLabel(children, value);
          if (result.label) return result;
        }
      }
      if (Object.keys(result).length == 0) result = { list, label: value };
      return result;
    },
  },
};
