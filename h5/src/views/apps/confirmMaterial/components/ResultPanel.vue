<template>
  <div class="result-panel">
    <div class="result-panel__toolbar">
      <van-checkbox v-model="checkAll">全选</van-checkbox>
      <div class="result-panel__actions">
        <van-tabs v-model:active="activeTab" shrink background="#fff" class="result-panel__tabs">
          <van-tab v-for="tab in tabs" :key="tab.value" :title="tab.label" :name="tab.value" />
        </van-tabs>
        <dc-scan-code v-model="scanCode" @confirm="handleScanConfirm" @error="handleScanError">
          <van-button type="primary" size="small">
            <van-icon name="scan" size="16" />扫码确认
          </van-button>
        </dc-scan-code>
      </div>
    </div>

    <div v-if="pageData.list.length" class="result-panel__list">
      <div
        v-for="item in pageData.list"
        :key="item.id ?? item.productCode"
        class="result-card"
        @click="toggleItem(item)"
      >
        <van-checkbox
          v-model="item.checked"
          class="result-card__checkbox"
          :name="item.productName"
          @click.stop
        />
        <div class="result-card__content">
          <div class="result-card__title">{{ item.productName ?? '-' }}</div>
          <div class="result-card__meta">
            <div class="row">
              <span class="label">物料编码</span>
              <span class="value">{{ item.productCode ?? '-' }}</span>
            </div>
            <div class="row">
              <span class="label">所属专案</span>
              <span class="value">{{ item.mtoNo ?? '-' }}</span>
            </div>
            <div class="row">
              <span class="label">仓位</span>
              <span class="value">{{ item.locationName ?? '-' }}</span>
            </div>
            <div class="row">
              <span class="label">需求数量</span>
              <span class="value">{{ formatQty(item) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <van-empty v-else description="暂无数据" />

    <div class="result-panel__footer">
      <div class="statistics">已完成：{{ pageData.selected }} / {{ pageData.total }}</div>
      <van-button class="submit" type="primary" block @click="confirmSubmit">提交领取</van-button>
    </div>

    <van-dialog
      v-model:show="showConfirm"
      :title="dialogTitle"
      show-cancel-button
      confirm-button-text="提交"
      @confirm="handleSubmit"
    >
      <div class="dialog-list">
        <div v-for="item in pageData.unselected" :key="item.id ?? item.productCode">
          {{ item.productName }} / {{ item.productCode }}
        </div>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { showFailToast, showLoadingToast, showSuccessToast } from 'vant';
import Api from '@/api';

const tabs = [
  { label: '全部', value: 'all' },
  { label: '已选', value: 'selected' },
  { label: '未选', value: 'unselected' },
];

const activeTab = ref('all');
const detailInfo = ref({ detailList: [] });
const showConfirm = ref(false);
const dialogTitle = ref('');
const scanCode = ref('');

const checkAll = computed({
  get() {
    const list = detailInfo.value.detailList || [];
    return list.length > 0 && list.every((item) => item.checked);
  },
  set(val) {
    detailInfo.value.detailList?.forEach((item) => {
      item.checked = val;
    });
  },
});

const pageData = computed(() => {
  const list = Array.isArray(detailInfo.value.detailList) ? detailInfo.value.detailList : [];
  const selected = list.filter((item) => item.checked);
  const unselected = list.filter((item) => !item.checked);

  let view = list;
  if (activeTab.value === 'selected') view = selected;
  if (activeTab.value === 'unselected') view = unselected;

  return {
    list: view,
    selected: selected.length,
    unselected,
    total: list.length,
  };
});

function formatQty(item) {
  const qty = item?.productQty ?? '-';
  const unit = item?.productUnit ?? '';
  return unit ? `${qty} ${unit}` : qty;
}

async function fetchByCode(code) {
  if (!code) return;
  const toast = showLoadingToast({ message: '加载中...', duration: 0, forbidClick: true });
  try {
    const res = await Api.wms?.wmsOutStock?.detailByCode({ code });
    const payload = res?.data ?? res;
    const { code: respCode, data } = payload ?? {};
    if (respCode !== 200 || !data) {
      showFailToast('未获取到单据详情');
      return;
    }

    const detailList = Array.isArray(data.detailList) ? data.detailList : [];
    detailInfo.value = {
      ...data,
      detailList: detailList.map((item) => ({ ...item, checked: false })),
    };
    activeTab.value = 'all';
  } catch (error) {
    console.error('获取出库单详情失败', error);
    showFailToast('获取出库单详情失败');
  } finally {
    toast.close();
  }
}

function toggleItem(item) {
  item.checked = !item.checked;
}

function confirmSubmit() {
  if (!detailInfo.value.detailList?.length) {
    showFailToast('暂无可提交的物料');
    return;
  }
  dialogTitle.value =
    pageData.value.unselected.length > 0
      ? '仍有未确认领取的物料，请确认是否提交？'
      : '已全部确认领取，请确认是否提交？';
  showConfirm.value = true;
}

async function handleSubmit() {
  const checkedItems = detailInfo.value.detailList?.filter((item) => item.checked) || [];
  if (checkedItems.length === 0) {
    showFailToast('请至少选择一条物料');
    return Promise.reject(new Error('请至少选择一条物料'));
  }

  const toast = showLoadingToast({ message: '提交中...', duration: 0, forbidClick: true });
  try {
    const form = {
      ...detailInfo.value,
      detailList: checkedItems,
    };
    const res = await Api.wms?.wmsOutStock?.audit(form);
    const payload = res?.data ?? res;
    const { code: respCode, msg } = payload ?? {};
    if (respCode === 200) {
      showSuccessToast(msg || '提交成功');
      detailInfo.value = { detailList: [] };
      showConfirm.value = false;
    } else {
      showFailToast(msg || '提交失败');
    }
  } catch (error) {
    console.error('提交领取失败', error);
    showFailToast('提交失败');
  } finally {
    toast.close();
  }
}

function isCancelError(error) {
  const message = error?.message || '';
  return message.includes('取消') || message.toLowerCase().includes('cancel');
}

function handleScanError(error) {
  if (isCancelError(error)) return;
  showFailToast(error?.message || '扫码失败');
}

function applyScanResult(code) {
  if (!code) return;
  detailInfo.value.detailList?.forEach((item) => {
    if (item.productCode === code) {
      item.checked = true;
    }
  });
}

function handleScanConfirm(code) {
  if (!code) return;
  scanCode.value = code;
  applyScanResult(code);
}

// 对外暴露
defineExpose({
  fetchByCode,
});
</script>

<style lang="scss" scoped>
:deep(.van-tabs__line) {
  display: none;
}
.result-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-height: 0;

  &__toolbar {
    padding: 0 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fff;
  }

  &__actions {
    display: flex;
    align-items: center;
  }

  &__tabs {
    --van-tabs-line-height: 2px;
  }

  &__list {
    flex: 1;
    min-height: 0;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background: #fff;

    .statistics {
      border-radius: 12px;
      padding: 12px;
      font-weight: 600;
      color: #475467;
    }

    .submit {
      width: 120px;
      height: 44px;
      border-radius: 12px;
    }
  }
}

.result-card {
  position: relative;
  padding: 16px 16px 16px 48px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);

  &__checkbox {
    position: absolute;
    left: 16px;
    top: 18px;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #1d2939;
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 13px;
    color: #475467;

    .row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }

    .label {
      color: #98a2b3;
    }
  }
}

.dialog-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  color: #475467;
}
</style>
