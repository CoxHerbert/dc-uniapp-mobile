<template>
  <div class="page inbound-order-detail">
    <van-nav-bar ref="navRef" title="入库单详情" left-arrow @click-left="goBack" />

    <!-- 加载态 -->
    <div v-if="loading" class="page-body">
      <van-skeleton title :row="6" />
    </div>

    <!-- 详情 -->
    <div v-else-if="order" class="page-body">
      <!-- 基本信息 -->
      <div class="section section--info">
        <div class="section__header">
          <h3>基本信息</h3>
          <van-tag :type="status.type" round>{{ status.label }}</van-tag>
        </div>

        <div class="kv-list kv-list--info">
          <div class="kv-item">
            <div class="kv-label">入库单号</div>
            <div class="kv-value mono">{{ order.inStockCode || '-' }}</div>
          </div>

          <div class="kv-item">
            <div class="kv-label">来源单号</div>
            <div class="kv-value mono">{{ order.inStockNumber || '-' }}</div>
          </div>

          <div class="kv-item">
            <div class="kv-label">仓库</div>
            <div class="kv-value">
              <!-- 保留 dc-view（仓库可能是ID或对象/名称） -->
              <dc-view
                :value="order.warehouse || order.warehouseId || order.warehouseName"
                object-name="warehouse"
              />
            </div>
          </div>

          <div class="kv-item">
            <div class="kv-label">处理人</div>
            <div class="kv-value">
              <!-- 保留 dc-view（优先用ID，其次名称） -->
              <dc-view
                :value="
                  order.processingPersonnel ||
                  order.processingPersonnelId ||
                  order.processingPersonnelName
                "
                object-name="user"
              />
            </div>
          </div>

          <div class="kv-item">
            <div class="kv-label">申请人</div>
            <div class="kv-value">
              <!-- 保留 dc-view -->
              <dc-view
                :value="order.applicant || order.applicantId || order.applicantName"
                object-name="user"
              />
            </div>
          </div>

          <div class="kv-item">
            <div class="kv-label">登记时间</div>
            <div class="kv-value">{{ order.createTime || '-' }}</div>
          </div>

          <div class="kv-item">
            <div class="kv-label">备注</div>
            <div class="kv-value">{{ order.remark || '-' }}</div>
          </div>
        </div>
      </div>

      <!-- 入库明细 -->
      <div class="section section--details">
        <div class="section__header">
          <h3>入库明细</h3>
          <div class="section__meta">
            <span class="pill">共 {{ order.detailList?.length ?? 0 }} 条</span>
          </div>
        </div>

        <div
          v-for="(item, index) in order.detailList"
          :key="item.id ?? item.productCode ?? index"
          class="detail-card"
        >
          <div class="detail-card__header">
            <span class="index">#{{ index + 1 }}</span>
          </div>

          <div class="kv-list kv-list--detail">
            <div class="kv-item">
              <div class="kv-label">物料编号</div>
              <div class="kv-value mono">{{ item.productCode || '-' }}</div>
            </div>
            <div class="kv-item">
              <div class="kv-label">物料名称</div>
              <div class="kv-value mono">{{ item.productName || '-' }}</div>
            </div>
            <div class="kv-item">
              <div class="kv-label">规格型号</div>
              <div class="kv-value">{{ item.productSpec || '-' }}</div>
            </div>
            <div class="kv-item">
              <div class="kv-label">数量</div>
              <div class="kv-value qty">{{ item.productQty ?? '-' }}</div>
            </div>
            <div class="kv-item">
              <div class="kv-label">单位</div>
              <div class="kv-value">{{ item.productUnit || '-' }}</div>
            </div>
            <div class="kv-item">
              <div class="kv-label">仓位编码</div>
              <div class="kv-value mono">{{ item.locationCode || '-' }}</div>
            </div>

            <div v-if="item.remark" class="kv-item">
              <div class="kv-label">备注</div>
              <div class="kv-value">{{ item.remark }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空态 / 错误 -->
    <div v-else class="page-empty">
      <van-empty :description="emptyDesc">
        <van-space>
          <van-button round type="primary" @click="fetchDetail">重试</van-button>
          <van-button round @click="goBack">返回</van-button>
        </van-space>
      </van-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Api from '@/api/index';
import { getInStockStatusMeta } from './constants';
import { goBackOrHome } from '@/utils/navigation';

const status = computed(() => getInStockStatusMeta(order.value?.inStockStatus));

const route = useRoute();
const router = useRouter();

const order = ref(null);
const loading = ref(false);
const loadError = ref(null);

const emptyDesc = computed(() => (loadError.value ? '加载失败' : '未找到入库单'));
const goBack = () => {
  goBackOrHome(router);
};

/** 规范化：detailList 兜底为数组 */
const normalize = (d) => ({
  ...d,
  detailList: Array.isArray(d?.detailList) ? d.detailList : [],
});

/** 拉取详情 */
const fetchDetail = async () => {
  const id = route.params.id;
  loading.value = true;
  loadError.value = null;
  order.value = null;
  try {
    const res = await Api.application.inventoryDetail({ id });
    const { code, data } = res?.data || {};
    if (code !== 200 || !data) throw new Error('接口返回异常');
    order.value = normalize(data);
  } catch (err) {
    loadError.value = err?.message || '请求失败';
  } finally {
    loading.value = false;
  }
};
onMounted(fetchDetail);
watch(
  () => route.params.id,
  (n, o) => {
    if (n !== o) fetchDetail();
  }
);
</script>

<style lang="scss" scoped>
/* ====== Tokens：紧凑间距 + 放大字体 ====== */
$bg-page: #f7f8fa;
$card-bg: #ffffff;
$radius: 12px;
$shadow-sm: 0 3px 14px rgba(0, 0, 0, 0.06);
$divider: #eceef1;

$text-1: #1f2329; // 标题
$text-2: #22262c; // 正文（更深）
$text-3: #7a8088; // 次级
$text-mono: #111827;

$accent: #d05507;
$chip-bg: linear-gradient(135deg, #ffedd5, #ffe4d5);

/* 字体放大，但保持紧凑的行高与间距 */
$fs-title: 19px; // 区块标题
$fs-label: 15px; // 键名
$fs-value: 17px; // 键值
$fs-value-lg: 19px; // 强调值（数量等）
$lh: 1.35; // 稍紧凑的行高

/* 标签列保持适中，避免行内过早换行 */
$label-w: 84px;

/* ====== Layout（紧凑外边距/内边距，字号更大） ====== */
.page {
  min-height: 100vh;
  background: $bg-page;

  .page-body {
    padding: 18px 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .section {
    background: $card-bg;
    border-radius: $radius;
    padding: 10px 10px 8px;
    box-shadow: $shadow-sm;

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;

      h3 {
        margin: 0;
        font-size: $fs-title;
        font-weight: 800;
        color: $text-1;
        line-height: $lh;
        letter-spacing: 0.2px;
      }

      :deep(.van-tag) {
        padding: 4px 12px;
        font-size: 12px;
        border-radius: 999px;
        background: $chip-bg;
        color: $accent;
        border: 0;
      }

      .section__meta .pill {
        font-size: 12px;
        background: #f4f5f7;
        padding: 2px 8px;
        border-radius: 999px;
        color: $text-3;
      }
    }
  }

  /* ====== 横向键值对（紧凑 spacing + 大字号） ====== */
  .kv-list {
    border: 1px solid $divider;
    border-radius: 10px;
    overflow: hidden;
    background: #fff;

    .kv-item {
      display: grid;
      grid-template-columns: $label-w 1fr;
      gap: 6px;
      padding: 8px 10px;
      align-items: baseline;

      &:not(:last-child) {
        border-bottom: 1px solid $divider;
      }

      .kv-label {
        font-size: $fs-label;
        color: $text-3;
        line-height: $lh;
        white-space: nowrap;
      }
      .kv-value {
        font-size: $fs-value;
        color: $text-2;
        line-height: $lh;
        word-break: break-word;

        &.mono {
          font-family:
            ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
          color: $text-mono;
          letter-spacing: 0.2px;
        }
        &.qty {
          font-size: $fs-value-lg;
          font-weight: 800;
          color: $accent;
        }
      }
    }
  }

  .kv-list--detail .kv-item {
    background: linear-gradient(180deg, rgba(255, 247, 240, 0.28) 0%, rgba(255, 255, 255, 1) 100%);
  }

  .detail-card {
    background: $card-bg;
    border-radius: $radius;
    padding: 10px;
    margin-bottom: 10px;
    box-shadow: $shadow-sm;

    &__header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 6px;

      .index {
        font-weight: 700;
        font-size: 12.5px;
        color: $accent;
        background: #fff3e8;
        border: 1px solid #ffe3cc;
        padding: 2px 8px;
        border-radius: 999px;
        line-height: $lh;
      }

      .material {
        font-size: 17px;
        color: $text-1;
        font-weight: 800;
        max-width: 72%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: right;
        line-height: $lh;
      }
    }
  }

  .page-empty {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

/* 小屏适配：略收窄标签列 */
@media (max-width: 360px) {
  .page .kv-list .kv-item {
    grid-template-columns: 76px 1fr;
  }
}
</style>
