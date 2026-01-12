<template>
  <div class="wf-form">
    <div class="wf-form-content">
      <template v-if="option.column && option.column.length > 0 && formCreate">
        <template v-for="(item, index) in option.column" :key="index">
          <wkf-form-item
            v-if="item.display !== false && filter(item)"
            :ref="item.prop"
            v-model="form[item.prop]"
            :column="item"
            :disabled="
              allDisabled ||
              option.disabled ||
              option.readonly ||
              option.detail ||
              item.disabled ||
              item.readonly ||
              item.detail
            "
            :dic="dic[item.prop]"
            :label-width="option.labeWidth || option.labelWidth"
            :label-position="option.labelPosition"
            :dynamic-index="option.dynamicIndex"
            @label-change="handleLabelChange"
          />
        </template>
      </template>
      <template v-if="option.group && option.group.length > 0 && formCreate">
        <van-collapse v-model="activeGroups" :border="false">
          <template v-for="(group, gIndex) in option.group" :key="gIndex">
            <van-collapse-item
              v-if="group.display !== false"
              :name="gIndex"
              :disabled="group.arrow === true"
            >
              <template #title>
                <span>
                  <van-icon
                    v-if="group.icon"
                    :name="group.icon.replace('el-icon-', '')"
                    class="wf-form-group__icon"
                  />
                  {{ group.label }}
                </span>
              </template>
              <template v-for="(item, index) in group.column" :key="index">
                <wkf-form-item
                  v-if="item.display !== false && filter(item)"
                  :ref="item.prop"
                  v-model="form[item.prop]"
                  :column="item"
                  :disabled="
                    allDisabled ||
                    option.disabled ||
                    option.readonly ||
                    option.detail ||
                    item.disabled ||
                    item.readonly ||
                    item.detail
                  "
                  :dic="dic[item.prop]"
                  :label-width="option.labeWidth || option.labelWidth"
                  :label-position="option.labelPosition"
                  :dynamic-index="option.dynamicIndex"
                  @label-change="handleLabelChange"
                />
              </template>
            </van-collapse-item>
          </template>
        </van-collapse>
      </template>
    </div>
    <div
      v-if="
        ((option.column && option.column.length > 0) ||
          (option.group && option.group.length > 0)) &&
        menuBtn.show
      "
      class="wf-form-bottom"
    >
      <van-button
        v-if="menuBtn.submitBtn"
        :loading="allDisabled"
        type="primary"
        size="small"
        block
        @click="submit"
      >
        {{ menuBtn.submitText }}
      </van-button>
      <slot name="menu"></slot>
    </div>
  </div>
</template>

<script>
import { Button, Collapse, CollapseItem, Icon, Toast } from 'vant';
import Schema from '@/uview-ui/libs/util/async-validator.js';
import WkfFormItem from '../wkf-form-item/wkf-form-item.vue';
import Dic from '../../mixins/dic.js';
import { formInitVal, initRules } from '../../util/dataformat.js';
import { filter } from '../../util/unsupport.js';

export default {
  name: 'WkfForm',
  components: {
    WkfFormItem,
    [Button.name]: Button,
    [Collapse.name]: Collapse,
    [CollapseItem.name]: CollapseItem,
    [Icon.name]: Icon,
  },
  mixins: [Dic],
  props: {
    option: {
      type: Object,
      required: true,
      default: () => ({ column: [], menuBtn: false }),
    },
    modelValue: {},
  },
  data() {
    return {
      form: {},
      rules: {},
      dic: {},
      formVal: {},
      formCreate: false,
      allDisabled: false,
      activeGroups: [],
      validator: null,
    };
  },
  computed: {
    column() {
      let result = [];
      const column = this.option.column;
      const group = this.option.group;
      if (!this.validateNull(column)) result = column;
      if (!this.validateNull(group)) {
        group.forEach((g) => {
          if (!this.validateNull(g.column)) result = result.concat(g.column);
        });
      }
      return result;
    },
    dynamicOption() {
      const list = [];
      this.column.forEach((ele) => {
        if (ele.type === 'dynamic' && ele.display !== false && filter(ele)) {
          list.push(ele);
        }
      });
      return list;
    },
    menuBtn() {
      const { menuBtn, submitBtn, enptyBtn, submitText, emptyText, detail, readonly, disabled } =
        this.option;
      return {
        show: menuBtn === false || detail || readonly || disabled ? false : true,
        submitBtn: submitBtn === false ? false : true,
        enptyBtn: enptyBtn === false ? false : true,
        submitText: submitText || '提交',
        emptyText: emptyText || '清空',
      };
    },
  },
  watch: {
    form: {
      handler(val) {
        if (this.formCreate) {
          this.$emit('update:modelValue', val);
        }
      },
      deep: true,
    },
    modelValue: {
      handler(val) {
        if (this.formCreate) {
          this.setForm(val || {});
        } else {
          this.formVal = Object.assign(this.formVal, val || {});
        }
      },
      deep: true,
      immediate: true,
    },
    option: {
      handler() {
        if (this.formCreate) {
          this.init(false);
        }
      },
      deep: true,
    },
  },
  mounted() {
    setTimeout(() => {
      this.init();
    }, 200);
  },
  methods: {
    filter,
    init(init = true) {
      this.initDic();
      if (init) {
        const defaultValue = formInitVal(this.column).tableForm;
        Object.keys(defaultValue).forEach((ele) => {
          if (this.validateNull(this.formVal[ele])) {
            this.formVal[ele] = defaultValue[ele];
          }
        });
        this.setForm(this.formVal);
      }
      this.rules = initRules(this.column);
      this.validator = new Schema(this.rules);
      this.updateActiveGroups();
      this.formCreate = true;
    },
    initDic() {
      this.column.forEach((col) => {
        this.handleDic(col).then((dic) => {
          if (!this.validateNull(dic)) {
            this.dic[col.prop] = dic;
          }
        });
      });
    },
    setForm(value) {
      Object.keys(value).forEach((ele) => {
        this.form[ele] = value[ele];
      });
    },
    updateActiveGroups() {
      if (!Array.isArray(this.option.group)) {
        this.activeGroups = [];
        return;
      }
      const actives = [];
      this.option.group.forEach((group, index) => {
        if (group.collapse !== false) {
          actives.push(index);
        }
      });
      this.activeGroups = actives;
    },
    runBaseValidation() {
      if (!this.validator) {
        this.validator = new Schema(this.rules || {});
      }
      return this.validator
        .validate(this.form, { firstFields: true })
        .then(() => true)
        .catch((error) => {
          const message = error?.errors?.[0]?.message;
          if (message) {
            Toast.fail(message);
          }
          return false;
        });
    },
    validateCellForm() {
      return this.runBaseValidation();
    },
    validate(callback) {
      this.runBaseValidation().then((valid) => {
        if (!valid) {
          callback(false, this.hide);
          return;
        }
        const dynamicList = [];
        this.dynamicOption.forEach((ele) => {
          const target = this.$refs[ele.prop]?.[0]?.$refs?.temp?.$refs?.main;
          if (Array.isArray(target) && target.length) {
            target.forEach((item) => {
              if (item && typeof item.validateCellForm === 'function') {
                dynamicList.push(item.validateCellForm());
              }
            });
          }
        });
        if (!dynamicList.length) {
          this.show();
          callback(true, this.hide);
          return;
        }
        Promise.all(dynamicList).then((res) => {
          const hasError = res.some((item) => !item);
          if (!hasError) {
            this.show();
            callback(true, this.hide);
          } else {
            callback(false, this.hide);
          }
        });
      });
    },
    submit() {
      this.validate((valid) => {
        if (valid) {
          this.$emit('submit', this.deepClone(this.form), this.hide);
        }
      });
    },
    resetFields() {
      const defaultValue = formInitVal(this.column).tableForm;
      Object.keys(defaultValue).forEach((ele) => {
        this.form[ele] = defaultValue[ele];
      });
      this.hide();
    },
    show() {
      this.allDisabled = true;
    },
    hide() {
      this.allDisabled = false;
    },
    handleLabelChange({ prop, value, change }) {
      this.form[`$${prop}`] = value;
      if (change) {
        change.call(this, { value });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.wf-form {
  padding: 0 15px;
  background: #fff;

  &-content {
    width: 100%;
  }

  &-bottom {
    width: 100%;
    padding: 5px 15px calc(env(safe-area-inset-bottom) + 5px) 15px;
    position: fixed;
    background-color: #fff;
    z-index: 3;
    bottom: 0;
    left: 0;

    ::v-deep(.van-button) {
      width: 100%;
    }
  }

  ::v-deep(.van-collapse-item__content) {
    padding: 0;
  }
}

.wf-form-group__icon {
  margin-right: 5px;
}
</style>
