<template>
  <div class="out-sourcing-page">
    <van-nav-bar title="工序外发" left-arrow @click-left="handleBack" />
    <van-tabs v-model:active="activeTab" class="custom-tabs">
      <van-tab title="物料明细" name="0">
        <div v-if="items.length === 0" class="empty-state">
          <van-empty description="暂无明细，请点击下方按钮扫码" />
        </div>
        <div v-else class="items-list">
          <div
            v-for="(item, index) in items"
            :key="item.erpId"
            class="item-card"
            :class="[{ 'item-selected': selectedItem && selectedItem.erpId === item.erpId }]"
            @click="handleEditItem(item)"
          >
            <div class="item-header">
              <span class="material-Name">{{ item.materialName }}</span>
              <van-tag
                :type="
                  item.stockName.includes('中转仓')
                    ? 'warning'
                    : item.stockName.includes('半成品仓')
                      ? 'success'
                      : 'primary'
                "
                size="medium"
              >
                {{ item.stockName }}
              </van-tag>
            </div>
            <div class="material-code">{{ item.materialNumber }}</div>
            <div class="item-info">
              <div>
                仓库编码: {{ item.stockNum }} | 库存: {{ item.submitQty }}| 重量: {{ item.netWeight
                }}{{ item.weightUnit }}
              </div>
              <div v-if="item.unitPrice" class="price-info">
                {{ item.process }} | ￥{{ item.unitPrice }} | 交期: {{ item.deliveryTime }} | 总价:
                {{ item.totalPrice }}
              </div>
            </div>

            <van-icon
              name="delete-o"
              size="20"
              class="delete-btn"
              @click.stop="handleRemoveItem(index)"
            />
          </div>
        </div>
      </van-tab>
      <van-tab title="基础信息" name="1">
        <van-cell-group inset class="mt-3">
          <van-field label="当前处理人" :model-value="currentUser" readonly input-align="right" />
          <van-cell
            title="供应商"
            :value="vendor ? vendor.supplierName : '点击选择供应商'"
            is-link
            :class="vendor ? 'text-gray-900' : 'text-gray-300'"
            @click="showVendorDrawer = true"
          />
        </van-cell-group>
      </van-tab>
    </van-tabs>

    <dc-scan-code v-model="snCode" @confirm="handleScanConfirm" @error="handleScanError">
      <template #default="{ open, disabled }">
        <van-floating-bubble
          v-model:offset="bubbleOffset"
          axis="xy"
          icon="scan"
          magnetic="x"
          :gap="16"
          :class="[{ 'is-disabled': disabled }]"
          @click="handleScanBubbleClick(open)"
        />
      </template>
    </dc-scan-code>

    <div class="bottom-bar">
      <div class="stats-info">
        款数: <span class="count">{{ items.length }}</span> | 总数:
        <span class="count">{{ totalQty }}</span>
      </div>
      <van-button
        type="primary"
        round
        :loading="submitting"
        :disabled="items.length === 0"
        @click="handleSubmit"
      >
        {{ submitting ? '提交中...' : '提交外发单' }}
      </van-button>
    </div>

    <van-popup
      v-model:show="showVendorDrawer"
      position="right"
      :style="{ width: '80%', height: '100%' }"
    >
      <van-nav-bar title="选择供应商" left-arrow @click-left="showVendorDrawer = false" />
      <van-search
        v-model="searchKey"
        placeholder="请输入搜索关键词"
        show-action
        right-icon=""
        @clear="vendorsInit"
        @search="vendorsInit"
      >
        <template #action>
          <div @click="vendorsInit">搜索</div>
        </template></van-search
      >
      <van-cell-group inset>
        <van-cell
          v-for="v in vendors"
          :key="v.supplierId"
          :title="v.supplierName"
          :label="'编码: ' + v.supplierId"
          is-link
          @click="handleSelectVendor(v)"
        />
      </van-cell-group>
      <van-empty v-if="vendors.length === 0" description="未匹配到供应商" />
    </van-popup>

    <van-popup
      v-model:show="showEditDrawer"
      :close-on-click-overlay="false"
      position="bottom"
      closeable="true"
      round
      :style="{ padding: '20px' }"
    >
      <div class="edit-drawer">
        <div class="drawer-handle"></div>
        <h3 class="drawer-title">编辑物料信息</h3>
        <van-field
          v-model="editingItem.process"
          label="工艺选择"
          readonly
          required
          is-link
          @click="showProcessPicker = true"
        />
        <van-field
          v-model.number="editingItem.unitPrice"
          type="number"
          required
          label="单价 (含税)"
          placeholder="请输入价格"
          @change="editingItem.totalPrice = editingItem.unitPrice * editingItem.submitQty"
        />
        <van-field
          :model-value="editingItem.deliveryTime"
          label="期望交期"
          readonly
          required
          is-link
          placeholder="请选择日期"
          @click="showCalendar = true"
        />
        <van-field
          v-model.number="editingItem.totalPrice"
          type="number"
          disabled
          label="总价 (含税)"
          placeholder="请输入价格"
        />
        <div class="drawer-actions">
          <van-button plain @click="handleApplyBatch">应用到所有</van-button>
          <van-button type="primary" @click="handleConfirmEdit">确定本行</van-button>
        </div>
      </div>
    </van-popup>

    <van-popup v-model:show="showProcessPicker" round position="bottom">
      <van-picker
        :columns="processOptions"
        @confirm="onProcessConfirm"
        @cancel="showProcessPicker = false"
      />
    </van-popup>

    <van-calendar v-model:show="showCalendar" @confirm="onCalendarConfirm" />

    <van-popup
      v-model:show="showScanResultDrawer"
      :close-on-click-overlay="false"
      position="bottom"
      round
      :style="{ height: '60vh' }"
    >
      <div class="scan-result-drawer">
        <van-nav-bar
          title="选择物料"
          left-text="取消"
          class="scan-result-nav"
          @click-left="showScanResultDrawer = false"
        >
          <template #right>
            <van-button type="primary" size="small" @click="handleConfirmScanSelection">
              确定选择 ({{ selectedScanItems.length }})
            </van-button>
          </template>
        </van-nav-bar>
        <div class="scan-result-list">
          <van-checkbox-group v-model="selectedScanItems">
            <van-checkbox
              v-for="item in scanResultItems"
              :key="item.erpId"
              :name="item.erpId"
              class="scan-result-item"
            >
              <div class="item-content">
                <div class="item-header">
                  <span class="material-Name">{{ item.materialName }}</span>

                  <van-tag
                    :type="
                      item.stockName.includes('中转仓')
                        ? 'warning'
                        : item.stockName.includes('半成品仓')
                          ? 'success'
                          : 'primary'
                    "
                    size="medium"
                  >
                    {{ item.stockName }}
                  </van-tag>
                </div>
                <div class="material-code">{{ item.materialNumber }}</div>
                <div class="item-info">
                  仓库编码: {{ item.stockNum }} | 库存: {{ item.submitQty }}
                </div>
              </div>
            </van-checkbox>
          </van-checkbox-group>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { showConfirmDialog, showToast } from 'vant';
import Api from '@/api';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();
const activeTab = ref('0');
const currentUser = computed(() => {
  const userInfo = userStore.userInfo;
  if (!userInfo) return '';
  const realName = userInfo.realName || userInfo.name || '';
  return realName;
});
const vendor = ref(null);
const showVendorDrawer = ref(false);
const searchKey = ref('');
const items = ref([]);
const editingItem = ref(null);
const showEditDrawer = ref(false);
const showProcessPicker = ref(false);
const showCalendar = ref(false);
const showScanResultDrawer = ref(false);
const selectedItem = ref(null);
const submitting = ref(false);
const scanResultItems = ref([]);
const selectedScanItems = ref([]);

// 修改后（正确）：
const processOptions = ref([]);

const vendors = ref([]);
const bubbleOffset = ref({ x: 0, y: 0 });
// 交互
const handleBack = () => {
  if (history.length > 1) history.back();
  else window.location.href = '/';
};
const initBubblePosition = () => {
  const width = window.innerWidth || document.documentElement.clientWidth || 375;
  const height = window.innerHeight || document.documentElement.clientHeight || 667;
  bubbleOffset.value = {
    x: width - 80,
    y: height - 200,
  };
};

onMounted(() => {
  vendorsInit();
  initBubblePosition();
});
const snCode = ref('');
const handleScanConfirm = async (code) => {
  if (!code) return;
  snCode.value = code;
  handleScan();
};

const handleScanError = (error) => {
  const message = error?.message || '';
  if (message.includes('取消') || message.toLowerCase().includes('cancel')) return;
  showToast({ message: message || '扫码失败', type: 'fail' });
};

// 浮窗点击：未选仓库不允许 open
const handleScanBubbleClick = (open) => {
  // if (!vendor.value) {
  //   showToast('请先选择供应商！');
  //   activeTab.value = '0';
  //   return;
  // }
  // if (activeTab.value !== '1') activeTab.value = '1';
  open();
};
const vendorsInit = async () => {
  try {
    const res = await Api.outsourcing.getSupplierList({
      current: 1,
      size: 10,
      supplierName: searchKey.value,
    });
    const { code, data, msg } = res?.data || {};
    if (code !== 200) {
      showToast({ type: 'fail', message: msg || '供应商查询失败', duration: 2000 });
      return;
    }
    console.log(data.records);
    vendors.value = data.records || [];
  } catch (e) {
    showToast({ type: 'fail', message: e?.message || '供应商查询失败', duration: 2000 });
  }
};

const getProcessOptions = async (stockErpId) => {
  try {
    const res = await Api.outsourcing.getReferenceProcessByErpId({
      erpId: stockErpId,
    });
    const { code, data, msg } = res?.data || {};
    if (code !== 200) {
      showToast({ type: 'fail', message: msg || '工序查询失败', duration: 2000 });
      return;
    }
    processOptions.value =
      data.map((item) => ({
        text: item.processName,
        value: String(item.processId),
      })) || [];
    // if (data.length === 1) {
    //   editingItem.value.processIds = String(data[0].processId);
    //   editingItem.value.process = data[0].processName;
    // }
  } catch (e) {
    showToast({ type: 'fail', message: e?.message || '工序查询失败', duration: 2000 });
  }
};

const totalQty = computed(() => {
  return items.value.reduce((s, i) => s + Number(i.submitQty || 0), 0);
});

const handleSelectVendor = (v) => {
  console.log(v);
  vendor.value = v;
  showVendorDrawer.value = false;

  showToast('已选择供应商');
};

const handleScan = () => {
  handleSearchMaterial();

  showToast('扫码成功');
};
const handleSearchMaterial = async () => {
  try {
    const res = await Api.outsourcing.searchMaterial({
      orgId: 100006,
      qrcode: snCode.value,
    });
    const { code, data, msg } = res?.data || {};
    if (code !== 200) {
      showToast({ type: 'fail', message: msg || '物料查询失败', duration: 2000 });
      return;
    }
    console.log(data);
    handleGetProcessDetailList(data);
  } catch (e) {
    showToast({ type: 'fail', message: e?.message || '物料查询失败', duration: 2000 });
  }
};
const handleGetProcessDetailList = async (obj) => {
  try {
    const res = await Api.outsourcing.getProcessDetailList(obj);
    const { code, data, msg } = res?.data || {};
    if (code !== 200) {
      showToast({ type: 'fail', message: msg || '工序查询失败', duration: 2000 });
      return;
    }
    console.log(data);
    if (!data || data.length === 0) {
      showToast('未找到物料信息');
      return;
    }
    const existingErpIds = items.value.map((i) => i.erpId);
    const newData = data.filter((item) => !existingErpIds.includes(item.erpId));
    if (newData.length === 0) {
      showToast('条码已扫描');
      return;
    }
    if (newData.length === 1) {
      items.value.push(...newData);
      showToast('已添加物料');
    } else {
      scanResultItems.value = newData;
      selectedScanItems.value = [];
      showScanResultDrawer.value = true;
    }
  } catch (e) {
    showToast({ type: 'fail', message: e?.message || '工序查询失败', duration: 2000 });
  }
};

const handleConfirmScanSelection = () => {
  if (selectedScanItems.value.length === 0) {
    showToast('请至少选择一个物料');
    return;
  }
  const selectedItems = scanResultItems.value.filter((item) =>
    selectedScanItems.value.includes(item.erpId)
  );
  items.value.push(...selectedItems);
  showScanResultDrawer.value = false;
  showToast(`已添加 ${selectedItems.length} 个物料`);
};

const handleEditItem = (item) => {
  console.log(item);
  selectedItem.value = item;
  editingItem.value = { ...item };
  if (
    editingItem.value.dcMesProcessesOrderItems &&
    editingItem.value.dcMesProcessesOrderItems.length > 0
  ) {
    processOptions.value =
      editingItem.value.dcMesProcessesOrderItems.map((item) => ({
        text: item.processName,
        value: String(item.processId),
      })) || [];

    editingItem.value.processIds = String(editingItem.value.dcMesProcessesOrderItems[0].processId);
    editingItem.value.process = editingItem.value.dcMesProcessesOrderItems[0].processName;
    getProcessOptions(item.erpId);
  } else {
    processOptions.value = [];
    getProcessOptions(item.erpId);
  }

  showEditDrawer.value = true;
};

const handleRemoveItem = async (index) => {
  try {
    await showConfirmDialog({
      title: '提示',
      message: '删除该条目？',
    });
    const removedItem = items.value[index];
    items.value.splice(index, 1);
    if (selectedItem.value && selectedItem.value.erpId === removedItem.erpId) {
      selectedItem.value = null;
    }
    if (editingItem.value && editingItem.value.erpId === removedItem.erpId) {
      editingItem.value = null;
    }
  } catch {
    // 用户取消删除
  }
};

const onProcessConfirm = ({ selectedOptions }) => {
  editingItem.value.processIds = selectedOptions[0].value;
  editingItem.value.process = selectedOptions[0].text;
  console.log(editingItem.value.process);

  // editingItem.value.processIds = selectedOptions[0].value;
  showProcessPicker.value = false;
};

const onCalendarConfirm = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  editingItem.value.deliveryTime = `${year}-${month}-${day}`;
  showCalendar.value = false;
};

const handleApplyBatch = () => {
  const { process, unitPrice, deliveryTime, processIds } = editingItem.value;
  if (!process || !processIds) {
    showToast('请选择工艺');
    return;
  }
  if (!unitPrice) {
    showToast('请输入单价（含税）');
    return;
  }
  if (!deliveryTime) {
    showToast('请选择期望交期');
    return;
  }
  items.value.forEach((i) => {
    i.process = process;
    i.unitPrice = unitPrice;
    i.deliveryTime = deliveryTime;
    i.processIds = processIds;
    i.totalPrice = i.submitQty * unitPrice;
  });
  showEditDrawer.value = false;
  showToast('已同步到所有款项');
};
const handleConfirmEdit = () => {
  const { process, unitPrice, deliveryTime, processIds, totalPrice } = editingItem.value;
  if (!process || !processIds) {
    showToast('请选择工艺');
    return;
  }
  if (!unitPrice) {
    showToast('请输入单价（含税）');
    return;
  }
  if (!deliveryTime) {
    showToast('请选择期望交期');
    return;
  }
  const targetItem = items.value.find((i) => i.erpId === editingItem.value.erpId);
  if (targetItem) {
    targetItem.process = process;
    targetItem.unitPrice = unitPrice;
    targetItem.deliveryTime = deliveryTime;
    targetItem.processIds = processIds;
    targetItem.totalPrice = totalPrice;
  }
  showEditDrawer.value = false;
  showToast('已更新当前款项');
};
const handleSubmit = async () => {
  if (items.value.some((i) => !i.unitPrice)) {
    showToast('请先完善单价信息');
    return;
  }
  if (!vendor.value) {
    showToast('请先选择供应商！');
    activeTab.value = '1';
    return;
  }
  if (activeTab.value !== '0') activeTab.value = '1';
  submitting.value = true;

  try {
    let params = {
      supplierId: vendor.value?.supplierId || 0,
      supplierNo: vendor.value?.supplierNumber || '',
      supplierName: vendor.value?.supplierName || '',
      transferType: 'DC_FORWARD_TYPE_WW',
      processH5DetailVOList: items.value.map((i) => ({
        ...i,
        processIds: [i.processIds],
      })),
    };
    // console.log(params);
    // return;
    const res = await Api.outsourcing.batchErpSubmitH5(params);
    const { code, msg } = res?.data || {};
    if (code == 200) {
      showToast({ type: 'success', message: msg || '外发单提交成功', duration: 2000 });
      items.value = [];
      vendor.value = null;
      editingItem.value = null;
      activeTab.value = '0';
      submitting.value = false;
      return;
    }
  } catch (e) {
    showToast({ type: 'fail', message: e?.message || '外发单提交失败', duration: 2000 });
    submitting.value = false;
    return;
  }

  submitting.value = false;
  showToast('提交成功！单据已生成');
};
</script>

<style scoped>
.out-sourcing-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
}

.custom-tabs {
  background: #fff;
}

.mt-3 {
  margin-top: 12px;
}

.empty-state {
  padding: 40px 0;
}

.items-list {
  padding: 12px;
}

.item-card {
  position: relative;
  background: #fff;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 12px;
  border-left-width: 4px;
  border-left-style: solid;
  border-left-color: #1989fa;
  /* box-shadow: 0 2px 8px #c00b0b1a; */
  transition: all 0.3s ease;
}

.item-card.item-selected {
  background: #e8f3ff;
  /* box-shadow: 0 4px 16px rgba(25, 137, 250, 0.3); */
  transform: translateY(-2px);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-right: 40px;
}
.material-Name {
  font-weight: bold;
  font-size: 16px;
  color: #323233;
}
.material-code {
  /* font-weight: bold; */
  font-size: 16px;
  color: #323233;
}

.item-info {
  font-size: 12px;
  color: #969799;
  line-height: 1.6;
}

.price-info {
  color: #1989fa;
  font-weight: 500;
  margin-top: 4px;
}

.delete-btn {
  position: absolute;
  top: 12px;
  right: 12px;
}

.scan-button {
  position: fixed;
  right: 24px;
  bottom: 100px;
  width: 56px;
  height: 56px;
  background: #1989fa;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(25, 137, 250, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  z-index: 10;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-top: 1px solid #ebedf0;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 20;
}

.stats-info {
  font-size: 12px;
  color: #646566;
}

.stats-info .count {
  color: #1989fa;
  font-size: 14px;
  font-weight: bold;
}

.edit-drawer {
  max-width: 100%;
}

.drawer-handle {
  width: 48px;
  height: 4px;
  background: #dcdee0;
  border-radius: 2px;
  margin: 0 auto 16px;
}

.drawer-title {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 24px;
}

.drawer-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.drawer-actions .van-button {
  flex: 1;
}

.scan-result-drawer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.scan-result-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.scan-result-item {
  padding: 12px;
  margin-bottom: 12px;
  background: #fff;
  border-radius: 8px;
}

.scan-result-item .item-content {
  width: 100%;
}

.scan-result-item .item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.scan-result-item .material-Name {
  font-weight: bold;
  font-size: 16px;
  color: #323233;
}
.scan-result-item .material-code {
  /* font-weight: bold; */
  font-size: 16px;
  color: #323233;
}

.scan-result-item .item-info {
  font-size: 12px;
  color: #969799;
  line-height: 1.6;
}

.scan-result-nav :deep(.van-nav-bar__text) {
  color: #fff;
}
</style>
