<template>
  <div class="self-outbound-product-list">
    <van-cell-group inset>
      <div
        v-for="(item, index) in list"
        :key="item.locationId || item.productCode || index"
        class="self-outbound-product-list__card"
      >
        <div class="self-outbound-product-list__header">
          <span class="self-outbound-product-list__title">{{ item.itemMaterialName || '-' }}</span>
          <van-icon
            name="cross"
            class="self-outbound-product-list__remove"
            @click="emitRemove(index)"
          />
        </div>
        <div class="self-outbound-product-list__content">
          <div class="self-outbound-product-list__row">
            <span class="self-outbound-product-list__label">料品编码</span>
            <span class="self-outbound-product-list__value">{{
              item.itemMaterialNumber || '-'
            }}</span>
          </div>
          <div class="self-outbound-product-list__row">
            <span class="self-outbound-product-list__label">入库数量</span>
            <van-stepper
              v-model="item.drawQty"
              :min="0"
              :max="parseInt(item.maxDrawQty) || 999"
              integer
              @change="(value) => emitQuantityChange(index, value)"
            />
          </div>
          <div class="self-outbound-product-list__row">
            <span class="self-outbound-product-list__label">专案号</span>
            <span class="self-outbound-product-list__value">{{ item.mtoNo || '-' }}</span>
          </div>
          <div class="self-outbound-product-list__row">
            <span class="self-outbound-product-list__label">单位</span>
            <span class="self-outbound-product-list__value">{{ item.unit || '-' }}</span>
          </div>
          <div class="self-outbound-product-list__row">
            <span class="self-outbound-product-list__label">规格</span>
            <span class="self-outbound-product-list__value">{{ item.specification || '-' }}</span>
          </div>
        </div>
      </div>
    </van-cell-group>
  </div>
</template>

<script setup>
const props = defineProps({
  list: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['remove', 'quantity-change']);

const formatQty = (val) => {
  const num = Number(val);
  return Number.isNaN(num) ? 0 : num;
};

const resolveMax = (item) => {
  if (!item) return undefined;
  const max = Number(item.maxValue ?? item.productQty ?? item.qty);
  return Number.isNaN(max) ? undefined : max;
};

function emitRemove(index) {
  emit('remove', index);
}

function emitQuantityChange(index, value) {
  emit('quantity-change', { index, value: formatQty(value) });
}
</script>

<style lang="scss" scoped>
.self-outbound-product-list {
  &__card {
    background: #fff;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 6px 12px rgba(31, 35, 41, 0.05);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: #323233;
  }

  &__remove {
    color: #ff4d4f;
    font-size: 18px;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    color: #646566;
  }

  &__label {
    color: #969799;
  }

  &__value {
    color: #323233;
  }
}
</style>
