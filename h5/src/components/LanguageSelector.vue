<template>
  <div>
    <van-cell-group
      v-if="isCellVariant"
      :inset="inset"
      :class="cellGroupClass"
    >
      <van-cell
        :title="titleText"
        :value="currentLabel"
        is-link
        @click="openSheet"
      />
    </van-cell-group>

    <button
      v-else
      type="button"
      :class="['language-trigger', triggerClass]"
      @click="openSheet"
    >
      <span class="language-trigger__label">{{ currentLabel }}</span>
      <van-icon class="language-trigger__icon" name="arrow-down" />
    </button>

    <van-action-sheet
      v-model:show="showSheet"
      :title="titleText"
      :actions="actions"
      :cancel-text="cancelButtonText"
      close-on-click-action
      @cancel="closeSheet"
      @select="onSelect"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { changeLocale } from '@/locales';

const LANGUAGE_OPTIONS = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' },
  { value: 'vi-VN', label: 'Tiếng Việt' },
];

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  variant: {
    type: String,
    default: 'cell',
    validator: (value) => ['cell', 'compact'].includes(value),
  },
  inset: {
    type: Boolean,
    default: true,
  },
  cellGroupClass: {
    type: [String, Array, Object],
    default: () => 'mt12',
  },
  triggerClass: {
    type: [String, Array, Object],
    default: () => [],
  },
  title: {
    type: String,
    default: '',
  },
  cancelText: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue', 'change']);

const { t, locale } = useI18n();

const showSheet = ref(false);

const selectedLocale = ref(props.modelValue || locale.value);

const titleText = computed(() => props.title || t('me.language.title'));
const cancelButtonText = computed(() => props.cancelText || t('me.form.cancel'));

const optionMap = computed(() =>
  LANGUAGE_OPTIONS.reduce((acc, option) => {
    acc[option.value] = option.label;
    return acc;
  }, {})
);

const currentLabel = computed(() => optionMap.value[selectedLocale.value] || '-');
const isCellVariant = computed(() => props.variant === 'cell');

const actions = computed(() =>
  LANGUAGE_OPTIONS.map((option) => ({
    name: option.label,
    value: option.value,
    color: selectedLocale.value === option.value ? '#3060ed' : undefined,
  }))
);

watch(
  () => props.modelValue,
  (val) => {
    if (val && val !== selectedLocale.value) {
      selectedLocale.value = val;
    }
  }
);

watch(locale, (val) => {
  if (val && val !== selectedLocale.value) {
    selectedLocale.value = val;
  }
});

watch(
  selectedLocale,
  (val, oldVal) => {
    if (!val || val === oldVal) return;
    emit('update:modelValue', val);
    emit('change', val);
    if (val !== locale.value) {
      changeLocale(val);
    }
  },
  { flush: 'sync' }
);

function openSheet() {
  showSheet.value = true;
}

function closeSheet() {
  showSheet.value = false;
}

function onSelect(action) {
  if (action?.value) {
    selectedLocale.value = action.value;
  }
  closeSheet();
}
</script>

<style scoped>
.language-trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  font-size: 14px;
  color: #1f2a44;
  background: rgba(255, 255, 255, 0.65);
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.language-trigger:active,
.language-trigger:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.85);
}

.language-trigger__icon {
  font-size: 12px;
}
</style>
