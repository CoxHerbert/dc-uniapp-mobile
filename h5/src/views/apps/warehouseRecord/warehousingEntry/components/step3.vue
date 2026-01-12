<template>
  <van-form>
    <div class="form-group-title">基本信息</div>
    <van-cell-group inset>
      <dc-selector
        v-model="formData.inType"
        label="入库类型"
        placeholder="请点击选择入库类型"
        title="入库类型"
        :options="DC_WMS_IN_TYPE_WMS"
        disabled
      />
      <dc-select-dialog
        v-model="formData.warehouseId"
        label="仓库名称"
        placeholder="请点击选择仓库"
        object-name="warehouse"
        type="input"
        :multiple="false"
        :multiple-limit="1"
        :clearable="true"
        :disabled="show"
      />
      <dc-select-dialog
        v-if="formData.inType === 'DC_WMS_IN_TYPE_RETURN'"
        v-model="formData.inSourceNumber"
        label="来源单号"
        object-name="outboundOrder"
        type="input"
        :multiple="false"
        :multiple-limit="1"
        :clearable="true"
        :disabled="show"
        :query="{
          outStockStatus: 'DC_WMS_OUT_STATUS_BORROW',
        }"
        @change="(row) => handleWarehouseChange(row, 'outboundOrder')"
      />
      <van-field
        v-else
        v-model="formData.inSourceNumber"
        placeholder="请输入来源单号点击查询"
        readonly
      />
      <dc-select-dialog
        v-model="formData.applicantId"
        label="申请人"
        placeholder="请选择"
        object-name="user"
        :multiple="false"
        disabled
      />
      <dc-select-dialog
        v-model="formData.processingPersonnel"
        label="处理人"
        placeholder="请选择"
        object-name="user"
        :multiple="false"
        disabled
      />
    </van-cell-group>
    <div class="form-group-title">入库明细</div>
    <div v-for="(item, index) in formData.detailList || []" :key="index" class="card__meta">
      <div class="row">
        <span class="label">物料名称</span>
        <span class="value">
          {{ item.productName || '-' }}
        </span>
      </div>
      <div class="row">
        <span class="label">物料编码</span>
        <span class="value">
          {{ item.productCode || '-' }}
        </span>
      </div>
      <div class="row">
        <span class="label">规格型号</span>
        <span class="value">
          {{ item.productSpec || '-' }}
        </span>
      </div>
      <div class="row">
        <span class="label">数量</span>
        <span class="value">
          {{ item.productQty ?? '-' }}
        </span>
      </div>
      <div class="row">
        <span class="label">单位</span>
        <span class="value">
          {{ item.productUnit || '-' }}
        </span>
      </div>
      <div class="row">
        <span class="label">仓位编号</span>
        <span class="value"
          ><dc-view
            v-model="item.locationId"
            object-name="warehouseLocation"
            show-key="locationName"
        /></span>
      </div>
    </div>
    <div class="form-itme-btn">
      <van-button size="small" block @click="cancelSubmit">返回</van-button>
    </div>
  </van-form>
</template>

<script setup name="customerSubmit">
import { reactive, toRefs, getCurrentInstance, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

const { proxy } = getCurrentInstance();
const router = useRouter();
const { DC_WMS_IN_TYPE_WMS } = proxy.dicts(['DC_WMS_IN_TYPE_WMS']);
const props = defineProps({
  // 详情
  info: {
    type: Object,
    default: {},
  },
});
const pageData = reactive({
  loading: false,
  rules: {},
  formData: {},
  show: true,
  btnOpen: false,
});

const { loading, rules, formData, show, btnOpen } = toRefs(pageData);
const inTypeLabel = computed(() => {
  const list = DC_WMS_IN_TYPE_WMS?.value || [];
  const hit = list.find((item) => item.dictKey === formData.value.inType);
  return hit?.dictValue || '';
});

onMounted(() => {
  formData.value = props.info;
});

const cancelSubmit = () => {
  router.push({ name: 'appsWarehousingEntry' });
};
</script>
<style lang="scss" scoped>
.form-group-title {
  font-weight: 600;
  color: #303133;
  margin: 16px 4px 12px;
  font-size: 15px;
}
:deep(.van-cell-group) {
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  margin: 0;
}
:deep(.van-cell-group--inset) {
  margin: 0;
}
:deep(.van-cell) {
  padding-left: 12px;
  padding-right: 12px;
}
.form-itme-btn {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #fff;
}
.card__meta {
  margin-top: 8px;
  color: #666;
  font-size: 13px;
  background-color: #fff;
  border-radius: 8px;
  padding: 10px;
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
</style>
