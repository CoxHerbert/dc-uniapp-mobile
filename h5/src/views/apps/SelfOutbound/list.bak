<template>
  <div class="self-outbound-list">
    <van-nav-bar title="自助出库" left-arrow @click-left="handleBack" />

    <div class="self-outbound-list__body">
      <van-form class="self-outbound-list__form" :model="form">
        <van-cell-group inset>
          <dc-select-dialog
            v-model="selectedWarehouse"
            object-name="warehouse"
            :multiple="false"
            return-type="object"
            label="仓库"
          />
          <dc-selector
            v-model="form.outStockType"
            label="出库类型"
            :options="outTypeOptions"
            placeholder="请选择出库类型"
            @change="handleOutTypeChange"
          />
          <van-field
            label="来源单号"
            readonly
            :model-value="barcode.mtoNo"
            placeholder="自动填充 不需要手写"
          />
        </van-cell-group>
      </van-form>

      <ProductList
        v-if="productList.length"
        :list="productList"
        @remove="removeProduct"
        @quantity-change="handleQuantityChange"
      />
      <van-empty v-else class="self-outbound-list__empty" description="暂无数据" />
    </div>

    <div class="self-outbound-list__footer">
      <van-button type="primary" block @click="handleSubmit">提交</van-button>
    </div>

    <dc-scan-code v-model="snCode" @confirm="handleScanConfirm" @error="handleScanError">
      <template #default="{ open, disabled }">
        <van-floating-bubble
          axis="xy"
          icon="scan"
          magnetic="x"
          :class="[{ 'is-disabled': disabled }]"
          @click="handleScanBubbleClick(open, disabled)"
        />
      </template>
    </dc-scan-code>

    <van-popup
      v-model:show="productPopupVisible"
      position="right"
      class="self-outbound-list__candidate-popup"
    >
      <div class="self-outbound-list__candidate">
        <div class="self-outbound-list__candidate-header">
          <span>请选择</span>
          <van-icon name="cross" @click="productPopupVisible = false" />
        </div>
        <div class="self-outbound-list__candidate-body">
          <van-cell
            v-for="item in productCandidates"
            :key="item.locationId || item.id || item.productCode"
            clickable
            @click="handleCandidateSelect(item)"
          >
            <template #title>
              <div class="self-outbound-list__candidate-title">{{ item.productName || '-' }}</div>
            </template>
            <template #label>
              <div class="self-outbound-list__candidate-meta">
                <div>库位ID：{{ item.locationId || '-' }}</div>
                <div>料品名称：{{ item.productName || '-' }}</div>
                <div>产品数量：{{ item.productQty }}</div>
                <div>料品编码：{{ item.productCode || '-' }}</div>
              </div>
            </template>
          </van-cell>
          <van-empty v-if="!productCandidates.length" description="暂无数据" />
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { closeToast, showConfirmDialog, showLoadingToast, showToast } from 'vant';
import { reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import Api from '@/api';
import { useDictStore } from '@/store/dict';
import ProductList from './components/ProductList.vue';
import { goBackOrHome } from '@/utils/navigation';

const router = useRouter();
const dictStore = useDictStore();

defineOptions({ name: 'SelfOutboundList' });

const form = reactive({
  warehouseId: null,
  warehouseName: '',
  outStockType: '',
  outStockTypeName: '',
});

const barcode = reactive({
  warehouseId: null,
  locationId: null,
  productName: '',
  productCode: '',
  mtoNo: '',
});

const snCode = ref('');
const productList = ref([]);
const productPopupVisible = ref(false);
const productCandidates = ref([]);

const selectedWarehouse = ref(null);
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

function syncOutTypeName(value = form.outStockType) {
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

watch(
  () => form.warehouseId,
  (val) => {
    barcode.warehouseId = val;
  }
);

watch(
  () => form.outStockType,
  (val) => {
    if (val === undefined || val === null || `${val}` === '') {
      form.outStockTypeName = '';
      return;
    }
    syncOutTypeName(val);
  }
);

function handleBack() {
  goBackOrHome(router);
}

watch(
  selectedWarehouse,
  (val) => {
    const row = val && typeof val === 'object' ? val : null;
    form.warehouseId = row?.id ?? row?.warehouseId ?? null;
    form.warehouseName = row?.warehouseName ?? row?.name ?? '';
  },
  { immediate: true }
);

// 浮窗点击：未选仓库不允许 open
const handleScanBubbleClick = (open, disabled) => {
  // 组件自身或环境禁用，直接不响应
  if (disabled) return;

  // 没选仓库，给提示
  if (!form.warehouseId) {
    showToast({ message: '请先选择仓库', type: 'fail' });
    return;
  }

  // 正常打开扫码
  open();
};

const handleScanConfirm = async (code) => {
  if (!code) return;
  snCode.value = code;
  await handleSearch();
};

const handleScanError = (error) => {
  const message = error?.message || '';
  if (message.includes('取消') || message.toLowerCase().includes('cancel')) return;
  showToast({ message: message || '扫码失败', type: 'fail' });
};

async function handleSearch() {
  if (!form.warehouseId) {
    showToast({ message: '请选择仓库', type: 'fail' });
    return;
  }
  const code = snCode.value?.toString().trim();
  if (!code) {
    showToast({ message: '请先扫码或输入条码', type: 'fail' });
    return;
  }
  try {
    showLoadingToast({ message: '加载中...', duration: 0, forbidClick: true });
    const res = await Api.wms.warehouse?.analyzeBarcode?.({
      barcode: code,
      barcodeType: 'wire-rod',
    });
    closeToast();
    const { code: respCode, data } = res || {};
    if (respCode !== 200 || !data) {
      showToast({ message: '条码解析失败', type: 'fail' });
      return;
    }
    barcode.productName = data.productName ?? '';
    barcode.locationId = data.locationId ?? '';
    barcode.productCode = data.productCode ?? '';
    const nextMtoNo = data.mtoNo ?? '';
    if (!barcode.mtoNo || barcode.mtoNo === nextMtoNo) {
      barcode.mtoNo = nextMtoNo;
      await fetchProductDetails();
    } else {
      try {
        await showConfirmDialog({
          title: '提示',
          message: '当前专案已改变,是否清空当前选中物料并领出新专案物料？',
          confirmButtonText: '确认',
          cancelButtonText: '取消',
        });
        barcode.mtoNo = nextMtoNo;
        productList.value = [];
        productCandidates.value = [];
        await fetchProductDetails();
      } catch (error) {
        // 用户取消
      }
    }
  } catch (error) {
    closeToast();
    console.error('search failed', error);
  }
}

function normalizeDetail(item) {
  if (!item || typeof item !== 'object') return {};
  const qty = Number(item.productQty ?? item.qty ?? 0);
  const maxValue = Number(item.maxValue ?? item.productQty ?? qty);
  return {
    ...item,
    productQty: Number.isNaN(qty) ? 0 : qty,
    maxValue: Number.isNaN(maxValue) ? undefined : maxValue,
  };
}

function addProduct(item) {
  const detail = normalizeDetail(item);
  if (!detail.locationId) {
    showToast({ message: '缺少库位信息，无法添加', type: 'fail' });
    return;
  }
  const exists = productList.value.some(
    (product) => String(product.locationId) === String(detail.locationId)
  );
  if (exists) {
    showToast({ message: '当前仓位已存在', type: 'fail' });
    return;
  }
  productList.value.push(detail);
}

async function fetchProductDetails() {
  try {
    showLoadingToast({ message: '加载中...', duration: 0, forbidClick: true });
    const res = await Api.wms.warehouse?.codeToGetDetails?.({
      warehouseId: form.warehouseId,
      mtoNo: barcode.mtoNo,
      locationId: barcode.locationId,
      productCode: barcode.productCode,
    });
    closeToast();
    const { code, data } = res || {};
    if (code !== 200 || !Array.isArray(data)) {
      showToast({ message: '未获取到物料信息', type: 'fail' });
      return;
    }
    if (data.length === 1) {
      addProduct(data[0]);
      return;
    }
    productCandidates.value = data.map((item) => normalizeDetail(item));
    productPopupVisible.value = true;
  } catch (error) {
    closeToast();
    console.error('fetch details failed', error);
  }
}

function handleCandidateSelect(item) {
  addProduct(item);
  productPopupVisible.value = false;
}

function removeProduct(index) {
  productList.value.splice(index, 1);
}

function handleQuantityChange({ index, value }) {
  const item = productList.value[index];
  if (!item) return;
  const numeric = Number(value);
  const max = item.maxValue ?? Infinity;
  const next = Number.isNaN(numeric) ? 0 : Math.max(0, Math.min(numeric, max));
  item.productQty = next;
}

async function handleSubmit() {
  if (!form.warehouseId) {
    showToast({ message: '请选择仓库', type: 'fail' });
    return;
  }
  if (!form.outStockType) {
    showToast({ message: '请选择出库类型', type: 'fail' });
    return;
  }
  if (!productList.value.length) {
    showToast({ message: '没有列表要提交', type: 'fail' });
    return;
  }
  try {
    await showConfirmDialog({
      title: '提示',
      message: '确认要执行此操作吗？',
      confirmButtonText: '确认',
      cancelButtonText: '取消',
    });
  } catch (error) {
    return;
  }
  try {
    showLoadingToast({ message: '提交中...', duration: 0, forbidClick: true });
    const payload = {
      mtono: barcode.mtoNo,
      warehouseId: form.warehouseId,
      outStockType: form.outStockType,
      detailList: productList.value.map((item) => ({
        ...item,
        productQty: Number(item.productQty) || 0,
      })),
    };
    const res = await Api.wms.warehouse?.autoOutStock?.(payload);
    closeToast();
    if (res?.code === 200) {
      showToast({ message: '操作成功', type: 'success' });
      productList.value = [];
      productCandidates.value = [];
      snCode.value = '';
    } else {
      showToast({ message: res?.msg || '提交失败', type: 'fail' });
    }
  } catch (error) {
    closeToast();
    console.error('submit failed', error);
  }
}
</script>

<style lang="scss" scoped>
.self-outbound-list {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f7f8fa;

  &__body {
    flex: 1;
    min-height: 0;
    padding: 12px 0 96px;
    box-sizing: border-box;
  }

  &__form {
    margin-bottom: 12px;
  }

  &__empty {
    margin-top: 40px;
  }

  &__footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 12px 16px calc(env(safe-area-inset-bottom) + 12px);
    background: #fff;
    box-shadow: 0 -6px 12px rgba(31, 35, 41, 0.08);
  }

  &__candidate-popup {
    width: 80vw;
    max-width: 360px;
    height: 100vh;
    background: #fff;
  }

  &__candidate {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  &__candidate-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    font-size: 16px;
    font-weight: 600;
    border-bottom: 1px solid #f2f3f5;
  }

  &__candidate-body {
    flex: 1;
    overflow: auto;
  }

  &__candidate-title {
    font-weight: 600;
    color: #323233;
  }

  &__candidate-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    color: #646566;
  }
}

/* 组件自身 disabled（例如环境不支持）时禁用点击 */
:deep(.van-floating-bubble.is-disabled) {
  pointer-events: none;
  opacity: 0.6;
}
</style>
