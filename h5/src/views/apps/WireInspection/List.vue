<template>
  <div class="page wire-inspection-list">
    <dc-pagination
      ref="listRef"
      :fetcher="fetcher"
      :page-size="8"
      :get-nav-el="resolveNavEl"
      :search-visible="false"
      :tabs-visible="false"
      @add="handleCreate"
    >
      <template #nav>
        <van-nav-bar ref="navRef" title="线材质检" fixed left-arrow @click-left="goBack" />
      </template>

      <template #item="{ item, index }">
        <div class="wire-card" :data-index="index">
          <div class="wire-card__header">
            <span class="wire-card__index">#{{ index + 1 }}</span>
            <span class="wire-card__status" :class="statusClass(item.isQualified)">
              {{ resolveDictLabel('QualifiedEnum', item.isQualified) }}
            </span>
          </div>
          <div class="wire-card__body">
            <div v-for="column in displayColumns" :key="column.prop" class="wire-card__row">
              <span class="wire-card__label">{{ column.label }}</span>
              <span class="wire-card__value">{{ renderValue(item, column) }}</span>
            </div>
          </div>
        </div>
      </template>

      <template #empty>
        <van-empty description="暂无质检记录">
          <van-button type="primary" round size="small" @click="handleCreate"> 去录入 </van-button>
        </van-empty>
      </template>
    </dc-pagination>
  </div>
</template>

<script setup>
import { computed, ref, getCurrentInstance, unref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Api from '@/api';
import { goBackOrHome } from '@/utils/navigation';

const { proxy } = getCurrentInstance();
const router = useRouter();
const route = useRoute();

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

const dictRefs = proxy.dicts(['DC_WIRE_EXCEPTION_TYPE']);

const defaultQualified = [
  { label: '合格', value: '1' },
  { label: '不合格', value: '0' },
];

const qualifiedOptions = computed(() => defaultQualified);

const exceptionOptions = computed(() => {
  const list = dictRefs?.DC_WIRE_EXCEPTION_TYPE;
  const resolved = unref(list);
  return Array.isArray(resolved) ? resolved : [];
});

const displayColumns = [
  { prop: 'drawQty', label: '图档数量' },
  { prop: 'execeptionType', label: '异常类型', dictKey: 'DC_WIRE_EXCEPTION_TYPE' },
  { prop: 'remark', label: '备注' },
  {
    prop: 'itemId',
    label: '执行单明细',
    props: {
      is: 'dc-view',
      objectName: 'wireExecute',
    },
  },
  { prop: 'bomNo', label: 'BOM编码' },
  { prop: 'bomVersion', label: 'BOM版本' },
  {
    prop: 'drawAddress',
    label: '图档地址',
  },
  { prop: 'exeMaterialNumber', label: '物料编码' },
  { prop: 'exeMaterialName', label: '物料名称' },
  { prop: 'mtoNo', label: '专案号' },
  { prop: 'unit', label: '单位' },
  { prop: 'no', label: '线材执行单单号' },
  { prop: 'finishMaterialNumber', label: '成品物料编码' },
  { prop: 'finishMaterialName', label: '成品物料名称' },
];

function resolveDictLabel(dictKey, value) {
  const map = dictKey === 'QualifiedEnum' ? qualifiedOptions.value : exceptionOptions.value;
  const hit = map?.find?.((item) => item?.value === value || item?.dictValue === value);
  return hit?.label || hit?.dictLabel || (value ?? '—');
}

function renderValue(row, column) {
  if (!row) return '—';
  const raw = row[column.prop];
  if (column.dictKey) return resolveDictLabel(column.dictKey, raw) || '—';
  if (raw === null || raw === undefined || raw === '') return '—';
  return raw;
}

function statusClass(value) {
  if (value === '1') return 'is-success';
  if (value === '0') return 'is-danger';
  return '';
}

async function fetcher({ pageNo, pageSize }) {
  const params = { current: pageNo, size: pageSize };
  const res = await Api.application.wireInspection.list(params);
  const payload = res?.data || {};
  const { code, data, msg } = payload;
  if (code !== 200 || !data) throw new Error(msg || '加载失败');
  return data;
}

function goBack() {
  goBackOrHome(router);
}

function handleCreate() {
  router.push({ name: 'appsWireInspectionSubmit' });
}

watch(
  () => route.query.refresh,
  (val) => {
    if (val) {
      listRef.value?.resetAndLoad?.();
    }
  }
);
</script>

<style scoped>
.wire-inspection-list {
  min-height: 100vh;
  background: #f7f8fa;
}

.wire-card {
  background: #fff;
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 12px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
}

.wire-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.wire-card__index {
  font-weight: 600;
  color: #323233;
}

.wire-card__status {
  font-size: 13px;
  padding: 2px 10px;
  border-radius: 999px;
  background: #ebedf0;
  color: #646566;
}

.wire-card__status.is-success {
  background: rgba(25, 190, 107, 0.12);
  color: #07c160;
}

.wire-card__status.is-danger {
  background: rgba(255, 80, 80, 0.12);
  color: #ee0a24;
}

.wire-card__body {
  display: grid;
  gap: 8px;
}

.wire-card__row {
  display: flex;
  font-size: 13px;
  color: #646566;
}

.wire-card__label {
  min-width: 98px;
  color: #969799;
}

.wire-card__value {
  flex: 1;
  color: #323233;
  word-break: break-all;
}
</style>
