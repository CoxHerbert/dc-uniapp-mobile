<template>
  <div class="pending-list">
    <!-- 吸顶搜索条 -->
    <van-sticky :offset-top="props.stickyTop">
      <div class="pending-list__search-bar">
        <DcSearchBar
          v-model="keyword"
          placeholder="搜索出库单据编号"
          button-text="查询"
          :show-scan="false"
          @search="onSearch"
          @clear="onSearch"
        />
      </div>
    </van-sticky>

    <!-- 下拉刷新 + 无限滚动 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        :immediate-check="false"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <template v-if="list.length">
          <div
            v-for="item in list"
            :key="item.id ?? item.outStockCode"
            class="pending-card"
            @click="handleSelect(item)"
          >
            <div class="pending-card__header">
              <div class="title">{{ item.outStockCode ?? '-' }}</div>
              <div class="badge">
                <dc-dict :options="dicts.DC_WMS_OUT_TYPE_WMS" :value="item.outStockType" />
              </div>
            </div>

            <div class="pending-card__body">
              <div class="row">
                <span class="label">申请人</span>
                <span class="value">
                  <!-- TODO: 如需通过ID换姓名，可在此接入你的用户字典/接口 -->
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
                <span class="value">{{ item.createTime ?? '—' }}</span>
              </div>
            </div>

            <van-icon class="pending-card__icon" name="arrow" size="16" />
          </div>
        </template>

        <van-empty v-else image="search" description="暂无数据" class="pending-list__empty" />
      </van-list>
    </van-pull-refresh>
    <van-back-top />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, getCurrentInstance } from 'vue';
import { showFailToast } from 'vant';
import Api from '@/api';
import DcSearchBar from '@/components/dc-ui/components/SearchBar/index.vue';

const { proxy } = getCurrentInstance();

const props = defineProps({
  stickyTop: { type: Number, default: 0 },
});

const emit = defineEmits(['select']);

const dicts = ref([]);
const keyword = ref('');

// 列表状态
const list = ref([]);
const pageNo = ref(1);
const pageSize = ref(8);
const total = ref(0);
const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);

function handleSelect(item) {
  emit('select', item);
}

onMounted(async () => {
  try {
    dicts.value = proxy?.dicts?.(['DC_WMS_OUT_TYPE_WMS']) || {};
  } catch (error) {
    console.error('获取出库类型字典失败', error);
  }
  // 首次加载
  onRefresh();
});

function onSearch() {
  onRefresh();
}

const listRef = ref(null);

async function onRefresh() {
  finished.value = false;
  loading.value = false;
  pageNo.value = 1;
  list.value = [];
  await nextTick();
  listRef.value?.check?.();
  onLoad();
}

async function onLoad() {
  if (finished.value) return; // 只判断 finished，别再判断 loading

  try {
    const { items, totalCount } = await fetchPage({
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      keyword: keyword.value,
    });

    // 叠加
    list.value.push(...items);

    // 记录总数（如果后端给了）
    if (Number.isFinite(totalCount)) {
      total.value = Number(totalCount);
    }

    // 结束条件更稳妥
    const hasTotal = Number.isFinite(total.value) && total.value > 0;
    const hitTotal = hasTotal ? list.value.length >= total.value : false;
    const hitTailByPage = items.length < pageSize.value;
    const firstPageEmpty = pageNo.value === 1 && items.length === 0;

    finished.value = hitTotal || hitTailByPage || firstPageEmpty;

    // 下一页
    pageNo.value += 1;
  } catch (e) {
    console.error(e);
    showFailToast('获取待确认单据失败');
    finished.value = true;
  } finally {
    // 关键：一定要在 finally 里关闭 loading / refreshing
    loading.value = false;
    if (refreshing.value) refreshing.value = false;
  }
}

/**
 * 后端兼容处理：
 * - 可能返回 { records, total, current, size }
 * - 或 { rows, total }
 * - 或 { list, total }
 * - 或 直接数组
 */
async function fetchPage({ pageNo, pageSize, keyword }) {
  const params = {
    current: pageNo,
    size: pageSize,
    outStockStatus: 'DC_WMS_OUT_STATUS_MPC',
  };

  const code = (keyword ?? '').toString().trim();
  if (code) params.outStockCode = code;

  const res = await Api.wms?.wmsOutStock?.list(params);
  const payload = res?.data ?? res;
  const respCode = payload?.code ?? res?.code ?? 200;
  const data = payload?.data ?? payload?.rows ?? payload?.records ?? payload;

  if (respCode !== 200 || !data) {
    throw new Error('请求失败');
  }

  // 归一化
  let items = [];
  let totalCount = 0;

  if (Array.isArray(data)) {
    items = data;
    totalCount = payload?.total ?? data.length; // 无 total 时用本页长度推断
  } else if (data?.records) {
    items = data.records ?? [];
    totalCount = Number(data.total ?? items.length);
  } else if (data?.rows) {
    items = data.rows ?? [];
    totalCount = Number(data.total ?? items.length);
  } else if (data?.list) {
    items = data.list ?? [];
    totalCount = Number(data.total ?? items.length);
  } else {
    // 兜底：不识别结构，尝试当作数组
    items = Array.isArray(data?.data) ? data.data : [];
    totalCount = Number(data?.total ?? items.length);
  }

  return {
    items,
    totalCount,
    pageCount: Math.ceil((totalCount || 0) / pageSize) || 0,
  };
}
</script>

<style lang="scss" scoped>
.pending-list {
  flex: 1;
  min-height: 0;
  background: var(--dc-page-bg, #f7f8fa);

  &__search-bar {
    background: #fff;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
    padding: 12px;
  }

  &__empty {
    margin-top: 24px;
  }
}

.pending-card {
  position: relative;
  background: #fff;
  border-radius: 12px;
  padding: 12px 16px;
  margin: 12px;
  margin-bottom: 0;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
  transition: transform 0.12s ease;

  &:active {
    transform: scale(0.996);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    .title {
      font-size: 16px;
      font-weight: 600;
      color: #1d2939;
    }

    .badge {
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 999px;
      background: #f4f4f5;
      color: #475467;
      white-space: nowrap;
    }
  }

  &__body {
    margin-right: 20px;
    font-size: 13px;
    color: #475467;
    display: flex;
    flex-direction: column;
    gap: 6px;

    .row {
      display: flex;
      justify-content: space-between;
      gap: 12px;

      .label {
        color: #98a2b3;
      }

      .value {
        max-width: 60%;
        text-align: right;
        word-break: break-all;
      }
    }
  }

  &__icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #98a2b3;
  }
}
</style>
