<template>
  <div class="dc-weight comp-dc-weght" :class="{ 'is-disabled': disabled }">
    <div class="input-wrapper">
      <!-- 用 van-field 展示/编辑重量（默认只读，可被父级 readonly 覆盖） -->
      <van-field v-model="valueProxy" v-bind="fieldBind" />
      <div class="btn-done" @click="handleInputClick">取称重</div>
    </div>

    <van-popup
      v-model:show="visible"
      position="bottom"
      round
      :style="{ height: '90%' }"
      safe-area-inset-bottom
    >
      <div class="device-list">
        <van-radio-group v-model="selectedValue">
          <van-cell-group inset>
            <van-cell
              v-for="opt in options"
              :key="opt.value"
              clickable
              @click="selectedValue = opt.value"
            >
              <template #title>
                <div class="device-title">{{ opt.label }}</div>
                <div class="info">
                  <div class="weight">{{ weightInfo[opt.value]?.weight ?? '-' }}</div>
                  <div class="unit">{{ weightInfo[opt.value]?.unit ?? '-' }}</div>
                </div>
              </template>
              <template #right-icon>
                <van-radio :name="opt.value" />
              </template>
            </van-cell>
          </van-cell-group>
        </van-radio-group>
      </div>

      <div class="popup-actions">
        <van-button block round type="default" @click="handleCancel">取消</van-button>
        <van-button block round type="primary" class="ok" @click="handleConfirm">确定</van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, useAttrs } from 'vue';
import { io } from 'socket.io-client';

const props = defineProps({
  disabled: { type: Boolean, default: false },
  modelValue: { type: [String, Number], default: '' },
  placeholder: { type: String, default: '' },
  socketNs: { type: String, default: '/weight' },
});
const emit = defineEmits(['update:modelValue', 'change']);

/**
 * 让 van-field 用 v-model 直接读写父级的 modelValue
 * - 手动编辑或 formatter 格式化后，都会通过这里同步给父层
 */
const valueProxy = computed({
  get: () => (props.modelValue ?? '') + '',
  set: (v) => {
    emit('update:modelValue', v);
    emit('change', v);
  },
});

/**
 * 透传父级写在 <dc-weight ... v-bind="filterFieldProps(item)"> 的 field 类属性
 * 并设置只读默认值为 true（若父层显式传 readonly=false，则允许手动输入）
 */
const attrs = useAttrs();
const fieldBind = computed(() => {
  return {
    // 来自父层：label / name / type / placeholder / formatter / format-trigger / clearable / maxlength ...
    ...attrs,
    placeholder: attrs.placeholder ?? props.placeholder,
    // 默认只读（你之前是只读展示 + 按钮取值）
    readonly: attrs.readonly,
    // 保证是 number 类型输入（父层也可覆盖 type）
    type: attrs.type ?? 'number',
    // 统一 value（van-field 用 v-model 绑定）
  };
});

const visible = ref(false);
const selectedValue = ref(''); // '01' | '02'
const socketRef = ref(null);
const weightInfo = ref({
  '01': {}, // 地磅
  '02': {}, // 台秤
});
const options = ref([
  { label: '地磅', value: '01' },
  { label: '台秤', value: '02' },
]);

const initWebsocket = () => {
  socketRef.value = io(props.socketNs, { transports: ['websocket'] });
  socketRef.value.on('connect', () => {
    socketRef.value.emit('message', 'front connected');
  });
  socketRef.value.on('weightChange', (data) => {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      if (parsed?.eqId) {
        weightInfo.value[parsed.eqId] = parsed;
      }
    } catch (e) {
      console.warn('weightChange parse error:', e);
    }
  });
};
onMounted(initWebsocket);
onBeforeUnmount(() => {
  if (socketRef.value) {
    socketRef.value.disconnect();
    socketRef.value = null;
  }
});

const handleInputClick = () => {
  if (props.disabled) return;
  visible.value = true;
  if (!selectedValue.value && options.value.length) {
    selectedValue.value = options.value[0].value;
  }
};
const handleCancel = () => (visible.value = false);
const handleConfirm = () => {
  const val = weightInfo.value[selectedValue.value]?.weight;
  visible.value = false;
  // 回填给 van-field（进而触发父层的 v-model/update:modelValue）
  valueProxy.value = val ?? '';
};
</script>

<style lang="scss" scoped>
.dc-weight {
  position: relative;
  width: 100%;
  min-height: 40px;

  .input-wrapper {
    display: flex;
    align-items: center;
    min-height: 40px;
    gap: 8px;
  }

  .btn-done {
    display: inline-block;
    width: 72px;
    height: 32px;
    line-height: 32px;
    text-align: center;
    border-radius: 6px;
    color: #3060ed;
    background: rgba(48, 96, 237, 0.08);
    user-select: none;
  }

  &.is-disabled {
    width: calc(100% - 8px);
    background-color: rgba(0, 0, 0, 0.05);
    pointer-events: none;
    opacity: 0.6;
  }

  .device-title {
    font-weight: 600;
    margin-bottom: 2px;
  }

  .info {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-top: 2px;

    .weight {
      font-size: 18px;
      font-weight: 600;
    }
    .unit {
      opacity: 0.7;
      font-size: 12px;
    }
  }

  .popup-actions {
    padding: 12px 16px max(env(safe-area-inset-bottom), 12px);

    .ok {
      margin-top: 10px;
    }
  }
}
</style>
