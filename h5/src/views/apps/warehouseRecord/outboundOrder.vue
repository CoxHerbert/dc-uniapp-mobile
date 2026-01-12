<template>
  <div class="page outbound-order-list">
    <dc-pagination
      ref="listRef"
      v-model:keyword="keyword"
      v-model:active-status="activeStatus"
      v-model:query="queryParams"
      :status-options="statusOptions"
      search-placeholder="请输入单号"
      :page-size="8"
      :offset="200"
      :fetcher="fetcher"
      :get-nav-el="resolveNavEl"
      :add-visible="true"
      :tabs-visible="false"
      @add="handleAdd"
    >
      <template #nav>
        <van-nav-bar ref="navRef" title="装配工具借用" fixed left-arrow @click-left="goBack" />
      </template>

      <template #notice>
        <van-notice-bar
          left-icon="volume-o"
          text="领料人 发起 > 仓管 通过或者驳回 > 领料人 通过或者驳回 > 领料完成"
        />
      </template>

      <template #search-extra>
        <van-dropdown-menu class="filter-menu">
          <van-dropdown-item v-model="filterType" :options="typeOptions" />
          <van-dropdown-item v-model="filterStatus" :options="statusOptions" />
        </van-dropdown-menu>
      </template>

      <template #item="{ item }">
        <div class="card" @click="handleEdit(item)">
          <div class="card__header">
            <div class="title">单号：{{ item.outStockCode ?? '—' }}</div>
            <van-tag plain round class="status-tag">
              <dc-dict type="text" :value="item.outStockStatus" :options="outStatusDict" />
            </van-tag>
          </div>

          <div class="card__meta">
            <div class="row">
              <span class="label">出库类型</span>
              <span class="value">
                <dc-dict type="text" :value="item.outStockType" :options="outTypeDict" />
              </span>
            </div>
            <div class="row">
              <span class="label">仓库</span>
              <span class="value">
                <dc-view v-model="item.warehouseId" object-name="warehouse" />
              </span>
            </div>
            <div class="row">
              <span class="label">申请人</span>
              <span class="value">
                <dc-view v-model="item.applicantId" object-name="user" />
              </span>
            </div>
            <div class="row">
              <span class="label">处理人</span>
              <span class="value">
                <dc-view v-model="item.processingPersonnel" object-name="user" />
              </span>
            </div>
            <div class="row">
              <span class="label">登记时间</span>
              <span class="value">{{ item.createTime ?? '-' }}</span>
            </div>
            <div class="row">
              <span class="label">更新时间</span>
              <span class="value">{{ item.updateTime ?? '-' }}</span>
            </div>
          </div>

          <div class="card__footer">
            <van-button
              v-permission="{ id: 'DC_OUTBOUNDORDER_EDIT', row: item }"
              size="small"
              type="primary"
              plain
              @click.stop="handleEdit(item)"
              >编辑</van-button
            >
            <van-button
              v-permission="{ id: 'DC_OUTBOUNDORDER_DEL', row: item }"
              size="small"
              type="danger"
              plain
              @click.stop="handleDelete(item)"
              >删除</van-button
            >
          </div>
        </div>
      </template>

      <template #empty>
        <van-empty description="暂无借用记录">
          <van-button type="primary" round size="small" @click="handleAdd">新增记录</van-button>
        </van-empty>
      </template>
    </dc-pagination>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { showConfirmDialog, showToast } from 'vant';
import Api from '@/api';
import { goBackOrHome } from '@/utils/navigation';
import { useDictStore } from '@/store/dict';

const router = useRouter();
const dictStore = useDictStore();

const navRef = ref(null);
const listRef = ref(null);

const keyword = ref('');
const activeStatus = ref(null);
const queryParams = ref({
  outStockType: 'DC_WMS_OUT_TYPE_BORROW',
});
const filterType = ref('DC_WMS_OUT_TYPE_BORROW');
const filterStatus = ref(null);

const outTypeDict = ref([]);
const outStatusDict = ref([]);

const statusOptions = computed(() => {
  const list =
    outStatusDict.value
      .filter((item) => item.value !== 'DC_WMS_OUT_STATUS_C')
      .map((d) => ({ text: d.label, value: d.value })) || [];
  return [{ text: '全部', value: null }, ...list];
});

const typeOptions = computed(() => {
  const list = outTypeDict.value.map((d) => ({ text: d.label, value: d.value })) || [];
  return [{ text: '全部', value: null }, ...list];
});

const resolveNavEl = () => {
  const target = navRef.value;
  if (!target) return null;
  if (target instanceof HTMLElement) return target;
  if (target.$el instanceof HTMLElement) return target.$el;
  if (target.$?.subTree?.el instanceof HTMLElement) return target.$?.subTree?.el;
  return null;
};

const loadDicts = async () => {
  outTypeDict.value = (await dictStore.get('DC_WMS_OUT_TYPE_WMS')) || [];
  outStatusDict.value = (await dictStore.get('DC_WMS_OUT_STATUS')) || [];
};

onMounted(() => {
  loadDicts();
});

watch(filterType, (value) => {
  queryParams.value = {
    ...queryParams.value,
    outStockType: value || null,
  };
  listRef.value?.resetAndLoad?.();
});

watch(filterStatus, (value) => {
  activeStatus.value = value ?? null;
  listRef.value?.resetAndLoad?.();
});

async function fetcher({ pageNo, pageSize, keyword, status, outStockType }) {
  const params = {
    current: pageNo,
    size: pageSize,
  };
  const trimmedKeyword = (keyword ?? '').toString().trim();
  if (trimmedKeyword) params.outStockCode = trimmedKeyword;
  if (status) params.outStockStatus = status;
  if (outStockType) params.outStockType = outStockType;

  const res = await Api.application.outboundOrder.list(params);
  const { code, data, msg } = res?.data || {};
  if (code !== 200 || !data) throw new Error(msg || '加载失败');
  return data;
}

const handleAdd = () => {
  router.push({ name: 'appsWarehouseRecordOutboundSubmit', params: { id: 'create' } });
};

const handleEdit = (row) => {
  router.push({ name: 'appsWarehouseRecordOutboundSubmit', params: { id: row.id } });
};

const handleDelete = async (row) => {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: `确定删除单据“${row.outStockCode || row.id}”吗？`,
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    });
    await Api.application.outboundOrder.remove({ ids: row.id });
    showToast({ type: 'success', message: '删除成功' });
    listRef.value?.resetAndLoad?.();
  } catch (error) {
    if (error && error !== 'cancel') {
      showToast({ type: 'fail', message: '删除失败' });
    }
  }
};

const goBack = () => {
  goBackOrHome(router, '/apps');
};
</script>

<style lang="scss" scoped>
.outbound-order-list {
  min-height: 100vh;
  background: #f7f8fa;
}

.filter-card {
  margin: 12px 12px 8px;

  &__action {
    margin: 12px 0 4px;
  }
}

.filter-menu {
  margin-bottom: 8px;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 12px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
}

.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.card__header .title {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
}

.status-tag {
  background: rgba(25, 137, 250, 0.12);
  color: #1989fa;
  border-color: transparent;
}

.card__meta {
  margin-top: 6px;
  color: #666;
  font-size: 13px;
  display: grid;
  gap: 6px;
}

.card__meta .row {
  display: flex;
  gap: 8px;
}

.card__meta .label {
  color: #888;
  min-width: 56px;
}

.card__footer {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}
</style>
