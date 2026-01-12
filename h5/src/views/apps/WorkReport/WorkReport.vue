<template>
  <div class="work-report page">
    <van-nav-bar title="工时汇报" left-arrow @click-left="handleBack" />

    <div class="work-report__content">
      <!-- 搜索 + 扫码（不吸顶） -->
      <div class="work-report__search-card">
        <DcSearchBar
          v-model="snCode"
          placeholder="请输入SN码查询"
          button-text="搜索"
          background="transparent"
          @search="handleSearch"
        />
      </div>

      <!-- Tabs：不吸顶 -->
      <van-tabs
        v-model:active="activeTab"
        class="work-report__tabs work-report__tabs--card"
        swipeable
        color="#3060ED"
        title-active-color="#3060ED"
        :line-height="2"
      >
        <van-tab title="专案详情" name="detail">
          <ProjectOverview :plan-info="planInfo" :color-enum="colorEnum" @jump="handleJump" />
        </van-tab>

        <van-tab title="填报工时" name="report">
          <div class="work-report__list">
            <template v-if="workRoutes.length">
              <WorkRouteCard
                v-for="route in workRoutes"
                :key="route.produceRouteId"
                :route="route"
                @toggle-complete="updateRouteComplete"
                @change-report-hour="updateReportHour"
                @change-report-qty="updateReportQty"
              />
            </template>
            <van-empty v-else description="暂无数据" />
          </div>
        </van-tab>
      </van-tabs>
    </div>
    <div v-if="activeTab === 'report'" class="work-report__footer">
      <van-button type="primary" block @click="handleSubmit">
        <van-icon name="passed" size="18" /> 提交
      </van-button>
    </div>
    <van-back-top bottom="60" />
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { showFailToast, showLoadingToast, showSuccessToast } from 'vant';
import Api from '@/api';
import ProjectOverview from './components/ProjectOverview.vue';
import WorkRouteCard from './components/WorkRouteCard.vue';
import { goBackOrHome } from '@/utils/navigation';
import DcSearchBar from '@/components/dc-ui/components/SearchBar/index.vue';

const router = useRouter();

const snCode = ref('');
const activeTab = ref('detail');
const planInfo = reactive({});
const workRoutes = ref([]);

// 颜色枚举
const colorEnum = {
  延期: '#e12137',
  完成: 'green',
  进行中: '#1d65f3',
};

const hasRouteData = computed(() =>
  workRoutes.value.some((route) => (route.children || []).length)
);

// 数据重置
const resetData = () => {
  Object.keys(planInfo).forEach((key) => delete planInfo[key]);
  workRoutes.value = [];
};

// 接口
const fetchPlanId = async (sn) => {
  const { code, data, message } = await Api.application.workReport.plan.getPlanId({
    sn,
  });
  if (code === 200) {
    return data;
  }
  throw new Error(message || '查询失败');
};

const fetchPlanDetail = async (planId) => {
  const [planRes, detailRes] = await Promise.all([
    Api.application.workReport.plan.getPlanDetail({ id: planId }),
    Api.application.workReport.wksr.planDetail({ planId }),
  ]);
  if (planRes.code === 200 && planRes.data) {
    Object.assign(planInfo, planRes.data || {});
  }
  if (detailRes.code === 200 && Array.isArray(detailRes.data)) {
    const grouped = [];
    detailRes.data.forEach((item) => {
      const target = grouped.find((route) => route.produceRouteId === item.produceRouteId);
      const child = {
        ...item,
        reportHour: item.reportHour ?? 0,
        reportQty: item.reportQty ?? 0,
      };
      if (!target) {
        grouped.push({
          produceRouteId: item.produceRouteId,
          produceRouteName: item.produceRouteName,
          isComplete: item.isComplete,
          children: [child],
        });
      } else {
        target.children.push(child);
      }
    });
    workRoutes.value = grouped;
  } else {
    workRoutes.value = [];
  }
};

// 事件
const handleSearch = async (value) => {
  const normalized = (value ?? snCode.value).toString().trim();
  if (!normalized) {
    showFailToast('请输入需要查询的SN码');
    return;
  }
  snCode.value = normalized;
  activeTab.value = 'detail';
  resetData();
  const toast = showLoadingToast({ message: '加载中…', duration: 0, forbidClick: true });
  try {
    const planId = await fetchPlanId(normalized);
    if (!planId) {
      showFailToast('未找到相关专案');
      return;
    }
    await fetchPlanDetail(planId);
  } catch (error) {
    showFailToast(error?.message || '查询失败');
  } finally {
    toast.close();
  }
};

const updateRouteComplete = ({ routeId, value }) => {
  const route = workRoutes.value.find((item) => item.produceRouteId === routeId);
  if (route) {
    route.isComplete = value ? 1 : 0;
  }
};

const findMaterial = (routeId, materialId) => {
  const route = workRoutes.value.find((item) => item.produceRouteId === routeId);
  if (!route) return null;
  return route.children?.find((child) => child.id === materialId) || null;
};

const updateReportHour = ({ routeId, materialId, value }) => {
  const target = findMaterial(routeId, materialId);
  if (target) {
    target.reportHour = Number(value) || 0;
  }
};

const updateReportQty = ({ routeId, materialId, value }) => {
  const target = findMaterial(routeId, materialId);
  if (target) {
    target.reportQty = Number(value) || 0;
  }
};

const hourToSecond = (hours, precision = 0) => {
  const value = Number(hours) || 0;
  const seconds = value * 3600;
  if (precision <= 0) return Math.round(seconds);
  const factor = 10 ** precision;
  return Math.round(seconds * factor) / factor;
};

const handleSubmit = async () => {
  if (!snCode.value.trim()) {
    showFailToast('请先查询SN码');
    return;
  }
  if (!hasRouteData.value) {
    showFailToast('无可提交数据');
    return;
  }

  const payload = workRoutes.value.flatMap((route) =>
    (route.children || []).map((child) => ({
      ...child,
      isComplete: route.isComplete,
      reportHour: hourToSecond(child.reportHour, 3),
    }))
  );

  if (!payload.length) {
    showFailToast('无可提交数据');
    return;
  }

  const loadingToast = showLoadingToast({ message: '提交中…', duration: 0, forbidClick: true });

  try {
    const res = await Api.application.workReport.wksr.reportSave(payload);

    // 先关闭 loading
    loadingToast?.close?.();

    if (res.code === 200) {
      snCode.value = '';
      resetData();
      showSuccessToast('保存成功');
    } else {
      showFailToast({ message: res?.message || '提交失败', duration: 3000 });
    }
  } catch (error) {
    console.log(error);

    // 先关闭 loading
    loadingToast?.close?.();

    showFailToast({ message: error?.message || '提交失败', duration: 6000 });
  }
};

const handleJump = (billNumber) => {
  if (!billNumber) return;
  router.push({
    name: 'appsWorkReportMissingMaterial',
    query: { billNumber },
  });
};

const handleBack = () => {
  goBackOrHome(router);
};
</script>

<style scoped lang="scss">
.work-report {
  --nav-h: 62px;
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: calc(80px + var(--van-safe-area-bottom, 0px));
  box-sizing: border-box;

  &__content {
    padding: 8px 0 0;
    box-sizing: border-box;
  }

  /* 顶部搜索区域：方正 + 铺满 */
  .work-report__search-card {
    margin-bottom: 8px;
    padding: 10px 12px;
    background: #fff;
    border-radius: 0;
    box-shadow: none;
    border-bottom: 1px solid #ebedf0;
  }

  /* Tabs：方正 + 铺满 */
  .work-report__tabs {
    &.work-report__tabs--card {
      background: #fff;

      :deep(.van-tabs__wrap) {
        background: #fff;
        box-shadow: none;
        margin: 0;
        border-radius: 0;
      }

      :deep(.van-tabs__nav) {
        margin: 0;
        padding: 0 8px;
        border-radius: 0;
        border-bottom: 1px solid #ebedf0;
      }

      :deep(.van-tab) {
        font-size: 14px;
        line-height: 36px;
        padding: 0 8px;
      }

      :deep(.van-tabs__line) {
        height: 2px;
        background: #3060ed;
        border-radius: 0;
      }

      :deep(.van-tabs__content) {
        background: #fff;
      }

      :deep(.van-tab__pane) {
        padding: 12px 12px 16px;
        background: #fff;
        border-radius: 0;
      }
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  /* 底部提交栏：铺满 + 方正按钮 */
  &__footer {
    position: fixed;
    z-index: 10;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 10px 12px calc(10px + var(--van-safe-area-bottom, 0px));
    background: #fff;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);

    :deep(.van-button) {
      border-radius: 8px;
      font-size: 15px;
      font-weight: 500;
    }

    :deep(.van-icon) {
      margin-right: 6px;
      vertical-align: -2px;
    }
  }

  /* 空状态和返回顶部，跟铺满风格对齐 */
  :deep(.van-empty) {
    padding: 32px 0 24px;
  }

  :deep(.van-back-top) {
    right: 16px;
    bottom: calc(88px + var(--van-safe-area-bottom, 0px));
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
  }
}
</style>
