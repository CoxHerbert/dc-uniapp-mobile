<template>
  <div class="wrap-box">
    <!-- 移动端：顶部横向步骤条，减少占高 -->
    <van-steps :active="step" direction="horizontal">
      <van-step v-for="(d, index) in dictData" :key="index">{{ d.label }}</van-step>
    </van-steps>

    <step1 v-if="steps2 === 0" :info="info" @out-stock-type-change="handleOutStockTypeChange" />
    <step2
      v-if="steps2 === 1"
      :info="info"
      @out-stock-type-change="handleOutStockTypeChange"
      @detail="getDetail"
    />
    <step3
      v-if="steps2 === 2"
      :info="info"
      @out-stock-type-change="handleOutStockTypeChange"
      @detail="getDetail"
    />
    <OutboundReadonlyStep
      v-if="steps2 === 3"
      :info="info"
      @out-stock-type-change="handleOutStockTypeChange"
    />
    <OutboundReadonlyStep
      v-if="steps2 === 4"
      :info="info"
      @out-stock-type-change="handleOutStockTypeChange"
    />
    <OutboundReadonlyStep
      v-if="steps2 === 5"
      :info="info"
      @out-stock-type-change="handleOutStockTypeChange"
    />
  </div>
</template>

<script setup name="CustomerSubmit">
import { reactive, toRefs, onBeforeMount, computed, getCurrentInstance } from 'vue';
import step1 from './components/step1.vue';
import step2 from './components/step2.vue';
import step3 from './components/step3.vue';
import OutboundReadonlyStep from './components/OutboundReadonlyStep.vue';
import { useRoute } from 'vue-router';
import Api from '@/api/index';
import { showToast } from 'vant';

const route = useRoute();

const { proxy } = getCurrentInstance();

// 数据字典
const { DC_WMS_OUT_STATUS } = proxy.dicts(['DC_WMS_OUT_STATUS']);

const dictData = computed(() => {
  let dcWmsOutStatus = DC_WMS_OUT_STATUS.value;
  if (info.value.outStockType === 'DC_WMS_OUT_TYPE_BORROW') {
    return dcWmsOutStatus.filter((item) => item.value !== 'DC_WMS_OUT_STATUS_RETURN');
  } else {
    return dcWmsOutStatus.slice(0, 4);
  }
});

const pageData = reactive({
  loading: false,
  step: 0,
  pageId: null,
  steps: [],
  info: {},
});

const { loading, step, pageId, info } = toRefs(pageData);

const steps2 = computed(() => {
  if (route.params.id !== 'create') {
    step.value = 0;
    pageId.value = route.params.id;
    // 借用出库类型特殊处理 - 增加待归还和已归还状态
    // 判断是否为借用出库类型（领用出库）

    // 其他出库类型保持原有逻辑
    if (info.value.outStockStatus == 'DC_WMS_OUT_STATUS_PM') {
      step.value = 1;
    }
    if (info.value.outStockStatus === 'DC_WMS_OUT_STATUS_MPC') {
      step.value = 2;
    }
    if (info.value.outStockStatus === 'DC_WMS_OUT_STATUS_C') {
      step.value = 3;
    }
    // if (info.value.outStockStatus === 'DC_WMS_OUT_TYPE_BOM') {
    //   step.value = 4;
    // }
    if (info.value.outStockStatus === 'DC_WMS_OUT_STATUS_BORROW') {
      step.value = 4;
    }
    if (info.value.outStockStatus === 'DC_WMS_OUT_STATUS_RETURN') {
      step.value = 5;
    }
  }
  return step.value;
});

onBeforeMount(() => {
  pageId.value = route.params.id;
  if (route.params.id !== 'create') getDetail();
});

const getDetail = async () => {
  try {
    loading.value = true;
    const res = await Api.application.outboundOrder.detail({ id: pageId.value });
    const { code, msg, data } = res.data;
    if (code === 200) {
      info.value = data;
    } else {
      showToast({ type: 'warning', message: msg });
    }
    loading.value = false;
  } catch (err) {
    loading.value = false;
  }
};

// 处理出库类型变化
const handleOutStockTypeChange = (newOutStockType) => {
  info.value.outStockType = newOutStockType;
};
</script>

<style lang="scss" scoped>
.wrap-box {
  padding: 16px;
  min-height: 100vh;
  background: #f5f7fb;
}

/* 顶部步骤条：卡片样式 */
:deep(.van-steps) {
  margin-bottom: 12px;
  border-radius: 12px;
  padding: 12px 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

/* 步骤标题更适合小屏 */
:deep(.van-step__title) {
  font-size: 12px;
  line-height: 16px;
  word-break: break-all;
}

/* 可选：让步骤条吸顶（体验更好） */
/* :deep(.van-steps) {
  position: sticky;
  top: 0;
  z-index: 10;
} */
</style>
