<template>
  <van-form ref="ruleFormRef">
    <div class="form-group-title">基本信息</div>
    <van-cell-group inset>
      <dc-selector
        v-model="formData.outStockType"
        label="出库类型"
        placeholder="请点击选择出库类型"
        title="出库类型"
        :options="DC_WMS_OUT_TYPE_WMS"
        disabled
      />

      <dc-select-dialog
        v-model="formData.warehouseId"
        placeholder="请点击选择仓库"
        label="仓库名称"
        object-name="warehouse"
        type="input"
        return-type="string"
        :multiple="false"
        :multiple-limit="1"
        :clearable="true"
        :query="{
          stockType: getStockType(formData.outStockType),
        }"
        disabled
        @change="(val) => handleWarehouseChange(val)"
        @init="(val) => handleWarehouseChange(val)"
      />
      <dc-select-dialog
        v-model="formData.applicantId"
        label="申请人"
        placeholder="请选择"
        object-name="user"
        :multiple="false"
        return-type="string"
      />

      <dc-select-dialog
        v-model="formData.processingPersonnel"
        label="处理人"
        placeholder="请选择"
        object-name="user"
        :multiple="false"
        return-type="string"
        disabled
      />

      <van-field
        v-model="formData.remark"
        label="备注"
        type="textarea"
        rows="2"
        placeholder="请输入备注"
      />

      <van-field
        v-if="formData.reject"
        v-model="formData.reject"
        label="驳回原因"
        type="textarea"
        rows="2"
        readonly
      />
    </van-cell-group>

    <div class="form-group-title">
      出库明细
      <dc-select-dialog
        v-if="formData.warehouseId"
        object-name="warehouseCount"
        :multiple="true"
        :multiple-limit="0"
        :clearable="true"
        :query="{ warehouseId: formData.warehouseId }"
        @change="handleSerchDetail"
      >
        <template #customize>
          <van-button class="mb-5" type="primary" size="small">查询明细</van-button>
        </template>

        <template #search-items="{ queryParams, currentObject }">
          <div class="dialog-search-box">
            <van-field
              v-model="queryParams.mtoNo"
              label="计划跟踪号"
              placeholder="请输入计划跟踪号"
            />
            <van-field
              v-model="queryParams[currentObject?.defaultLabel]"
              :placeholder="currentObject?.placeholder"
              label="物料名称"
              clearable
            />
          </div>
        </template>
      </dc-select-dialog>
    </div>

    <!-- 出库明细：一行一项（每条明细一行展示：名称/数量/仓位/删除） -->
    <div v-for="(item, index) in formData.detailList" :key="index" class="card__meta">
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
          <van-stepper
            v-model="item.productQty"
            integer
            min="0"
            :max="item.maxQty"
            theme="round"
            button-size="22"
            input-width="70"
          />
          最大{{ item.maxQty }}
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
      <div class="row">
        <van-button size="small" type="danger" plain @click="removeEvaluate(item)">
          删除
        </van-button>
      </div>
    </div>

    <div class="form-itme-btn">
      <van-button size="small" block @click="cancelSubmit">返回</van-button>
      <van-button type="success" size="small" block @click="submitForm">保存草稿</van-button>
      <van-button type="primary" size="small" block @click="submitAudit">发起</van-button>
    </div>
  </van-form>
</template>

<script setup name="customerSubmit">
import { reactive, toRefs, getCurrentInstance, watch, computed, onMounted } from 'vue';
import Api from '@/api';
import { useRouter, useRoute } from 'vue-router';
import { showToast } from 'vant';
import {
  formatDateLabel,
  buildMessageUrl,
  fetchUserJobNum,
  sendWechatTextCard,
} from '@/utils/message-notification';

const outStockTypeMap = {
  // 现场出库
  DC_WMS_OUT_TYPE_SCENE: 'DC_WMS_STOCK_TYPE_SCENE',
  // 线边仓出库
  DC_WMS_OUT_TYPE_LINE_EDGE: 'DC_WMS_STOCK_TYPE_LINE_EDGE',
  // 其他出库
  DC_WMS_OUT_TYPE_OTHER: '',
  // 领用出库
  DC_WMS_OUT_TYPE_USE: '',
};

// 获取入库类型
const getStockType = (outType) => {
  return outType && outStockTypeMap[outType] ? outStockTypeMap[outType] : undefined;
};

const router = useRouter();
const route = useRoute();
const { proxy } = getCurrentInstance();
const userinfo = computed(() => proxy.$store.getters.userInfo);

// 子组件调用父组件方法
const emit = defineEmits(['out-stock-type-change']);

const props = defineProps({
  // 详情
  info: {
    type: Object,
    default: () => ({}),
  },
});

watch(
  () => props.info,
  (newVal) => {
    if (newVal) {
      const timer = setTimeout(() => {
        if (route.params.id !== 'create') {
          formData.value = {
            ...props.info,
            // 保底，避免 detailList 为空时报错
            detailList: props.info?.detailList || [],
          };
        }
        clearTimeout(timer);
      });
    }
  }
);

const { DC_WMS_OUT_TYPE_WMS } = proxy.dicts(['DC_WMS_OUT_TYPE_WMS']);

const pageData = reactive({
  formData: {
    outStockType: '',
    detailList: [],
    applicantId: null,
  },
  isDisabled: true,
});

const { formData, isDisabled } = toRefs(pageData);

const validateForm = async () => {
  const formRef = proxy.$refs.ruleFormRef;
  if (formRef?.validate) {
    await formRef.validate();
  }
};

onMounted(() => {
  const timer = setTimeout(() => {
    if (route.params.id === 'create') {
      formData.value = {
        applicantId: userinfo.value.user_id,
        outStockType: 'DC_WMS_OUT_TYPE_BORROW',
        detailList: [],
        warehouseId: '2008344171069898753', // 正式环境仓库ID
        // warehouseId: '1900489394659852289', // 测试环境仓库ID
      };
    }
    clearTimeout(timer);
  }, 300);
});

// 监听出库类型变化
watch(
  () => formData.value.outStockType,
  (newVal) => {
    if (newVal) emit('out-stock-type-change', newVal);
  }
);

// 保存
const submitForm = async () => {
  try {
    await validateForm();
  } catch {
    return;
  }

  const res = await Api.application.outboundOrder.submit(formData.value);
  const { code } = res.data;
  if (code === 200) {
    showToast({ type: 'success', message: '保存成功' });
    router.push({ name: 'appsWarehouseRecord' });
  }
};

// 审核
const submitAudit = async () => {
  try {
    await validateForm();
  } catch {
    return;
  }

  const res = await Api.application.outboundOrder.submitAudit(formData.value);
  const { code, data } = res.data;
  if (code === 200) {
    const messageId = data?.id || formData.value.id;
    const receiverId = formData.value.processingPersonnel;
    if (messageId && receiverId) {
      try {
        const jobNum = await fetchUserJobNum(receiverId);
        if (jobNum) {
          const applicantName =
            userinfo.value?.realName || userinfo.value?.name || userinfo.value?.userName || '-';
          await sendWechatTextCard({
            jobNums: [jobNum],
            title: '装配工具借用待审核',
            description: `<div class="gray">${formatDateLabel()}</div><div class="normal">申请人：${applicantName} 发起装配工具借用申请</div><div class="highlight">请及时处理</div>`,
            url: buildMessageUrl(`/apps/warehouse-record/outbound/${messageId}`),
          });
        }
      } catch (error) {
        console.error('发送借用审核通知失败', error);
      }
    }
    showToast({ type: 'success', message: '审核成功' });
    router.push({ name: 'appsWarehouseRecord' });
  }
};

// 删除明细
const removeEvaluate = async (row) => {
  const index = formData.value.detailList.findIndex((item) => item === row);
  if (index !== -1) {
    formData.value.detailList.splice(index, 1);
  }
};

// 取消
const cancelSubmit = () => {
  router.push({ name: 'appsWarehouseRecord' });
};

// 仓库监听事件
const handleWarehouseChange = async (row) => {
  const selected = row?.[0] || row;
  console.log(selected);
  formData.value.processingPersonnel = selected.warehouseSupervisor;
  isDisabled.value = false;
};

// 查询明细（把接口返回映射成 detailList）
const handleSerchDetail = (row) => {
  formData.value.detailList = (row || []).map((item) => ({
    warehouseId: item.warehouseId,
    productName: item.productName,
    productCode: item.productCode,
    productSpec: item.productSpec,
    productQty: item.number, // 数量后续在 card 内直接改这个字段
    productUnit: item.unit,
    outStockId: item.locationId,
    warehouseCountId: item.id,
    locationId: item.locationId,
    productVersion: item.productVersion,
    mtoNo: item.mtoNo,
    maxQty: item.number,
  }));
};
</script>

<style lang="scss" scoped>
.form-group-title {
  width: 100%;
  font-weight: 600;
  color: #303133;
  margin: 16px 4px 12px;
  font-size: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
:deep(.dc-select-dialog) {
  display: inline;
  width: auto !important;
}
</style>
