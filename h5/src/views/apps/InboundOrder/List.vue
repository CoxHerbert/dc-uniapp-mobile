<!-- src/views/InboundOrder/List.vue -->
<template>
  <div class="page paged-template">
    <dc-pagination
      ref="listRef"
      v-model:keyword="keyword"
      v-model:active-status="activeStatus"
      :status-options="statusOptions"
      search-placeholder="请输入入库单号"
      :page-size="8"
      :offset="200"
      :fetcher="fetcher"
      :get-nav-el="resolveNavEl"
      @add="handleCreate"
    >
      <template #nav>
        <van-nav-bar ref="navRef" title="入库单" fixed left-arrow @click-left="goBack" />
      </template>

      <template #item="{ item, index }">
        <div class="card" :data-index="index" @click="handleDetail(item)">
          <div class="card__header">
            <div class="title">入库单号：{{ item.inStockCode ?? '—' }}</div>
            <van-tag :type="statusTagType(item.inStockStatus)" plain round class="status-tag">
              {{ statusText(item.inStockStatus) }}
            </van-tag>
          </div>

          <div class="card__meta">
            <div class="row">
              <span class="label">处理人</span>
              <span class="value">
                <dc-view :value="item.processingPersonnel" object-name="user" />
              </span>
            </div>
            <div class="row">
              <span class="label">登记时间</span>
              <span class="value">{{ item.createTime ?? '-' }}</span>
            </div>
            <div class="row">
              <span class="label">备注</span>
              <span class="value">{{ item.remark ?? '-' }}</span>
            </div>
          </div>
        </div>
      </template>
    </dc-pagination>
  </div>
</template>

<script setup>
import { ref, computed, getCurrentInstance } from 'vue';
import { useRouter } from 'vue-router';
import Api from '@/api';
import { goBackOrHome } from '@/utils/navigation';
// ★ 引入公共常量与工具
import { getInStockStatusMeta, buildInStockStatusOptions } from './constants';

const { proxy } = getCurrentInstance();
// 如果你项目有字典系统，这里取字典（可选）
const dicts = proxy?.dicts?.(['DC_WMS_IN_STATUS']) || {};
// console.log('dicts:', dicts);

const router = useRouter();

const navRef = ref(null);
const listRef = ref(null);

const resolveNavEl = () => {
  const target = navRef.value;
  if (!target) return null;
  if (target instanceof HTMLElement) return target;
  if (target.$el instanceof HTMLElement) return target.$el;
  if (target.$?.subTree?.el instanceof HTMLElement) return target.$?.subTree?.el;
  return null;
};

// 搜索关键字（对应入库单号 inStockCode） & 状态筛选
const keyword = ref('');
const activeStatus = ref(null); // null 表示 “全部”

// 状态筛选项：优先用字典构建，兜底用常量
const statusOptions = computed(() => {
  const fromDict = dicts?.DC_WMS_IN_STATUS;
  return buildInStockStatusOptions(fromDict?.list || fromDict || []);
});

// —— 状态展示工具（由常量统一管理） —— //
const statusText = (raw) => getInStockStatusMeta(raw).label;
const statusTagType = (raw) => getInStockStatusMeta(raw).type;

// 提供给 dc-pagination 的拉取函数
// 把 keyword 映射为后端需要的 inStockCode（字符串）
async function fetcher({ pageNo, pageSize, keyword, status }) {
  const params = {
    current: pageNo,
    size: pageSize,
  };

  const code = (keyword ?? '').toString().trim();
  if (code) params.inStockCode = code;

  if (status) params.inStockStatus = status;

  const res = await Api.application.inventoryList(params);
  const { code: respCode, data } = res.data || {};
  if (respCode !== 200 || !data) throw new Error('接口返回异常');

  return data; // { current, pages, records, total, size }
}

const goBack = () => {
  goBackOrHome(router);
};

// 新增入库单
function handleCreate() {
  router.push({ name: 'appsInboundOrderCreate' });
}

// 前往入库单详情页
function handleDetail(item) {
  router.push({
    name: 'appsInboundOrderDetail',
    params: { id: item.id },
  });
}
</script>

<style scoped>
.page.paged-template {
  background: #f7f8fa;
  min-height: 100vh;
}

/* 卡片样式 */
.card {
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card .title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}
.status-tag {
  margin-left: 8px;
}
.card__meta {
  margin-top: 8px;
  color: #666;
  font-size: 13px;
}
.card__meta .row {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}
.card__meta .label {
  color: #888;
  min-width: 40px;
}
.card__footer {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}
</style>
