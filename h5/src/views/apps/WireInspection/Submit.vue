<template>
  <div class="page wire-inspection-submit">
    <van-nav-bar title="线材质检入库" left-arrow @click-left="goBack" />

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
        </van-cell-group>

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
                  size="small"
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

        <div v-if="form.data.length" class="detail-list">
          <div v-for="(row, index) in form.data" :key="row._uid" class="detail-card">
            <div class="detail-card__header">
              <div class="detail-card__title">#{{ index + 1 }}</div>
              <van-button size="mini" type="danger" plain @click="removeRow(index)">
                删除
              </van-button>
            </div>

            <div class="detail-card__meta">
              <div class="meta-row">
                <div class="meta-item">
                  <span class="label">BOM编码</span>
                  <span class="value">{{ row.bomNo || '—' }}</span>
                </div>
                <div class="meta-item">
                  <span class="label">BOM版本</span>
                  <span class="value">{{ row.bomVersion || '—' }}</span>
                </div>
              </div>
              <div class="meta-row">
                <div class="meta-item">
                  <span class="label">执行单号</span>
                  <span class="value">{{ row.no || '—' }}</span>
                </div>
                <div class="meta-item">
                  <span class="label">物料编码</span>
                  <span class="value">{{
                    row.exeMaterialNumber || row.itemMaterialNumber || '—'
                  }}</span>
                </div>
              </div>
              <div class="meta-row">
                <div class="meta-item">
                  <span class="label">物料名称</span>
                  <span class="value">{{
                    row.exeMaterialName || row.itemMaterialName || '—'
                  }}</span>
                </div>
                <div class="meta-item">
                  <span class="label">专案号</span>
                  <span class="value">{{ row.mtoNo || '—' }}</span>
                </div>
              </div>
            </div>
            <div class="detail-card__content">
              <van-cell-group inset>
                <!-- <van-field
                  v-model="row.drawQty"
                  :name="`data[${index}].drawQty`"
                  label="图档数量"
                  type="digit"
                  placeholder="请输入图档数量"
                  :rules="[{ required: true, message: '请输入图档数量' }]"
                /> -->
                <van-field
                  name="stepper1"
                  label="图档合格数量"
                  placeholder="请输入图档合格数量"
                  :rules="[{ required: true, message: '请输入图档合格数量' }]"
                >
                  <template #input>
                    <van-stepper
                      v-model="row.drawQty"
                      :min="0"
                      :max="parseInt(row.maxDrawQty) || 999"
                      @change="(value) => handleQtyChange(row, 'drawQty', value)"
                    />
                  </template>
                </van-field>

                <!-- <van-field
                  :name="`data[${index}].isQualified`"
                  label="是否合格"
                  :rules="[{ required: true, message: '请选择是否合格' }]"
                >
                  <template #input>
                    <van-radio-group
                      v-model="row.isQualified"
                      direction="horizontal"
                      @change="() => handleQualifiedChange(row)"
                    >
                      <van-radio
                        v-for="option in qualifiedOptions"
                        :key="option.value ?? option.dictValue"
                        :name="option.value ?? option.dictValue"
                      >
                        {{ option.label ?? option.dictLabel }}
                      </van-radio>
                    </van-radio-group>
                  </template>
                </van-field> -->

                <!-- <van-field
                  v-if="row.isQualified === '0'"
                  :name="`data[${index}].execeptionType`"
                  label="异常类型"
                  is-link
                  readonly
                  :model-value="resolveDictLabel('DC_WIRE_EXCEPTION_TYPE', row.execeptionType)"
                  placeholder="请选择异常类型"
                  :rules="[{ required: true, message: '请选择异常类型' }]"
                  @click="openExceptionPicker(index)"
                /> -->
                <!-- <van-field
                  v-if="row.isQualified === '0'"
                  v-model="row.noQty"
                  :name="`data[${index}].noQty`"
                  label="不合格数量"
                  type="digit"
                  placeholder="请输入不合格数量"
                  :rules="[{ required: true, message: '请输入不合格数量' }]"
                /> -->
                <van-field
                  name="stepper2"
                  label="不合格数量"
                  placeholder="请输入不合格数量"
                  :rules="[{ required: true, message: '请输入不合格数量' }]"
                >
                  <template #input>
                    <van-stepper
                      v-model="row.noQty"
                      :min="0"
                      :max="parseInt(row.maxDrawQty) || 999"
                      @change="(value) => handleQtyChange(row, 'noQty', value)"
                    />
                  </template>
                </van-field>
                <van-field
                  v-model="row.remark"
                  :name="`data[${index}].remark`"
                  label="备注"
                  type="textarea"
                  rows="2"
                  autosize
                  placeholder="请输入备注"
                />
              </van-cell-group>
            </div>
          </div>
        </div>

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
import { useRouter } from 'vue-router';
import { showConfirmDialog, showToast } from 'vant';
import Api from '@/api';
import { goBackOrHome } from '@/utils/navigation';

defineOptions({ name: 'WireInspectionSubmit' });

const { proxy } = getCurrentInstance();
const router = useRouter();

const formRef = ref(null);
const rowScanCode = ref('');

let uid = 0;

const form = reactive({
  locatorNo: '',
  data: [],
});

const dictRefs = proxy?.dicts ? proxy.dicts(['QualifiedEnum', 'DC_WIRE_EXCEPTION_TYPE']) : {};

const defaultQualified = [
  { label: '合格', value: '1' },
  { label: '不合格', value: '0' },
];

const qualifiedOptions = computed(() => {
  const resolved = unref(dictRefs?.QualifiedEnum);
  if (Array.isArray(resolved) && resolved.length) return resolved;
  return defaultQualified;
});

const exceptionOptions = computed(() => {
  const resolved = unref(dictRefs?.DC_WIRE_EXCEPTION_TYPE);
  return Array.isArray(resolved) ? resolved : [];
});

const picker = reactive({
  show: false,
  rowIndex: null,
  columns: [],
});

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

function handleQtyChange(row, field, value) {
  // 确保值是数字类型
  const numValue = parseInt(value) || 0;
  const totalQty = parseInt(row.maxDrawQty) || 999;
  if (field === 'drawQty') {
    // 合格数量变化，确保不超过总量
    row.drawQty = Math.min(numValue, totalQty);
    // 不合格数量 = 总量 - 合格数量
    row.noQty = totalQty - row.drawQty;
  } else if (field === 'noQty') {
    // 不合格数量变化，确保不超过总量
    row.noQty = Math.min(numValue, totalQty);
    // 合格数量 = 总量 - 不合格数量
    row.drawQty = totalQty - row.noQty;
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
  console.log(form.data);
  const payload = form.data.map((item) => ({
    executeDetailId: item.executeId,
    warehouseLocationId: form.warehouseLocationId,
    // materialNumber: item.itemMaterialNumber,
    // materialName: item.itemMaterialName,
    // specification: item.specification,
    inQty: Number(item.drawQty),
    // unit: item.unit,
    // remark: item.remark,

    noQty: Number(item.noQty),
  }));
  let params = {
    warehouseId: form.locatorNo,
    executeVoList: payload,
  };
  // console.log(params);
  // return;
  try {
    const res = await Api.application.wireInspection.inChangExecute(payload);
    const { code, msg } = res?.data || {};
    if (code !== 200) throw new Error(msg || '提交失败');
    showToast({ type: 'success', message: '提交成功' });
    // 清空当前数据
    form.locatorNo = '';
    form.data = [];
  } catch (err) {
    showToast({ type: 'fail', message: err.message || '提交失败' });
  }
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
  padding: 0 16px;
  margin-top: 8px;
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
