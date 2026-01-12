<template>
  <div class="work-route-card">
    <!-- 头部 -->
    <div class="work-route-card__header">
      <div class="work-route-card__title">工艺: {{ route.produceRouteName || '-' }}</div>
      <div class="work-route-card__switch">
        <span class="work-route-card__switch-label">标记完工</span>
        <van-switch
          :model-value="Boolean(route.isComplete)"
          size="20"
          @change="handleCompleteChange"
        />
      </div>
    </div>

    <!-- 主体 -->
    <div class="work-route-card__body">
      <div
        v-for="material in route.children || []"
        :key="material.id"
        class="work-route-card__group"
      >
        <div class="work-route-card__group-header">
          <div class="work-route-card__group-title">
            {{ material.materialName || '-' }}
          </div>
          <div class="work-route-card__group-tag">计划单号 {{ material.billNumber || '-' }}</div>
        </div>

        <div class="work-route-card__info">
          <div class="work-route-card__row">
            <span class="work-route-card__label">工时统计</span>
            <span class="work-route-card__value">
              {{ formatHour(material.reportWorkingHours) }}/{{
                formatHour(material.processTime)
              }}
              时
            </span>
          </div>
          <div class="work-route-card__row">
            <span class="work-route-card__label">数量工时</span>
            <span class="work-route-card__value">
              {{ toNumber(material.reportNumber) }}/{{ toNumber(material.number) }} 个
            </span>
          </div>
        </div>

        <!-- 编辑区：工时 / 数量 各占一行 -->
        <div class="work-route-card__edit">
          <div class="work-route-card__field">
            <span class="work-route-card__field-label">工时</span>
            <van-stepper
              :model-value="material.reportHour"
              :min="0"
              :step="0.1"
              :decimal-length="3"
              @change="(value) => handleHourChange(material.id, value)"
            />
          </div>
          <div class="work-route-card__field">
            <span class="work-route-card__field-label">数量</span>
            <van-stepper
              integer
              :model-value="material.reportQty"
              :min="0"
              :max="Math.max(toNumber(material.number) - toNumber(material.reportNumber), 0)"
              @change="(value) => handleQtyChange(material.id, value)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  route: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['toggle-complete', 'change-report-hour', 'change-report-qty']);

const formatHour = (seconds) => {
  const value = Number(seconds);
  if (!value) return '0';
  const hours = value / 3600;
  if (!Number.isFinite(hours)) return '0';
  return Number(hours.toFixed(2)).toString();
};

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const handleCompleteChange = (value) => {
  emit('toggle-complete', { routeId: props.route?.produceRouteId, value });
};

const handleHourChange = (materialId, value) => {
  emit('change-report-hour', { routeId: props.route?.produceRouteId, materialId, value });
};

const handleQtyChange = (materialId, value) => {
  emit('change-report-qty', { routeId: props.route?.produceRouteId, materialId, value });
};
</script>

<style scoped lang="scss">
.work-route-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 14px 14px 12px;
  box-shadow: 0 6px 18px rgba(15, 35, 95, 0.06);
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid #f2f3f5;
  position: relative;
  overflow: hidden;

  /* 顶部彩色条 */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(180deg, #1677ff, #6aa3ff);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 8px;
    border-bottom: 1px solid #f4f5f7;
  }

  &__title {
    font-weight: 600;
    font-size: 15px;
    color: #1f1f1f;
    display: flex;
    align-items: center;
    gap: 6px;

    /* 左侧小圆点 */
    &::before {
      content: '';
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #1677ff;
    }
  }

  &__switch {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 999px;
    background: #f5f7ff;
  }

  &__switch-label {
    font-size: 12px;
    color: #646566;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__group {
    border-radius: 12px;
    padding: 10px 10px 8px;
    background: linear-gradient(135deg, #f8fbff 0%, #fdfbff 100%);
    border: 1px solid #eef2ff;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }

  &__group-title {
    font-size: 14px;
    font-weight: 600;
    color: #1f1f1f;
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  &__group-tag {
    flex-shrink: 0;
    max-width: 60%;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(22, 119, 255, 0.08);
    font-size: 11px;
    color: #29579d;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  &__info {
    padding: 4px 0 2px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__row {
    display: flex;
    align-items: center;
    font-size: 13px;
    line-height: 1.5;
  }

  &__label {
    flex-shrink: 0;
    min-width: 64px;
    margin-right: 6px;
    font-weight: 500;
    color: #303133;
  }

  &__value {
    flex: 1;
    word-break: break-all;
    text-align: right;
    color: #606266;
  }

  /* 编辑区：纵向排列，每个字段独占一行 */
  &__edit {
    margin-top: 6px;
    padding-top: 8px;
    border-top: 1px dashed #e4e7ed;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__field {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;

    /* 本卡片中 stepper 的样式 */
    :deep(.van-stepper) {
      justify-content: flex-end;
      flex-shrink: 0;
      margin-left: auto;
    }

    /* 放大输入框宽度，让一行看起来更舒展 */
    :deep(.van-stepper__input) {
      width: 110px; /* 不够可以再调大，比如 120 / 130 */
      padding: 0 8px;
      font-size: 13px;
    }
  }

  &__field-label {
    font-size: 13px;
    color: #303133;
    white-space: nowrap;
  }
}
</style>
