<template>
  <div class="missing-material page">
    <van-nav-bar title="缺料明细" left-arrow @click-left="handleBack" />

    <div class="missing-material__content">
      <div v-if="dataList.length" class="missing-material__scroll">
        <div class="missing-material__table">
          <div class="missing-material__row missing-material__row--head">
            <span class="col-index">序号</span>
            <span class="col-code">物料编码</span>
            <span class="col-name">物料名称</span>
            <span class="col-qty">库存/需求</span>
            <span class="col-date">预计交货日</span>
          </div>

          <div
            v-for="(item, index) in dataList"
            :key="item.id || index"
            class="missing-material__row"
          >
            <span class="col-index">{{ index + 1 }}</span>
            <span class="col-code">{{ item.materialCode || '-' }}</span>
            <span class="col-name">{{ item.materialName || '-' }}</span>
            <span class="col-qty"
              >{{ formatNumber(item.completeQty) }}/{{ formatNumber(item.qty) }}</span
            >
            <span class="col-date">{{ item.deliveryDate || '-' }}</span>
          </div>
        </div>
      </div>

      <van-empty v-else description="暂无缺料信息" />
    </div>
  </div>

  <van-back-top />
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showFailToast, showLoadingToast } from 'vant';
import Api from '@/api';
import { goBackOrHome } from '@/utils/navigation';

const router = useRouter();
const route = useRoute();
const dataList = ref([]);

const billNumber = ref('');

const formatNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const fetchData = async () => {
  if (!billNumber.value) return;
  const toast = showLoadingToast({ message: '加载中…', duration: 0, forbidClick: true });
  try {
    const res = await Api.application.workReport.workSchedule.getMaterialInfo({
      billNumber: billNumber.value,
    });
    if (res.code === 200 && Array.isArray(res.data)) {
      dataList.value = res.data;
    } else {
      dataList.value = [];
      showFailToast(res.message || '未获取到缺料信息');
    }
  } catch (error) {
    showFailToast(error?.message || '获取失败');
  } finally {
    toast.close();
  }
};

onMounted(() => {
  const queryBillNumber = route.query?.billNumber;
  if (typeof queryBillNumber === 'string' && queryBillNumber) {
    billNumber.value = queryBillNumber;
    fetchData();
  } else {
    showFailToast('缺少单号信息');
  }
});

const handleBack = () => {
  goBackOrHome(router);
};
</script>

<style scoped lang="scss">
.missing-material {
  /* 列宽：按需改动 */
  --w-index: 40px;
  --w-code: 120px;
  --w-name: 120px;
  --w-qty: 80px;
  --w-date: 120px;

  min-height: 100vh;
  background: #f7f8fa;

  &__content {
    width: 100%;
    /* 垂直滚动（如果你希望整页滚动而不是内部容器滚动，可去掉这行） */
    overflow: auto;
  }

  /* 横向滚动容器：关键 */
  &__scroll {
    width: 100%;
    overflow-x: auto;
    overflow-y: visible;
    -webkit-overflow-scrolling: touch; /* iOS 惯性滚动 */
    overscroll-behavior-x: contain; /* 阻止横向联动反弹 */
  }

  &__table {
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);

    /* 让表格总宽度 > 视口，从而出现横向滚动条 */
    min-width: calc(var(--w-index) + var(--w-code) + var(--w-name) + var(--w-qty) + var(--w-date));
  }

  &__row {
    display: grid;
    grid-template-columns: var(--w-index) var(--w-code) var(--w-name) var(--w-qty) var(--w-date);
    align-items: center;
    padding: 12px;
    font-size: 13px;
    color: #4c4c4c;
    border-bottom: 1px solid #f0f0f0;
    white-space: nowrap; /* 防止换行导致列宽被“吃掉”，保证横向滚动 */

    &:last-child {
      border-bottom: none;
    }

    &--head {
      position: sticky; /* 如果父容器有垂直滚动，则吸顶表头 */
      top: 0;
      z-index: 1;
      background: #f7f8fa;
      font-weight: 600;
      color: #1f1f1f;
    }

    span {
      display: inline-block;
      text-align: center;
      padding: 0 6px;
      box-sizing: border-box;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* 单独设置对齐习惯（可按需改） */
    .col-index,
    .col-qty,
    .col-date {
      text-align: center;
    }
    .col-code {
      text-align: left;
    }
    .col-name {
      text-align: left;
    }
  }
}
</style>
