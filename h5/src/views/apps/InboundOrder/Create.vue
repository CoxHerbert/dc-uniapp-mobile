<!-- InboundCreate.vue / Vue3 + Vant4 版本 -->
<template>
  <div class="cnt">
    <!-- 顶部导航 -->
    <van-nav-bar ref="navRef" title="新增入库单" left-arrow @click-left="goBack" />

    <!-- 基本信息 -->
    <div class="base-wrapper mtop20">
      <div class="title" style="padding-top: 10px">基本信息</div>
      <div class="baseinfo">
        <van-cell-group inset>
          <!-- 仓库选择 -->
          <van-cell
            title="仓库"
            :value="form.warehouseName || '请选择仓库'"
            is-link
            clickable
            @click="handleSelect('warehouseRef')"
          />

          <!-- 入库类型（字典映射显示） -->
          <van-field label="入库类型" :model-value="inTypeLabel" readonly clickable />

          <!-- 来源单号 -->
          <van-cell
            title="来源单号"
            :value="form.inStockNumber || '请选择来源单号'"
            is-link
            clickable
            @click="handleSelect('inStocknumberRef')"
          />

          <!-- 申请人 -->
          <van-cell title="申请人">
            <template #value>
              <dc-view :value="form.applicantId" object-name="user" />
            </template>
          </van-cell>

          <!-- 处理人 -->
          <van-cell title="处理人">
            <template #value>
              <dc-view :value="form.processingPersonnel" object-name="user" />
            </template>
          </van-cell>
        </van-cell-group>
      </div>
    </div>

    <!-- 入库明细 -->
    <div class="title detail-title">入库明细</div>
    <div class="base-wrapper">
      <div class="baseinfo">
        <div class="cell">
          <span class="label">物料编号</span>
          <span class="value">{{ detail.productCode || '-' }}</span>
        </div>
        <div class="cell">
          <span class="label">物料名称</span>
          <span class="value">{{ detail.productName || '-' }}</span>
        </div>
        <div class="cell">
          <span class="label">规格型号</span>
          <span class="value">{{ detail.productSpec || '-' }}</span>
        </div>
        <div class="cell">
          <span class="label">数量</span>
          <span class="value">{{ detail.productQty ?? '-' }}</span>
        </div>
        <div class="cell">
          <span class="label">单位</span>
          <span class="value">{{ detail.productUnit || '-' }}</span>
        </div>
        <div class="cell">
          <span class="label">仓位编号</span>
          <span class="value">{{ detail.locationId || '-' }}</span>
        </div>

        <van-button
          v-if="form.warehouseId && hasDetail"
          class="edite-btn"
          size="small"
          type="primary"
          @click.stop="handleSelect('locationIdRef')"
        >
          仓位选择
        </van-button>
      </div>
    </div>

    <!-- 底部固定操作 -->
    <div class="foot">
      <van-button block type="primary" @click="add">保存</van-button>
    </div>

    <!-- 仓库选择 -->
    <!-- <selectDialog
      ref="warehouseRef"
      :config="cacheData.warehouse"
      :params="{ siteWarehouse: true }"
      @on-confirm="(e) => selectonConfirm(e, 'warehouse')"
    /> -->

    <!-- 来源单号选择 -->
    <!-- <InStocknumberDialog
      ref="inStocknumberRef"
      :config="cacheData.inStockNumber"
      @on-confirm="(e) => selectonConfirm(e, 'inStockNumber')"
    /> -->

    <!-- 仓位选择（依赖选中仓库） -->
    <!-- <selectDialog
      :key="form.warehouseId"
      ref="locationIdRef"
      :config="cacheData.locationId"
      :params="{ warehouseId: form.warehouseId }"
      @on-confirm="(e) => selectonConfirm(e, 'locationId')"
    /> -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, getCurrentInstance } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';
import { goBackOrHome } from '@/utils/navigation';
import { KEYS } from '@/constants/keys';

import Api from '@/api/index';
// import selectDialog from './com/selectDialog.vue';
// import InStocknumberDialog from './com/inStocknumberDialog.vue';
// import cacheData from '@/components/dc/constant/cacheData';

const router = useRouter();
const { proxy } = getCurrentInstance();

// ===== 字典：使用 proxy.dicts(['dc_dict']) =====
// 期望 dc_dict 下包含 DC_WMS_IN_TYPE、DC_WMS_IN_STATUS 等键
const { dc_dict } = proxy.dicts(['dc_dict']);

// 表单
const form = reactive({
  inType: 'DC_WMS_IN_TYPE_ON_SITE_STORAGE', // 入库类型编码
  warehouseId: null,
  warehouseName: '',
  inStockNumber: '',
  applicantId: null,
  processingPersonnel: null,
});

// 明细（响应式对象，使用 Object.assign 更新）
const detail = reactive({});

// 选择弹窗 ref
const warehouseRef = ref();
const inStocknumberRef = ref();
const locationIdRef = ref();

// 是否已有明细
const hasDetail = computed(() => Object.keys(detail).length > 0);

// 登录信息（从 store 或 localStorage 兜底）
const loginInfo =
  proxy?.$store?.getters?.loginInfo || JSON.parse(localStorage.getItem(KEYS.LOGIN_INFO) || '{}');

// 字典取值工具：把编码映射为显示值
function review(value, list) {
  if (!value || !Array.isArray(list)) return undefined;
  const hit = list.find((it) => String(it.dictKey) === String(value));
  return hit ? hit.dictValue : undefined;
}

// 入库类型显示值（字典映射；没有就回退“现场入库”）
const inTypeLabel = computed(() => review(form.inType, dc_dict?.DC_WMS_IN_TYPE) || '现场入库');

onMounted(() => {
  form.applicantId = loginInfo?.user_id || loginInfo?.userId || null;
});

function goBack() {
  goBackOrHome(router);
}

// 打开弹窗
function handleSelect(refname) {
  if (refname === 'warehouseRef') {
    warehouseRef.value?.open?.() ?? (warehouseRef.value.visible = true);
  } else if (refname === 'inStocknumberRef') {
    inStocknumberRef.value?.open?.() ?? (inStocknumberRef.value.visible = true);
  } else if (refname === 'locationIdRef') {
    if (!form.warehouseId) {
      showToast('请先选择仓库');
      return;
    }
    locationIdRef.value?.open?.() ?? (locationIdRef.value.visible = true);
  }
}

// 弹窗确认
function selectonConfirm(e, name) {
  if (name === 'warehouse') {
    form.warehouseId = e.id;
    form.warehouseName = e.warehouseName;
    form.processingPersonnel = e.warehouseSupervisor;
    // 切换仓库后清空已选仓位
    detail.locationId = null;
  } else if (name === 'inStockNumber') {
    form.inStockNumber = e.FBILLNO;
    getDetail(e.FBILLNO);
  } else if (name === 'locationId') {
    detail.locationId = e.id;
  }
}

// 获取来源单号的明细
async function getDetail(sourceId) {
  try {
    const res = await Api.application.appdetailByInStockNumber({
      type: 'DC_WMS_IN_TYPE_ON_SITE_STORAGE',
      sourceId,
    });
    // 兼容：若返回是数组则取第一条
    const row = Array.isArray(res?.data) ? res.data[0] : res?.data || {};
    Object.assign(detail, row || {});
  } catch (err) {
    console.error(err);
    showToast('获取明细失败');
  }
}

// 保存
async function add() {
  if (!form.warehouseId) {
    showToast('请选择仓库');
    return;
  }
  if (!form.inStockNumber) {
    showToast('请选择来源单号');
    return;
  }

  try {
    await showConfirmDialog({
      title: '提示',
      message: '确认入库保存吗',
    });

    detail.warehouseId = form.warehouseId;

    const payload = {
      ...form,
      inTypeName: inTypeLabel.value, // 直接带上展示名
      detailList: [detail],
    };

    const res = await Api.application.inventoryAdd(payload);
    const code = res?.data?.code ?? res?.code;
    const success = res?.data?.success ?? code === 200;

    if (success) {
      showToast('入库成功');
      // 返回上一页并派发刷新事件（上一页可监听 window 的事件）
      setTimeout(() => {
        goBackOrHome(router);
        window.dispatchEvent(new CustomEvent('refreshData', { detail: true }));
      }, 600);
    } else {
      showToast(res?.data?.msg || '保存失败');
    }
  } catch (err) {
    // 用户取消/或异常
    if (err?.isCanceled) return;
    console.error(err);
    showToast('系统异常');
  }
}
</script>

<style lang="scss" scoped>
.name {
  font-weight: 600;
  font-size: 15px;
}

/* Vant 的确认按钮颜色用组件默认，这里只保留你原来样式里与业务相关的部分 */
.cnt {
  background: linear-gradient(180deg, #f7e9df 0%, rgba(255, 255, 255, 0) 12%) !important;
  padding-bottom: 100px;
  box-sizing: border-box;

  .title {
    font-weight: 600;
    font-size: 15px;
    line-height: 15px;
    margin-bottom: 16px;
  }

  .detail-title {
    padding: 20px 15px 0;
  }

  .mtop20 {
    margin-top: 10px;
  }

  .base-wrapper {
    padding: 0 13px;
    box-sizing: border-box;

    .baseinfo {
      padding: 16px 12px;
      box-sizing: border-box;
      border-radius: 10px;
      background-color: #fff;
      position: relative;

      .edite-btn {
        position: absolute;
        bottom: 11px;
        right: 9px;
        height: 24px;
        line-height: 24px;
        padding: 0 13px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 500;
      }
    }
  }

  .cell + .cell {
    margin-top: 12px;
  }

  .cell {
    display: flex;
    align-items: center;
    font-size: 14px;

    .label {
      color: #999;
      width: 75px;
      flex: 0 0 75px;
    }
    .value {
      color: #565656;
      margin-left: 5px;
      flex: 1;
      word-break: break-all;
    }
  }

  .foot {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 12px 12px calc(env(safe-area-inset-bottom) + 12px);
    background-color: #fff;
    z-index: 999;
  }
}
</style>
