<template>
  <div class="wf-form">
    <div class="wf-form-content">
      <!-- 普通字段 -->
      <template v-if="option.column && option.column.length > 0">
        <template v-for="(item, index) in option.column" :key="index">
          <wf-form-item
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

      <!-- 分组字段 -->
      <template v-if="option.group && option.group.length > 0">
        <van-collapse v-model="activeGroups" :border="false">
          <template v-for="(group, gIndex) in option.group" :key="group.name || gIndex">
            <van-collapse-item
              v-if="group.display !== false"
              :name="String(group.name || gIndex)"
              :disabled="group.arrow === false"
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
                <wf-form-item
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

    <!-- 底部按钮 -->
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
import { showToast } from 'vant';
import Schema from '@/uview-ui/libs/util/async-validator.js';
import Dic from '../../mixins/dic.js';
import { formInitVal, initRules } from '../../util/dataformat.js';
import { filter } from '../../util/unsupport.js';

export default {
  name: 'WfForm',
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
      const result = [];
      const column = this.option.column;
      const group = this.option.group;

      const appendColumn = (item) => {
        result.push(item);
        if (item && item.prop) {
          result[item.prop] = item;
        }
      };

      if (!this.validateNull(column)) {
        column.forEach((item) => appendColumn(item));
      }

      if (!this.validateNull(group)) {
        group.forEach((g) => {
          if (!this.validateNull(g.column)) {
            g.column.forEach((item) => appendColumn(item));
          }
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
        this.init(false);
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
      // #ifdef MP
      this.initFunc();
      // #endif
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
    // #ifdef MP
    initFunc() {
      const column = this.option.column;
      const group = this.option.group;
      if (!this.validateNull(column)) {
        column.forEach((col) => {
          col.value = this.form[col.prop];
        });
      }
      if (!this.validateNull(group)) {
        group.forEach((g) => {
          if (!this.validateNull(g.column)) {
            g.column.forEach((col) => {
              col.value = this.form[col.prop];
            });
          }
        });
      }
    },
    // #endif
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
          // 和模板中的 :name 保持一致，统一用字符串
          const name = String(group.name || index);
          actives.push(name);
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
            showToast(message);
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
      this.form[`${prop}`] = value;
      if (change) {
        change.call(this, { value });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.wf-form {
  background: #fff;
  &-content {
    width: 100%;
    padding: 0 15px 5px;
    box-sizing: border-box;
    :deep(.van-cell) {
      padding-left: 0;
      padding-right: 0;
    }
    :deep(.van-cell__title) {
      font-weight: 600;
    }
  }

  &-bottom {
    box-sizing: border-box;
    display: flex;
    width: 100%;
    padding: 5px 5px calc(env(safe-area-inset-bottom) + 5px) 5px;
    position: fixed;
    background-color: #fff;
    z-index: 3;
    bottom: 0;
    left: 0;
    gap: 5px;
  }

  :deep(.van-collapse-item__content) {
    padding: 0;
  }
}

.wf-form-group__icon {
  margin-right: 5px;
}
</style>
