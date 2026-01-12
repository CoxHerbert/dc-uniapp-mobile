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
        label="仓库名称"
        placeholder="请点击选择仓库"
        object-name="warehouse"
        type="input"
        :multiple="false"
        :multiple-limit="1"
        :clearable="true"
        :disabled="isShow"
      />
      <dc-select-dialog
        v-model="formData.applicantId"
        label="申请人"
        placeholder="请选择"
        object-name="user"
        :multiple="false"
        :disabled="isShow"
      />
      <dc-select-dialog
        v-model="formData.processingPersonnel"
        label="处理人"
        placeholder="请选择"
        object-name="user"
        :multiple="false"
        :disabled="isShow"
      />
      <van-field
        v-model="formData.remark"
        label="备注"
        type="textarea"
        rows="2"
        placeholder="请输入备注"
        :disabled="isShow"
      />
    </van-cell-group>
    <div class="form-group-title">出库明细</div>
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
      <van-button type="danger" size="small" block @click="submitReject">驳回</van-button>
      <van-button type="primary" size="small" block @click="submitAudit">通过</van-button>
    </div>
  </van-form>
</template>

<script setup name="customerSubmit">
import { h, reactive, ref, toRefs, getCurrentInstance, onMounted, watch } from 'vue';
import Api from '@/api';
import { useRouter } from 'vue-router';
import { Field, showConfirmDialog, showToast } from 'vant';
import {
  formatDateLabel,
  buildMessageUrl,
  fetchUserJobNum,
  sendWechatTextCard,
} from '@/utils/message-notification';

const { proxy } = getCurrentInstance();
const router = useRouter();
// 子组件调用父组件方法
const emit = defineEmits(['detail', 'out-stock-type-change']);

const { DC_WMS_OUT_TYPE_WMS } = proxy.dicts(['DC_WMS_OUT_TYPE_WMS']);
const props = defineProps({
  // 详情
  info: {
    type: Object,
    default: {},
  },
});
const pageData = reactive({
  formData: {},
  isShow: true,
});

const { formData, isShow } = toRefs(pageData);
const rejectReason = ref('');
const validateForm = async () => {
  const formRef = proxy.$refs.ruleFormRef;
  if (formRef?.validate) {
    await formRef.validate();
  }
};

onMounted(() => {
  formData.value = props.info;
});
// 监听出库类型变化
watch(
  () => formData.value.outStockType,
  (newVal) => {
    if (newVal) {
      emit('out-stock-type-change', newVal);
    }
  }
);
// 审核
const submitAudit = async () => {
  try {
    await validateForm();
  } catch {
    return;
  }
  const res = await Api.application.outboundOrder.submitAudit({
    ...formData.value,
  });
  const { code, data } = res.data;
  if (code === 200) {
    const messageId = data?.id || formData.value.id;
    const applicantId = formData.value.applicantId;
    if (messageId && applicantId) {
      try {
        const jobNum = await fetchUserJobNum(applicantId);
        if (jobNum) {
          await sendWechatTextCard({
            jobNums: [jobNum],
            title: '装配工具借用审核通过',
            description: `<div class="gray">${formatDateLabel()}</div><div class="normal">您的装配工具借用申请已审核通过</div><div class="highlight">点击查看详情</div>`,
            url: buildMessageUrl(`/apps/warehouse-record/outbound/${messageId}`),
          });
        }
      } catch (error) {
        console.error('发送借用通过通知失败', error);
      }
    }
    showToast({ type: 'success', message: '审核成功' });
    router.push({ name: 'appsWarehouseRecord' });
  }
};

const promptRejectReason = async () => {
  rejectReason.value = '';
  await showConfirmDialog({
    title: '驳回原因',
    message: () =>
      h(Field, {
        modelValue: rejectReason.value,
        'onUpdate:modelValue': (value) => {
          rejectReason.value = value;
        },
        placeholder: '请输入驳回原因',
        type: 'textarea',
        autosize: true,
      }),
    confirmButtonText: '确定',
    cancelButtonText: '取消',
  });

  if (!rejectReason.value) {
    showToast({ type: 'fail', message: '请输入驳回原因' });
    throw new Error('reject reason required');
  }

  return rejectReason.value;
};

const submitReject = async () => {
  try {
    const reason = await promptRejectReason();
    const res = await Api.application.outboundOrder.reject({
      ...formData.value,
      reject: reason,
    });
    const { code, data } = res.data;
    if (code === 200) {
      const messageId = data?.id || formData.value.id;
      const applicantId = formData.value.applicantId;
      if (messageId && applicantId) {
        try {
          const jobNum = await fetchUserJobNum(applicantId);
          if (jobNum) {
            await sendWechatTextCard({
              jobNums: [jobNum],
              title: '装配工具借用审核驳回',
              description: `<div class="gray">${formatDateLabel()}</div><div class="normal">您的装配工具借用申请已被驳回</div><div class="highlight">原因：${reason}</div>`,
              url: buildMessageUrl(`/apps/warehouse-record/outbound/${messageId}`),
            });
          }
        } catch (error) {
          console.error('发送借用驳回通知失败', error);
        }
      }
      showToast({ type: 'success', message: '驳回成功' });
      router.push({ name: 'appsWarehouseRecord' });
    }
  } catch (error) {
    console.error('Reject cancelled or failed:', error);
  }
};

const cancelSubmit = () => {
  router.push({ name: 'appsWarehouseRecord' });
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
