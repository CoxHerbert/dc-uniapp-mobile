<template>
  <div class="page wire-inspection-submit">
    <van-nav-bar title="线材质检出库" left-arrow @click-left="goBack" />

    <div class="wire-inspection-submit__body">
      <van-cell-group>
        <van-cell title="库位编码" :value="form.locatorNo" />
        <van-cell
          title="出库类型"
          :value="outTypeOptions.find((item) => item.value === form.outType)?.label || '未知'"
        />
      </van-cell-group>
      <van-form ref="formRef" :model="form" scroll-to-error>
        <div class="section__header">
          <div class="section__title">明细信息</div>
          <div class="section__actions">
            <!-- <van-button size="small" type="primary" plain @click="addRow()">新增行</van-button> -->
            <dc-scan-code
              v-model="rowScanCode"
              @confirm="handleRowScanConfirm"
              @error="handleScanError"
            >
              <template #default="{ open, disabled, loading }">
                <van-button
                  size="mini"
                  type="success"
                  plain
                  :loading="loading"
                  :disabled="disabled"
                  @click="open"
                >
                  扫码录入
                </van-button>
              </template>
            </dc-scan-code>
          </div>
        </div>
        <ProductList
          v-if="form.data.length"
          :list="form.data"
          @remove="removeProduct"
          @quantity-change="handleQuantityChange"
        />

        <van-empty v-else class="detail-empty" description="请新增或扫码录入质检明细" />
      </van-form>
    </div>

    <div class="wire-inspection-submit__footer">
      <van-button block type="success" @click="handleSubmit">提交</van-button>
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
import { useRouter, useRoute } from 'vue-router';
import { showConfirmDialog, showToast } from 'vant';
import ProductList from './components/ProductList.vue';
import { useDictStore } from '@/store/dict';
import Api from '@/api';
import { goBackOrHome } from '@/utils/navigation';

defineOptions({ name: 'WireInspectionSubmit' });

const { proxy } = getCurrentInstance();
const router = useRouter();
// const route = useRoute();
const dictStore = useDictStore();

const formRef = ref(null);
const rowScanCode = ref('');

let uid = 0;

const form = reactive({
  locatorNo: '',
  data: [],
});
const route = useRoute();
const { locatorNo = '', outType = '', warehouseId = '', warehouseLocationId = '' } = route.query;

// 初始化表单值
form.locatorNo = locatorNo;
form.outType = outType;
form.warehouseId = warehouseId;
form.warehouseLocationId = warehouseLocationId;
const dictRefs = proxy?.dicts ? proxy.dicts(['QualifiedEnum', 'DC_WIRE_EXCEPTION_TYPE']) : {};

const defaultQualified = [
  { label: '合格', value: '1' },
  { label: '不合格', value: '0' },
];
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
const qualifiedOptions = computed(() => {
  const resolved = unref(dictRefs?.QualifiedEnum);
  if (Array.isArray(resolved) && resolved.length) return resolved;
  return defaultQualified;
});

const exceptionOptions = computed(() => {
  const resolved = unref(dictRefs?.DC_WIRE_EXCEPTION_TYPE);
  return Array.isArray(resolved) ? resolved : [];
});
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
function removeProduct(index) {
  form.data.splice(index, 1);
}
function resolveDictLabel(key, value) {
  const source = key === 'QualifiedEnum' ? qualifiedOptions.value : exceptionOptions.value;
  const hit = source?.find?.((item) => item?.value === value || item?.dictValue === value);
  return hit?.label || hit?.dictLabel || '';
}

function goBack() {
  goBackOrHome(router);
}

function addRow(payload = {}) {
  form.data.unshift({
    _uid: ++uid,
    executeId: payload.itemId ?? '',
    specification: payload.specification ?? '',
    drawQty: payload.drawQty ?? '1',
    maxDrawQty: payload.drawQty ?? '999',
    isQualified: payload.isQualified ?? '1',
    noQty: payload.noQty ?? '0',
    execeptionType: payload.execeptionType ?? '',
    remark: payload.remark ?? '',
    bomNo: payload.bomNo ?? '',
    bomVersion: payload.bomVersion ?? '',
    no: payload.no ?? '',
    itemMaterialNumber: payload.itemMaterialNumber ?? '',
    itemMaterialName: payload.itemMaterialName ?? '',
    mtoNo: payload.mtoNo ?? '',
    unit: payload.unit ?? '',
    finishMaterialNumber: payload.finishMaterialNumber ?? '',
    finishMaterialName: payload.finishMaterialName ?? '',
  });
}

function removeRow(index) {
  showConfirmDialog({ title: '提示', message: '确定删除该条明细吗？' })
    .then(() => {
      form.data.splice(index, 1);
    })
    .catch(() => {});
}

function handleQualifiedChange(row) {
  if (row.isQualified !== '0') {
    row.execeptionType = '';
  }
}

function openExceptionPicker(index) {
  picker.rowIndex = index;
  picker.columns = exceptionOptions.value.map((item) => ({
    text: item.label ?? item.dictLabel,
    value: item.value ?? item.dictValue,
  }));
  picker.show = true;
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

async function handleRowScanConfirm(code) {
  if (!code) return;
  try {
    const res = await Api.application.wireInspection.getDrawContent({ key: code });
    const payload = res?.data || {};
    const { code: status, data, msg } = payload;
    if (status !== 200 || !data) throw new Error(msg || '未获取到明细信息');
    addRow({ ...data, drawQty: String(data?.drawQty ?? '') });
    showToast({ type: 'success', message: '扫码成功' });
    rowScanCode.value = '';
  } catch (err) {
    handleScanError(err);
  }
}

async function handleSubmit() {
  //   console.log(payload);
  // return;
  try {
    await formRef.value?.validate();
  } catch (_err) {
    showToast({ type: 'fail', message: '请完善必填信息' });
    return;
  }

  if (!form.data.length) {
    showToast({ type: 'fail', message: '请至少添加一条质检明细' });
    return;
  }

  try {
    await showConfirmDialog({ title: '提示', message: '确认提交质检记录吗？' });
  } catch (_err) {
    return;
  }
  // console.log(form.data);
  // const payload = form.data.map((item) => ({
  //   executeId: item.executeId,
  //   materialNumber: item.itemMaterialNumber,
  //   materialName: item.itemMaterialName,
  //   specification: item.specification,
  //   inQty: Number(item.drawQty),
  //   unit: item.unit,
  //   remark: item.remark,
  //   warehouseLocationId: form.warehouseLocationId,
  //   noQty: Number(item.noQty),
  // }));
  // let params = {
  //   warehouseId: form.locatorNo,
  //   executeVoList: payload,
  // };
  const payload = {
    // warehouseId: form.warehouseId,
    // outType: form.outType,
    executeVoList: form.data.map((item) => ({
      executeDetailId: item.executeId,
      // materialNumber: item.itemMaterialNumber,
      // materialName: item.itemMaterialName,
      // specification: item.specification,
      outQty: Number(item.drawQty) || 0,
      // unit: item.unit,
      warehouseLocationId: form.warehouseLocationId,
      warehouseCountId: form.warehouseCountId,
    })),
  };
  // const res = await Api.application.wireInspection.outChangExecute(payload);
  // console.log(payload);
  // return;
  try {
    const res = await Api.application.wireInspection.outChangExecute(payload.executeVoList);
    const { code, msg } = res?.data || {};
    if (code !== 200) throw new Error(msg || '提交失败');
    showToast({ type: 'success', message: '提交成功' });
    // 清空当前数据
    form.locatorNo = '';
    form.outType = '';
    form.data = [];
    router.go(-1);
  } catch (err) {
    showToast({ type: 'fail', message: err.message || '提交失败' });
  }
}

async function handleSearch() {
  if (!form.locatorNo) {
    showToast({ message: '请先扫描库位', type: 'fail' });
    return;
  }
  try {
    const res = await Api.application.wireInspection.searchProduct({
      warehouseId: form.warehouseId,
      // locationName: form.locatorNo,
    });
    const payload = res?.data || {};
    const { code, msg, data } = payload;
    if (code !== 200 || !data) throw new Error(msg || '未获取到库存信息');
    // productList.value = data || [];
    form.warehouseCountId = data.records?.[0]?.id || '';
  } catch (err) {
    showToast({ type: 'fail', message: err.message || '查询失败' });
  }
}
handleSearch();
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
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12px 16px calc(12px + var(--van-safe-area-bottom, 0px));
  background: linear-gradient(180deg, rgba(247, 248, 250, 0.92), #f7f8fa);
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.06);
}
</style>
