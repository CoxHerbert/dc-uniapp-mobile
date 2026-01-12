<template>
  <section v-if="hasPlan" class="project-overview">
    <div class="project-overview__card">
      <div class="project-overview__row">
        <span class="project-overview__label">专案号:</span>
        <span class="project-overview__value">{{ planInfo.mtono || '-' }}</span>
      </div>
      <div class="project-overview__row">
        <span class="project-overview__label">物料名称:</span>
        <span class="project-overview__value">{{ planInfo.materialCode || '-' }}</span>
      </div>
      <div class="project-overview__row">
        <span class="project-overview__label">数量:</span>
        <span class="project-overview__value">{{ quantityLabel }}</span>
      </div>
    </div>

    <div v-if="Array.isArray(planInfo.milestones) && planInfo.milestones.length" class="project-overview__table">
      <div class="project-overview__table-row project-overview__table-row--head">
        <span>阶段</span>
        <span>负责人</span>
        <span>结束时间</span>
        <span>完成状态</span>
        <span>进度</span>
      </div>
      <div
        v-for="item in planInfo.milestones"
        :key="item.id || `${item.nodeName}-${item.personInCharheName}`"
        class="project-overview__table-row"
      >
        <span>{{ item.nodeName || '-' }}</span>
        <span>{{ item.personInCharheName || '-' }}</span>
        <span>{{ item.endTime || '-' }}</span>
        <span :style="{ color: colorEnum[item.progress] }">{{ item.progress || '-' }}</span>
        <span>
          <button
            v-if="item.nodeName === '齐料' && item.billNumber"
            type="button"
            class="project-overview__link"
            @click="handleJump(item.billNumber)"
          >
            {{ formatPercent(item.percent) }}
            <van-icon name="arrow" />
          </button>
          <span v-else>{{ formatPercent(item.percent) }}</span>
        </span>
      </div>
    </div>
    <van-empty v-else description="暂无阶段信息" class="project-overview__empty" />
  </section>
  <van-empty v-else description="暂无专案信息" class="project-overview__empty" />
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  planInfo: {
    type: Object,
    default: () => ({}),
  },
  colorEnum: {
    type: Object,
    default: () => ({})
  },
});

const emit = defineEmits(['jump']);

const hasPlan = computed(() => Object.keys(props.planInfo || {}).length > 0);

const quantityLabel = computed(() => {
  const qty = props.planInfo?.qty;
  if (!qty && qty !== 0) return '-';
  return qty ? `x${qty}` : '-';
});

const formatPercent = (value) => {
  if (value === null || value === undefined) return '-';
  const num = Number(value);
  if (Number.isNaN(num)) return '-';
  return `${num}%`;
};

const handleJump = (billNumber) => {
  emit('jump', billNumber);
};
</script>

<style scoped lang="scss">
.project-overview {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__card {
    background: #ffffff;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__row {
    display: flex;
    font-size: 14px;
    line-height: 1.4;
    color: #323233;
  }

  &__label {
    width: 88px;
    font-weight: 600;
    color: #1f1f1f;
  }

  &__value {
    flex: 1;
    word-break: break-all;
  }

  &__table {
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }

  &__table-row {
    display: grid;
    grid-template-columns: 1.2fr 1fr 1.2fr 1fr 1fr;
    font-size: 13px;
    color: #4c4c4c;
    padding: 10px 12px;
    align-items: center;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      word-break: break-word;
    }

    &--head {
      background: #f7f8fa;
      font-weight: 600;
      color: #1f1f1f;
    }
  }

  &__link {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    background: none;
    border: none;
    color: #1989fa;
    cursor: pointer;
    font-size: 13px;
    padding: 0;
  }

  &__empty {
    margin-top: 24px;
  }
}
</style>
