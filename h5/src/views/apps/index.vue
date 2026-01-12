<template>
  <div class="dc-apps page">
    <van-nav-bar :title="t('routes.apps')" />

    <!-- 搜索区 -->
    <div class="dc-apps__search">
      <div class="dc-apps__search-card">
        <van-search
          v-model="keyword"
          placeholder="搜索功能"
          shape="round"
          clearable
          :show-action="false"
        />
        <div v-if="keyword" class="dc-apps__search-tip">找到 {{ totalFound }} 个结果</div>
      </div>
    </div>

    <div class="dc-apps__content">
      <div v-for="group in filteredGroups" :key="group.key" class="dc-apps__group">
        <div class="dc-apps__group-title">
          <span class="dc-apps__group-dot"></span>
          <span>{{ group.title }}</span>
        </div>

        <van-grid class="dc-apps__grid" :column-num="4" :gutter="12" clickable :border="false">
          <van-grid-item
            v-for="app in group.items"
            :key="app.routeName || app.url || app.label"
            :to="getAppTo(app)"
            style="padding: 0"
            @click="handleClick(app)"
          >
            <template #icon>
              <img
                :src="withBase(app.icon)"
                :alt="app.label"
                class="dc-apps__icon"
                loading="lazy"
              />
            </template>
            <template #text>
              <span class="dc-apps__label">{{ app.label }}</span>
            </template>
          </van-grid-item>
        </van-grid>
      </div>

      <!-- 无结果 -->
      <van-empty v-if="filteredGroups.length === 0" description="没有匹配的功能" image="search" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { withBase } from '@/utils/util';

const { t } = useI18n();

const keyword = ref('');

/**
 * 规则：
 * - 有 url 就外链新开；
 * - 否则若有 routeName 交给 :to 处理；
 * - 两者都没有则不跳。
 */
const handleClick = (app) => {
  if (app?.url) {
    window.open(app.url, '_blank', 'noopener,noreferrer');
  }
};

const getAppTo = (app) => {
  if (app?.url) return undefined;
  if (app?.routeName) return { name: app.routeName };
  return undefined;
};

/**
 * 功能分类
 */
const appGroups = [
  {
    key: 'flow',
    title: '流程与报表',
    items: [
      { label: '流程中心', icon: '/images/apps/流程中心.svg', routeName: 'home' },
      {
        label: '料况跟进',
        icon: '/images/apps/料况跟进.svg',
        routeName: 'appsMaterialTracking',
        url: 'http://board.eastwinsz.com:8022/webroot/decision/view/report?viewlet=DC%252Fphone%252Fsuplier.cpt&username=',
      },
    ],
  },
  {
    key: 'wms',
    title: 'WMS',
    items: [
      // 原 WMS
      { label: '入库单', icon: '/images/apps/入库单.svg', routeName: 'appsInboundOrder' },
      { label: '自助出库', icon: '/images/apps/自助出库.svg', routeName: 'appsSelfOutbound' },
      {
        label: '确认领料',
        icon: '/images/apps/确认领料.svg',
        routeName: 'appsPickingConfirmation',
      },

      // 原 质量检验（并入 WMS）
      {
        label: '线材质检入库',
        icon: '/images/apps/线材质检.svg',
        routeName: 'appsWireInspectionSubmit',
      },
      {
        label: '线材质检出库',
        icon: '/images/apps/线材质检.svg',
        routeName: 'appsWireOutspectionList',
      },

      // 原 工具借还（并入 WMS）
      {
        label: '装配工具借用',
        icon: '/images/apps/装配工具借用.svg',
        routeName: 'appsWarehouseRecord',
      },
      {
        label: '装配工具归还',
        icon: '/images/apps/装配工具归还.svg',
        routeName: 'appsWarehousingEntry',
      },
    ],
  },
  {
    key: 'production',
    title: '生产与计划',
    items: [
      // { label: '现场计划单', icon: '/images/apps/现场计划单.svg', routeName: 'appsSitePlanning' },
      { label: '工时汇报', icon: '/images/apps/工时汇报.svg', routeName: 'appsWorkReport' },
      { label: '工序外发', icon: '/images/apps/工序外发.svg', routeName: 'appsOutSourcing' },
      // {
      //   label: '外协核价',
      //   icon: '/images/apps/外协核价.svg',
      //   routeName: 'appsOutsourcingQuotation',
      // },
    ],
  },
  {
    key: 'masterData',
    title: '基础资料',
    items: [
      {
        label: '物料信息维护',
        icon: '/images/apps/物料信息维护.svg',
        routeName: 'appsMaterialMaintenance',
      },
      { label: '铭牌绑定', icon: '/images/apps/名牌绑定.svg', routeName: 'appsNameplateBinding' },
    ],
  },
];

/**
 * 过滤：按 label 匹配，自动隐藏空分类
 */
const filteredGroups = computed(() => {
  const key = (keyword.value || '').trim().toLowerCase();
  if (!key) return appGroups;

  return appGroups
    .map((g) => {
      const items = (g.items || []).filter((app) => (app.label || '').toLowerCase().includes(key));
      return { ...g, items };
    })
    .filter((g) => g.items.length > 0);
});

/** 统计结果数 */
const totalFound = computed(() => {
  return filteredGroups.value.reduce((sum, g) => sum + (g.items?.length || 0), 0);
});
</script>

<style lang="scss" scoped>
.dc-apps {
  --dc-page-bg: #f7f8fa;
  --dc-card-bg: #ffffff;
  --dc-text: #323233;
  --dc-radius: 16px;

  min-height: 100vh;
  background: var(--dc-page-bg);

  &__search {
    padding: 12px 12px 0 12px;
    box-sizing: border-box;

    :deep(.van-search) {
      padding: 0;
      background: transparent;
    }

    :deep(.van-search__content) {
      border-radius: 999px;
      background: #fff; /* ✅ 搜索输入框白底 */
    }
  }

  /* ✅ 搜索栏白底卡片容器 */
  &__search-card {
    background: var(--dc-card-bg);
    border-radius: var(--dc-radius);
    padding: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  }

  &__search-tip {
    font-size: 12px;
    color: #8b8f97;
    padding: 8px 4px 0 4px;
  }

  &__content {
    padding: 16px;
    box-sizing: border-box;
    padding-bottom: 150px;
  }

  &__group {
    margin-bottom: 14px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__group-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 700;
    color: #2b2f36;
    padding: 4px 4px 10px 4px;
  }

  &__group-dot {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: #3b82f6;
    display: inline-block;
  }

  :deep(.van-grid-item),
  :deep(.van-grid-item__content) {
    padding: 0;
  }

  &__grid {
    background: var(--dc-card-bg);
    border-radius: var(--dc-radius);
    padding: 12px 0;

    :deep(.van-grid-item__content) {
      border-radius: 12px;
      transition:
        transform 0.12s ease,
        box-shadow 0.12s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
      }

      &:active {
        transform: translateY(0);
        box-shadow: none;
      }
    }
  }

  &__icon {
    width: 48px;
    height: 48px;
    display: block;
    margin: 0 auto;
  }

  &__label {
    font-size: 13px;
    font-weight: 500;
    color: #585b61;
  }
}
</style>
