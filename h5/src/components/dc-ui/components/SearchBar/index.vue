<template>
  <div class="dc-search-panel" :class="{ 'dc-search-panel--inline': inline }">
    <van-search
      v-model="innerValue"
      class="dc-search-panel__input"
      :placeholder="placeholder"
      :shape="shape"
      :background="background"
      :clearable="clearable"
      :maxlength="maxlength"
      :disabled="disabled"
      :show-action="false"
      @search="triggerSearch"
      @clear="handleClear"
    />
    <div class="dc-search-panel__actions">
      <van-button
        class="dc-search-panel__search-btn"
        :type="buttonType"
        :size="buttonSize"
        :plain="buttonPlain"
        :round="round"
        :disabled="buttonDisabled"
        @click="triggerSearch"
      >
        <slot name="search-icon">
          <van-icon name="search" size="16" />
        </slot>
        {{ buttonText }}
      </van-button>
      <slot v-if="showScan" name="scan">
        <dc-scan-code v-model="innerValue" @confirm="handleScanConfirm" @error="handleScanError">
          <template #default="{ open, disabled: scanDisabled, loading }">
            <van-button
              class="dc-search-panel__scan-btn"
              icon="scan"
              :type="scanButtonType"
              :plain="scanButtonPlain"
              :round="round"
              :size="buttonSize"
              :loading="loading"
              :disabled="scanDisabled"
              @click="open"
            />
          </template>
        </dc-scan-code>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { showFailToast } from 'vant';

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  placeholder: { type: String, default: '请输入关键词' },
  buttonText: { type: String, default: '查询' },
  buttonType: { type: String, default: 'primary' },
  buttonPlain: { type: Boolean, default: false },
  buttonDisabled: { type: Boolean, default: false },
  buttonSize: { type: String, default: 'small' },
  showScan: { type: Boolean, default: true },
  scanButtonType: { type: String, default: 'primary' },
  scanButtonPlain: { type: Boolean, default: true },
  shape: { type: String, default: 'round' },
  background: { type: String, default: '#fff' },
  clearable: { type: Boolean, default: true },
  maxlength: { type: [Number, String], default: null },
  disabled: { type: Boolean, default: false },
  round: { type: Boolean, default: true },
  inline: { type: Boolean, default: false },
  triggerOnClear: { type: Boolean, default: true },
  showScanErrorToast: { type: Boolean, default: true },
  scanErrorText: { type: String, default: '扫码失败' },
});

const emit = defineEmits(['update:modelValue', 'search', 'clear', 'scan-success', 'scan-error']);

const innerValue = ref(String(props.modelValue ?? ''));

watch(
  () => props.modelValue,
  (val) => {
    const next = val ?? '';
    if (next !== innerValue.value) {
      innerValue.value = String(next);
    }
  }
);

watch(
  innerValue,
  (val) => {
    emit('update:modelValue', val);
  }
);

const updateValue = (val) => {
  const next = val ?? '';
  innerValue.value = String(next);
};

const triggerSearch = () => {
  const value = innerValue.value?.toString?.().trim?.() ?? '';
  emit('search', value);
};

const handleClear = () => {
  emit('clear');
  if (props.triggerOnClear) {
    triggerSearch();
  }
};

const handleScanConfirm = (code) => {
  if (code === undefined || code === null) return;
  const value = code.toString();
  updateValue(value);
  emit('scan-success', value);
  triggerSearch();
};

const handleScanError = (error) => {
  emit('scan-error', error);
  const message = error?.message || '';
  if (message.includes('取消') || message.toLowerCase().includes('cancel')) return;
  if (props.showScanErrorToast) {
    showFailToast(message || props.scanErrorText);
  }
};
</script>

<style scoped>
.dc-search-panel {
  display: flex;
  width: 100%;
  gap: 8px;
  align-items: center;
  box-sizing: border-box;
}

.dc-search-panel__input {
  flex: 1;
  padding: 0;
}

.dc-search-panel__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dc-search-panel__search-btn,
.dc-search-panel__scan-btn {
  height: 36px;
  padding: 0 14px;
}

.dc-search-panel__scan-btn {
  width: 42px;
  padding: 0;
}

:deep(.van-search__content) {
  min-height: 36px;
  border-radius: 999px;
}

:deep(.van-field__control) {
  font-size: 14px;
}
</style>
