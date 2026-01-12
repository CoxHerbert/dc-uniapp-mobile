<template>
  <div class="wf-select">
    <van-field
      v-model="textLabel"
      is-link
      readonly
      :placeholder="getPlaceholder(column, column.type)"
      :disabled="disabled"
      @click="onClick"
    />

    <van-popup v-model:show="show" position="bottom" round>
      <!-- 多选 -->
      <template v-if="isMultiple">
        <div class="wf-select__toolbar">
          <span class="wf-select__btn wf-select__btn--cancel" @click="handleCancel">取消</span>
          <span class="wf-select__title">{{ column.label }}</span>
          <span class="wf-select__btn wf-select__btn--confirm" @click="handleConfirmMulti">
            确认
          </span>
        </div>

        <div class="wf-select__body">
          <van-checkbox-group v-model="tempSelected">
            <van-cell-group inset>
              <van-cell
                v-for="opt in pickerColumns"
                :key="String(opt.value)"
                clickable
                @click="toggleValue(opt.value, $event)"
              >
                <template #title>
                  {{ opt.text }}
                </template>
                <template #right-icon>
                  <van-checkbox :name="opt.value" />
                </template>
              </van-cell>
            </van-cell-group>
          </van-checkbox-group>
        </div>
      </template>

      <!-- 单选 -->
      <template v-else>
        <van-picker
          :columns="pickerColumns"
          show-toolbar
          :title="column.label"
          @confirm="handleSubmit"
          @cancel="handleCancel"
        />
      </template>
    </van-popup>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { Field, Picker, Popup, Checkbox, CheckboxGroup, Cell, CellGroup } from 'vant';
import Props from '../../mixins/props.js';

export default defineComponent({
  name: 'WfSelect',
  components: {
    [Field.name]: Field,
    [Picker.name]: Picker,
    [Popup.name]: Popup,
    [Checkbox.name]: Checkbox,
    [CheckboxGroup.name]: CheckboxGroup,
    [Cell.name]: Cell,
    [CellGroup.name]: CellGroup,
  },
  mixins: [Props],
  props: {
    // 额外提供开关，避免只能靠 column
    multiple: { type: Boolean, default: false },
    // 多选值为 string 时的分隔符
    valueSeparator: { type: String, default: ',' },
    // 多选 label 展示分隔符
    labelSeparator: { type: String, default: ', ' },
    // ✅ 你如果希望“确认后仍存字符串”，可打开这个
    // storeAsString: { type: Boolean, default: false },
  },
  data() {
    return {
      show: false,
      tempSelected: [],
      textLabel: null,
    };
  },
  computed: {
    isMultiple() {
      return !!(this.multiple || this.column?.multiple);
    },
    pickerColumns() {
      return (this.dic || []).map((item) => ({
        text: item[this.labelKey],
        value: item[this.valueKey],
        raw: item,
      }));
    },
  },
  watch: {
    dic: {
      handler(val) {
        if (!this.validateNull(val)) {
          this.initTextLabel();
        }
      },
      deep: true,
      immediate: true,
    },
    // ✅ 关键：外部值变化也能回显
    text: {
      handler() {
        this.initTextLabel();
      },
      deep: true,
      immediate: true,
    },
  },
  mounted() {
    this.initTextLabel();
  },
  methods: {
    onClick() {
      if (!this.disabled) {
        this.show = true;

        // ✅ 打开弹层时同步临时选中（用于回显勾选状态）
        if (this.isMultiple) {
          this.tempSelected = this.normalizeToArray(this.text);
        }
      }
      this.handleClick();
    },

    handleCancel() {
      this.show = false;
    },

    // ✅ 多选回显核心：统一转数组
    normalizeToArray(val) {
      if (Array.isArray(val)) {
        return val.filter((v) => v !== undefined && v !== null && v !== '');
      }
      if (val === undefined || val === null || val === '') return [];

      if (typeof val === 'string') {
        return val
          .split(this.valueSeparator)
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return [val];
    },

    // ✅ 覆盖/增强回显逻辑
    initTextLabel() {
      const dic = this.dic || [];

      if (this.isMultiple) {
        const values = this.normalizeToArray(this.text);

        const labels = dic
          .filter((item) => values.includes(item[this.valueKey]))
          .map((item) => item[this.labelKey]);

        this.textLabel = labels.join(this.labelSeparator);
        return;
      }

      const rawOption = dic.find((item) => item[this.valueKey] === this.text);
      this.textLabel = rawOption ? rawOption[this.labelKey] : '';
    },

    // -------- 单选提交（保留你原来的兼容方式）--------
    handleSubmit(payload) {
      const selectedValues = Array.isArray(payload?.selectedValues)
        ? payload.selectedValues
        : Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.value)
            ? payload.value
            : [payload?.value ?? payload?.selectedValue ?? payload];

      const [selected] = selectedValues;
      const rawOption = (this.dic || []).find((item) => item[this.valueKey] === selected);
      const label = rawOption ? rawOption[this.labelKey] : '';

      this.text = selected;
      this.textLabel = label;
      this.$emit('label-change', label);
      this.show = false;
      this.handleChange(this.text);
    },

    // -------- 多选交互 --------
    toggleValue(value, event) {
      if (event && event.target.closest('.van-checkbox')) {
        return;
      }
      const list = [...this.tempSelected];
      const idx = list.findIndex((v) => v === value);

      if (idx >= 0) list.splice(idx, 1);
      else list.push(value);

      this.tempSelected = list;
    },

    handleConfirmMulti() {
      const selected = this.normalizeToArray(this.tempSelected);

      const raws = (this.dic || []).filter((item) => selected.includes(item[this.valueKey]));
      const labels = raws.map((item) => item[this.labelKey]);

      // ✅ 默认更推荐：存数组，回显最稳
      this.text = selected;

      // ✅ 如果你必须存 "1,2,3" 这种字符串
      // this.text = selected.join(this.valueSeparator);

      this.textLabel = labels.join(this.labelSeparator);
      this.$emit('label-change', this.textLabel);

      this.show = false;
      this.handleChange(this.text);
    },
  },
});
</script>

<style lang="scss" scoped>
.wf-select {
  width: 100%;
}

.wf-select__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid #f2f3f5;
  font-size: 14px;
}

.wf-select__title {
  font-weight: 600;
}

.wf-select__btn {
  padding: 4px 6px;
  user-select: none;
}

.wf-select__btn--cancel {
  color: #969799;
}

.wf-select__btn--confirm {
  color: #1989fa;
}

.wf-select__body {
  max-height: 55vh;
  overflow: auto;
  padding: 8px 0 14px;
}
</style>
