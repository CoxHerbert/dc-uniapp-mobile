<template>
  <div class="dc-selector" :class="{ 'is-disabled': isDisabled }">
    <van-field
      :label="fieldLabel"
      readonly
      clickable
      is-link
      :model-value="!isMultiple ? singleLabel : undefined"
      :placeholder="!isMultiple ? placeholderText : undefined"
      :disabled="isDisabled"
      class="dc-selector__field"
      @click="openPopup"
    >
      <template v-if="isMultiple" #input>
        <div class="dc-selector__input" :class="{ 'has-value': selectedTags.length }">
          <template v-if="selectedTags.length">
            <div class="dc-selector__tags">
              <van-tag
                v-for="tag in visibleTags"
                :key="tag.valueKey"
                type="primary"
                size="medium"
                :closeable="canClearTags"
                @close.stop="removeValue(tag.value)"
              >
                {{ tag.label }}
              </van-tag>
              <span v-if="extraTagCount > 0" class="dc-selector__more">+{{ extraTagCount }}</span>
            </div>
          </template>
          <span v-else class="dc-selector__placeholder">{{ placeholderText }}</span>
        </div>
      </template>
      <template #right-icon>
        <van-icon
          v-if="canClear && hasValue"
          name="cross"
          class="dc-selector__clear"
          @click.stop="clearSelection"
        />
      </template>
    </van-field>

    <van-popup v-model:show="popupOpen" position="bottom" round teleport="body">
      <div class="dc-selector__popup">
        <div class="dc-selector__popup-header">
          <span class="dc-selector__title">{{ popupTitle }}</span>
          <van-icon name="cross" class="dc-selector__close" @click="closePopup" />
        </div>
        <div class="dc-selector__popup-body" :class="{ 'is-loading': loading }">
          <div v-if="loading" class="dc-selector__loading">
            <van-loading size="24px">加载中...</van-loading>
          </div>
          <template v-else>
            <div v-if="options.length" class="dc-selector__search">
              <van-search
                v-model="searchKeyword"
                placeholder="请输入关键词搜索"
                background="transparent"
                clearable
              />
            </div>
            <van-empty v-if="!filteredOptions.length" description="暂无数据" />
            <template v-else>
              <van-radio-group v-if="!isMultiple" v-model="singleDraft">
                <van-cell-group>
                  <van-cell
                    v-for="option in filteredOptions"
                    :key="option.key"
                    clickable
                    :title="option.label"
                    @click="selectSingle(option.value)"
                  >
                    <template #right-icon>
                      <van-radio :name="option.value" />
                    </template>
                  </van-cell>
                </van-cell-group>
              </van-radio-group>
              <van-checkbox-group v-else v-model="multipleDraft">
                <van-cell-group>
                  <van-cell
                    v-for="option in filteredOptions"
                    :key="option.key"
                    clickable
                    :title="option.label"
                    @click="toggleMultiple(option.value)"
                  >
                    <template #right-icon>
                      <van-checkbox :name="option.value" @click.stop />
                    </template>
                  </van-cell>
                </van-cell-group>
              </van-checkbox-group>
            </template>
          </template>
        </div>
        <div class="dc-selector__popup-footer">
          <van-button size="small" type="default" plain @click="closePopup">取消</van-button>
          <van-button size="small" type="primary" @click="confirmSelection">确定</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { computed, ref, watch, unref } from 'vue';

defineOptions({ name: 'DcSelector' });

// 多选字符串格式默认使用英文逗号分隔
const MULTI_VALUE_SEPARATOR = ',';

/**
 * DcSelector Props 说明
 * - modelValue  支持单值或数组，双向绑定
 * - multiple    是否多选，未传时读取 field.multiple / field.props.multiple
 * - options     选项数组（或 ref），需由父组件提前获取并传入
 * - loading     控制弹层加载态，未传时回退到 field.props.loading
 * - columnsFieldNames 自定义字典项字段映射，默认 { text: 'text', value: 'value' }
 * - maxTagCount 多选模式下展示的标签数量，超出后折叠显示 +N
 * - field.props.valueType / returnType 控制多选返回数组或逗号分隔字符串
 *  其余展示相关入参（label、placeholder、title 等）同 Vant Field 行为
 */
const props = defineProps({
  modelValue: { type: [String, Number, Array, Object, Boolean], default: null },
  label: { type: String, default: '' },
  field: { type: Object, default: () => ({}) },
  placeholder: { type: String, default: '' },
  title: { type: String, default: '' },
  multiple: { type: Boolean, default: null },
  options: { type: [Array, Object], default: undefined },
  loading: { type: Boolean, default: undefined },
  clearable: { type: Boolean, default: undefined },
  disabled: { type: Boolean, default: undefined },
  columnsFieldNames: {
    type: Object,
    default: () => ({ text: 'text', value: 'value' }),
  },
  maxTagCount: { type: [Number, String], default: undefined },
});

const emit = defineEmits(['update:modelValue', 'change']);

const popupOpen = ref(false);
const singleDraft = ref(null);
const multipleDraft = ref([]);

const fieldProps = computed(() =>
  props.field && typeof props.field === 'object' ? props.field : {}
);
const fieldLabel = computed(() => props.label || fieldProps.value?.label || '');

const effectiveFieldNames = computed(() => {
  const normalize = (value) => (value && typeof value === 'object' ? value : {});
  const fromProps = normalize(props.columnsFieldNames);
  const fromField = normalize(fieldProps.value?.columnsFieldNames);
  const fromFieldProps = normalize(fieldProps.value?.props?.columnsFieldNames);
  return {
    text: fromProps.text ?? fromField.text ?? fromFieldProps.text ?? 'text',
    value: fromProps.value ?? fromField.value ?? fromFieldProps.value ?? 'value',
  };
});
const effectivePlaceholder = computed(() => {
  if (props.placeholder) return props.placeholder;
  if (fieldProps.value?.props?.placeholder) return fieldProps.value.props.placeholder;
  if (fieldLabel.value) return `请选择${fieldLabel.value}`;
  return '请选择';
});
const effectiveTitle = computed(() => {
  if (props.title) return props.title;
  if (fieldProps.value?.props?.title) return fieldProps.value.props.title;
  if (fieldLabel.value) return `选择${fieldLabel.value}`;
  return '请选择';
});
const effectiveMaxTagCount = computed(() => {
  const source = props.maxTagCount ?? fieldProps.value?.props?.maxTagCount;
  if (source === undefined || source === null || source === '') return 3;
  const num = Number(source);
  return Number.isNaN(num) ? 3 : num;
});

const isDisabled = computed(() => {
  if (props.disabled !== undefined && props.disabled !== null) return !!props.disabled;
  const fp = fieldProps.value?.props;
  if (fp && Object.prototype.hasOwnProperty.call(fp, 'disabled')) return !!fp.disabled;
  return false;
});

const isMultiple = computed(() => {
  if (props.multiple !== null) return !!props.multiple;
  if (fieldProps.value && Object.prototype.hasOwnProperty.call(fieldProps.value, 'multiple')) {
    return !!fieldProps.value.multiple;
  }
  if (
    fieldProps.value?.props &&
    Object.prototype.hasOwnProperty.call(fieldProps.value.props, 'multiple')
  ) {
    return !!fieldProps.value.props.multiple;
  }
  return false;
});

const canClear = computed(() => {
  if (props.clearable !== undefined) return !!props.clearable;
  const fp = fieldProps.value?.props;
  if (fp && Object.prototype.hasOwnProperty.call(fp, 'clearable')) return !!fp.clearable;
  return true;
});

const canClearTags = computed(() => canClear.value && !isDisabled.value);

const placeholderText = computed(() => effectivePlaceholder.value);
const popupTitle = computed(() => effectiveTitle.value || '请选择');
const loading = computed(() => {
  if (props.loading !== undefined && props.loading !== null) return !!props.loading;
  const fp = fieldProps.value;
  if (fp && Object.prototype.hasOwnProperty.call(fp, 'loading')) return !!fp.loading;
  if (fp?.props && Object.prototype.hasOwnProperty.call(fp.props, 'loading'))
    return !!fp.props.loading;
  return false;
});
const multipleValueMode = computed(() => {
  if (!isMultiple.value) return 'single';
  const fp = fieldProps.value;
  const candidate =
    fp?.valueType || fp?.returnType || fp?.props?.valueType || fp?.props?.returnType || null;
  if (candidate === 'string' || candidate === 'join') return 'string';
  if (candidate === 'array') return 'array';
  if (Array.isArray(props.modelValue)) return 'array';
  if (typeof props.modelValue === 'string') return 'string';
  return 'array';
});

const optionsSource = computed(() => {
  const resolve = (source) => {
    if (!source) return [];
    const unwrapped = unref(source);
    return Array.isArray(unwrapped) ? unwrapped : [];
  };

  const fromProps = resolve(props.options);
  if (fromProps.length) return fromProps;

  // 兼容旧用法：允许在 field / field.props 上传入 options
  const fromField = resolve(fieldProps.value?.options);
  if (fromField.length) return fromField;

  const fromFieldProps = resolve(fieldProps.value?.props?.options);
  if (fromFieldProps.length) return fromFieldProps;

  return [];
});

const options = computed(() => {
  const arr = Array.isArray(optionsSource.value) ? optionsSource.value : [];
  const fieldNames = effectiveFieldNames.value;
  return arr.map((item, index) => {
    const label = pickOptionValue(item, [fieldNames.text, 'text', 'label']);
    const value = pickOptionValue(item, [fieldNames.value, 'value']);
    const id = item?.id ?? item?.value ?? item?.dictKey ?? index;
    return {
      key: id,
      label,
      value,
      raw: item,
    };
  });
});

const searchKeyword = ref('');

const filteredOptions = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  if (!keyword) return options.value;
  return options.value.filter((option) => {
    const labelText =
      option.label === null || option.label === undefined ? '' : String(option.label);
    const valueText =
      option.value === null || option.value === undefined ? '' : String(option.value);
    return labelText.toLowerCase().includes(keyword) || valueText.toLowerCase().includes(keyword);
  });
});

const optionMap = computed(() => {
  const map = new Map();
  options.value.forEach((opt) => {
    map.set(String(opt.value), opt);
  });
  return map;
});

const hasValue = computed(() => {
  if (isMultiple.value) {
    return Array.isArray(props.modelValue) ? props.modelValue.length > 0 : !!props.modelValue;
  }
  return props.modelValue !== null && props.modelValue !== undefined && props.modelValue !== '';
});

const singleLabel = computed(() => {
  if (isMultiple.value) return '';
  const opt = optionMap.value.get(String(props.modelValue));
  if (opt) return opt.label ?? '';
  if (props.modelValue === null || props.modelValue === undefined) return '';
  return String(props.modelValue);
});

const selectedValues = computed(() => {
  if (!isMultiple.value) return [];
  const value = props.modelValue;
  if (Array.isArray(value)) return value.filter((v) => v !== undefined && v !== null);
  if (value === undefined || value === null || value === '') return [];
  if (typeof value === 'string') {
    return value
      .split(MULTI_VALUE_SEPARATOR)
      .map((s) => s.trim())
      .filter((s) => s !== '');
  }
  return [value];
});

const selectedTags = computed(() =>
  selectedValues.value.map((val, idx) => {
    const opt = optionMap.value.get(String(val));
    const label = opt?.label ?? (val === null || val === undefined ? '' : String(val));
    return { label, value: val, valueKey: `${String(val)}-${idx}` };
  })
);

const visibleTags = computed(() => {
  const limit = effectiveMaxTagCount.value;
  if (!limit || limit <= 0) return selectedTags.value;
  return selectedTags.value.slice(0, limit);
});

const extraTagCount = computed(() => {
  const limit = effectiveMaxTagCount.value;
  if (!limit || limit <= 0) return 0;
  const diff = selectedTags.value.length - visibleTags.value.length;
  return diff > 0 ? diff : 0;
});

watch(
  () => popupOpen.value,
  (open) => {
    if (open) {
      searchKeyword.value = '';
      if (isMultiple.value) {
        multipleDraft.value = [...selectedValues.value];
      } else {
        singleDraft.value = props.modelValue ?? null;
      }
    }
  }
);

watch(
  () => props.modelValue,
  (value) => {
    if (popupOpen.value) {
      if (isMultiple.value) {
        multipleDraft.value = [...selectedValues.value];
      } else {
        singleDraft.value = value ?? null;
      }
    }
  }
);

function pickOptionValue(option, keys = []) {
  if (!option) return '';
  const list = Array.isArray(keys) ? keys : [keys];
  for (const key of list) {
    if (!key) continue;
    if (option[key] !== undefined) return option[key];
    if (option.raw && option.raw[key] !== undefined) return option.raw[key];
  }
  return '';
}

function openPopup() {
  if (isDisabled.value) return;
  popupOpen.value = true;
}

function closePopup() {
  popupOpen.value = false;
}

function emitChange(value) {
  if (isMultiple.value) {
    const arr = Array.isArray(value)
      ? value.filter((item) => item !== undefined && item !== null)
      : [];
    const formatted = multipleValueMode.value === 'string' ? arr.join(MULTI_VALUE_SEPARATOR) : arr;
    emit('update:modelValue', formatted);
    emit('change', formatted);
    return;
  }
  emit('update:modelValue', value);
  emit('change', value);
}

function clearSelection() {
  if (isDisabled.value) return;
  if (isMultiple.value) {
    emitChange([]);
  } else {
    emitChange(null);
  }
}

function removeValue(value) {
  if (!isMultiple.value) return;
  const filtered = selectedValues.value.filter((item) => !isSame(item, value));
  emitChange(filtered);
}

function selectSingle(value) {
  singleDraft.value = value;
  emitChange(value);
  closePopup();
}

function toggleMultiple(value) {
  const arr = [...multipleDraft.value];
  const idx = arr.findIndex((item) => isSame(item, value));
  if (idx >= 0) {
    arr.splice(idx, 1);
  } else {
    arr.push(value);
  }
  multipleDraft.value = arr;
}

function confirmSelection() {
  if (isMultiple.value) {
    emitChange([...multipleDraft.value]);
  } else {
    emitChange(singleDraft.value ?? null);
  }
  closePopup();
}

function isSame(a, b) {
  return String(a) === String(b);
}
</script>

<style lang="scss" scoped>
.dc-selector {
  &__field {
    :deep(.van-field__control) {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
    }
  }

  &__input {
    display: flex;
    align-items: center;
    min-height: 24px;
  }

  &__placeholder {
    color: #c8c9cc;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__more {
    font-size: 12px;
    color: #666;
  }

  &__clear {
    font-size: 16px;
    color: #c8c9cc;
  }

  &__popup {
    display: flex;
    flex-direction: column;
    height: 70vh;
  }

  &__popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid #f5f5f5;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
  }

  &__close {
    font-size: 18px;
    color: #969799;
  }

  &__popup-body {
    flex: 1;
    overflow: auto;
  }

  &__search {
    padding: 8px 16px 0;
  }

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  &__popup-footer {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 16px;
    border-top: 1px solid #f5f5f5;
  }

  &__popup-footer .van-button {
    flex: 1;
  }

  &.is-disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}
</style>
