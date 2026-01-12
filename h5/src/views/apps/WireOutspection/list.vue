<template>
  <div class="page wire-inspection-submit">
    <van-nav-bar title="线材质检出库" left-arrow @click-left="goBack" />

    <div class="wire-inspection-submit__body">
      <van-form ref="formRef" :model="form" scroll-to-error>
        <van-cell-group inset class="section">
          <van-field
            v-model="form.locatorNo"
            name="locatorNo"
            label="库位编码"
            disabled="true"
            required="true"
            placeholder="请输入库位编码"
            :rules="[{ required: true, message: '请输入库位编码' }]"
          >
            <template #button>
              <dc-scan-code
                v-model="form.locatorNo"
                @confirm="handleLocatorScanSuccess"
                @error="handleScanError"
              >
                <template #default="{ open, disabled, loading }">
                  <van-button
                    size="small"
                    type="primary"
                    :loading="loading"
                    :disabled="disabled"
                    @click="open"
                  >
                    扫码
                  </van-button>
                </template>
              </dc-scan-code>
            </template>
          </van-field>
          <dc-selector
            v-model="form.outType"
            label="出库类型"
            :options="outTypeOptions"
            :disabled="isDisabled"
            placeholder="请选择出库类型"
            @change="handleOutTypeChange"
          />
        </van-cell-group>
      </van-form>
      <div class="wire-inspection-submit__footer">
        <van-button block type="success" @click="handleSubmit">下一步</van-button>
      </div>
    </div>

    <van-popup v-model:show="picker.show" position="bottom" round>
      <van-picker
        :columns="picker.columns"
        @confirm="onPickerConfirm"
        @cancel="picker.show = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { computed, getCurrentInstance, reactive, ref, unref } from 'vue';
import { useRouter } from 'vue-router';
import { showConfirmDialog, showToast } from 'vant';
import ProductList from './components/ProductList.vue';
import { useDictStore } from '@/store/dict';
import Api from '@/api';
import { goBackOrHome } from '@/utils/navigation';

defineOptions({ name: 'WireInspectionSubmit' });

const { proxy } = getCurrentInstance();
const router = useRouter();
const dictStore = useDictStore();

const formRef = ref(null);
const rowScanCode = ref('');
const isDisabled = ref(true);
let uid = 0;

const form = reactive({
  locatorNo: '',
  outType: 'DC_WMS_OUT_TYPE_BOM',

  data: [],
});

const dictRefs = proxy?.dicts ? proxy.dicts(['QualifiedEnum', 'DC_WIRE_EXCEPTION_TYPE']) : {};

const outTypeOptions = ref([]);

async function initOutTypeDict() {
  try {
    const list = await dictStore.get('DC_WMS_OUT_TYPE_WMS');
    outTypeOptions.value = Array.isArray(list)
      ? list.map((item) => {
          const text = item?.label ?? item?.text ?? item?.raw?.dictLabel ?? '';
          const value = item?.value ?? item?.dictValue ?? item?.raw?.dictValue ?? '';
          return {
            text,
            label: text,
            value,
            raw: item?.raw ?? item,
          };
        })
      : [];
    syncOutTypeName();
  } catch (error) {
    console.error('failed to load out stock dict', error);
  }
}

initOutTypeDict();

function syncOutTypeName(value = form.outType) {
  const target = value != null ? String(value) : '';
  if (!target) {
    form.outStockTypeName = '';
    return;
  }
  const option = outTypeOptions.value.find((item) => String(item?.value ?? '') === target);
  form.outStockTypeName = option?.text ?? option?.label ?? '';
}
function handleOutTypeChange(value) {
  syncOutTypeName(value);
}

const picker = reactive({
  show: false,
  rowIndex: null,
  columns: [],
});

function goBack() {
  goBackOrHome(router);
}

function onPickerConfirm({ selectedOptions, selectedValues }) {
  const option = selectedOptions?.[0] || selectedOptions || {};
  const value = (selectedValues && selectedValues[0]) ?? option?.value;
  if (picker.rowIndex !== null && form.data[picker.rowIndex]) {
    form.data[picker.rowIndex].execeptionType = value ?? '';
  }
  picker.show = false;
}

function isCancelError(err) {
  const message = err?.message || '';
  return message.includes('取消') || message.toLowerCase().includes('cancel');
}

function handleScanError(err) {
  if (isCancelError(err)) return;
  showToast({ message: err?.message || '扫码失败', type: 'fail' });
}

async function handleLocatorScanSuccess(code) {
  if (!code) return;
  // 查询库位信息
  try {
    const res = await Api.application.wireInspection.searchByQrcode({ qrcode: code });
    const payload = res?.data || {};
    const { code: status, data, msg } = payload;
    if (status !== 200 || !data) throw new Error(msg || '未获取到库位信息');
    form.warehouseId = data?.warehouseId || '';
    form.locatorNo = code;
    form.warehouseLocationId = data?.id || '';
  } catch (err) {
    handleScanError(err);
  }
}

async function handleSubmit() {
  try {
    await formRef.value?.validate();
  } catch (_err) {
    showToast({ type: 'fail', message: '请完善必填信息' });
    return;
  }
  router.push({
    name: 'appsWireOutspection',
    query: {
      warehouseId: form.warehouseId,
      warehouseLocationId: form.warehouseLocationId,
      locatorNo: form.locatorNo,
      outType: form.outType,
    },
  });
}
</script>

<style scoped>
.wire-inspection-submit {
  min-height: 100vh;
  background: #f7f8fa;
  display: flex;
  flex-direction: column;
}

.wire-inspection-submit__body {
  flex: 1;
  padding-bottom: 72px;
  box-sizing: border-box;
  overflow: auto;
}

.section {
  margin: 12px 16px;
}

.section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  box-shadow: 0 6px 12px rgba(31, 35, 41, 0.05);
  padding: 10px 16px;
  margin-top: 8px;
  margin-bottom: 12px;
}

.section__title {
  font-weight: 600;
  color: #323233;
}

.section__actions {
  display: flex;
  gap: 8px;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px 80px;
}

.detail-card {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
}

.detail-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.detail-card__title {
  font-weight: 600;
  color: #323233;
}

.detail-card__meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
  margin-bottom: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.meta-row {
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.meta-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-item .label {
  color: #969799;
  font-size: 11px;
}

.meta-item .value {
  color: #323233;
  font-size: 12px;
  font-weight: 500;
  word-break: break-all;
  line-height: 1.4;
}
.detail-card__content {
  width: 100%;
  margin-left: 20px;
  /* margin: 0 auto; */
  /* display: flex;
  flex-direction: column;
  align-items: center; */
}
.detail-empty {
  margin: 24px 0;
}

.wire-inspection-submit__footer {
  /* position: fixed;
  left: 0;
  right: 0;
  bottom: 0; */
  padding: 12px 16px calc(12px + var(--van-safe-area-bottom, 0px));
  background: linear-gradient(180deg, rgba(247, 248, 250, 0.92), #f7f8fa);
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.06);
}
</style>
