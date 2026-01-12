<template>
  <van-form ref="ruleFormRef">
    <div class="form-group-title">基本信息</div>

    <van-cell-group inset>
      <dc-selector
        v-model="formData.inType"
        label="入库类型"
        placeholder="请点击选择入库类型"
        title="入库类型"
        :options="DC_WMS_IN_TYPE_WMS"
        disabled
        @change="hangleInTypeChange"
      />

      <dc-select-dialog
        v-model="formData.warehouseId"
        label="仓库名称"
        :placeholder="warehousePlaceholder"
        object-name="warehouse"
        type="input"
        :multiple="false"
        :multiple-limit="1"
        :clearable="true"
        :query="{ stockType: getStockType(formData.inType) }"
        disabled
        return-type="string"
        @change="(row) => handleWarehouseChange(row, 'warehouse')"
      />

      <!-- 退库：用选择弹窗 -->
      <dc-select-dialog
        v-if="formData.inType === 'DC_WMS_IN_TYPE_RETURN'"
        v-model="formData.inSourceNumber"
        label="来源单号"
        object-name="outboundOrder"
        type="input"
        :multiple="false"
        :multiple-limit="1"
        :clearable="true"
        :query="{ outStockStatus: 'DC_WMS_OUT_STATUS_BORROW' }"
        return-type="string"
        @change="(row) => handleWarehouseChange(row, 'outboundOrder')"
      />

      <!-- 其他：输入框 -->
      <van-field
        v-else
        v-model="formData.inSourceNumber"
        label="来源单号"
        :placeholder="formData.inType === 'DC_WMS_IN_TYPE_OTHER' ? '无需填写' : '请输入来源单号'"
        :readonly="formData.inType === 'DC_WMS_IN_TYPE_OTHER'"
        clearable
        @blur="handleSerch(formData.inSourceNumber)"
      />

      <dc-select-dialog
        v-model="formData.applicantId"
        label="申请人"
        placeholder="请选择"
        object-name="user"
        :multiple="false"
        :disabled="isShow"
        return-type="string"
      />
      <dc-select-dialog
        v-model="formData.processingPersonnel"
        label="处理人"
        placeholder="请选择"
        object-name="user"
        :multiple="false"
        :disabled="isShow"
        return-type="string"
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

    <div class="form-group-title">入库明细</div>

    <div v-if="btnOpen" class="actions-row">
      <van-button type="primary" size="small" @click="addRow">新增</van-button>

      <van-uploader :after-read="uploadFile" accept=".xls,.xlsx">
        <van-button type="primary" size="small">导入</van-button>
      </van-uploader>

      <van-button type="primary" size="small" @click="addExport">下载模板</van-button>
    </div>

    <div v-for="(item, index) in formData.detailList || []" :key="index" class="detail-card">
      <div class="kv">
        <span class="k">物料名称</span><span class="v">{{ item.productName || '-' }}</span>
      </div>
      <div class="kv">
        <span class="k">物料编码</span><span class="v">{{ item.productCode || '-' }}</span>
      </div>
      <div class="kv">
        <span class="k">规格型号</span><span class="v">{{ item.productSpec || '-' }}</span>
      </div>

      <!-- 借出数量：来源单带出，只读 -->
      <div class="kv">
        <span class="k">借出数量</span>
        <span class="v">{{ item.borrowQty ?? '-' }}</span>
      </div>

      <!-- 归还数量：行内编辑（提交给接口时写入 productQty） -->
      <div class="kv kv-stepper">
        <span class="k">归还数量</span>
        <div class="v">
          <van-stepper
            v-model="item.returnQty"
            integer
            min="0"
            :max="getMaxReturnQty(item)"
            theme="round"
            button-size="22"
            input-width="70"
            @change="() => normalizeReturnQty(item)"
          />
        </div>
      </div>

      <div class="kv">
        <span class="k">单位</span><span class="v">{{ item.productUnit || '-' }}</span>
      </div>

      <div class="kv kv-control">
        <span class="k">仓位编号</span>
        <div class="v">
          <dc-view
            v-model="item.locationId"
            object-name="warehouseLocation"
            show-key="locationName"
          />
        </div>
      </div>

      <!-- 不需要编辑按钮 -->
      <div class="btns">
        <van-button v-if="btnOpen" size="small" type="danger" plain @click="removeEvaluate(item)">
          删除
        </van-button>
      </div>
    </div>

    <div class="bottom-bar van-safe-area-bottom">
      <van-button size="small" block @click="cancelSubmit">返回</van-button>
      <van-button type="success" size="small" block @click="submitForm">保存草稿</van-button>
      <van-button type="primary" size="small" block @click="submitAudit">发起</van-button>
    </div>

    <div class="bottom-spacer"></div>
  </van-form>
</template>

<script setup name="customerSubmit">
import { reactive, toRefs, getCurrentInstance, onMounted, computed, watch } from 'vue';
import Api from '@/api';
import { useRouter, useRoute } from 'vue-router';
import { showToast } from 'vant';
import axios from 'axios';
import {
  formatDateLabel,
  buildMessageUrl,
  fetchUserJobNum,
  sendWechatTextCard,
} from '@/utils/message-notification';

const inTypeMap = {
  DC_WMS_IN_TYPE_ON_SITE_STORAGE: 'DC_WMS_STOCK_TYPE_SCENE',
  DC_WMS_IN_TYPE_LEW: 'DC_WMS_STOCK_TYPE_LINE_EDGE',
  DC_WMS_IN_TYPE_OTHER: '',
};

const getStockType = (inType) => (inType && inTypeMap[inType] ? inTypeMap[inType] : undefined);

const router = useRouter();
const route = useRoute();
const { proxy } = getCurrentInstance();

const userinfo = computed(() => proxy.$store.getters.userInfo);

const props = defineProps({
  info: { type: Object, default: () => ({}) },
});

const { DC_WMS_IN_TYPE_WMS } = proxy.dicts(['DC_WMS_IN_TYPE_WMS']);

const pageData = reactive({
  loading: false,
  formData: {
    inType: 'DC_WMS_IN_TYPE_RETURN',
    warehouseId: '2008344171069898753', // 正式环境仓库ID
    // warehouseId: '1900489394659852289', // 测试环境仓库ID
    detailList: [],
  },
  show: true,
  btnOpen: false,
});

const { loading, formData, show, btnOpen } = toRefs(pageData);

const isShow = computed(() => show.value);

const warehouseIdValue = computed(() => {
  const wid = formData.value.warehouseId;
  return typeof wid === 'object' ? wid?.id : wid;
});

const warehousePlaceholder = computed(() =>
  [null, '', undefined].includes(formData.value.inType) ? '请先选择入库类型' : '请点击选择仓库'
);

const validateForm = async () => {
  const formRef = proxy.$refs.ruleFormRef;
  if (formRef?.validate) await formRef.validate();
};

// ============ 明细字段标准化（关键） ============
const normalizeDetailItem = (it) => {
  // 借出数量优先从接口字段取；找不到则兜底到可能存在的字段
  const borrow = it.productQty ?? 0;

  // 归还数量：优先使用 returnQty；如果详情回显里只有 productQty（历史数据），则从 productQty 回填到 returnQty
  const ret = it.productQty ?? 0;

  return {
    ...it,
    borrowQty: Number(borrow) || 0,
    returnQty: Number(ret) || 0,
  };
};

const normalizeDetailList = (list) => (Array.isArray(list) ? list.map(normalizeDetailItem) : []);

// 最大归还数默认=借出数量（你如果允许超出，改这里）
const getMaxReturnQty = (item) => {
  const max = Number(item.borrowQty ?? 0) || 0;
  return max < 0 ? 0 : max;
};

const normalizeReturnQty = (item) => {
  const max = getMaxReturnQty(item);
  let val = Number(item.returnQty ?? 0) || 0;
  if (val < 0) val = 0;
  if (val > max) val = max;
  item.returnQty = val;
};

// 将 returnQty 写入 productQty（接口提交字段）
const applyReturnQtyToProductQty = (list) =>
  (Array.isArray(list) ? list : []).map((it) => ({
    ...it,
    productQty: Number(it.returnQty ?? 0) || 0, // ✅ 归还数量提交使用 productQty
  }));

// 初始化/回显
watch(
  () => props.info,
  (val) => {
    if (route.params.id !== 'create' && val && Object.keys(val).length) {
      formData.value = {
        ...val,
        detailList: normalizeDetailList(val.detailList),
      };
      btnOpen.value = formData.value.inType === 'DC_WMS_IN_TYPE_OTHER';
      show.value = !btnOpen.value;
    }
  },
  { immediate: true, deep: true }
);

onMounted(() => {
  formData.value.applicantId = userinfo.value.user_id;
});

// 保存
const submitForm = async () => {
  try {
    await validateForm();
  } catch {
    return;
  }

  // 先规整 & 限制归还数量
  formData.value.detailList = normalizeDetailList(formData.value.detailList);
  (formData.value.detailList || []).forEach(normalizeReturnQty);

  loading.value = true;
  try {
    const params = {
      ...formData.value,
      warehouseId: warehouseIdValue.value,
      // ✅ 接口提交：归还数量写入 productQty
      detailList: applyReturnQtyToProductQty(formData.value.detailList),
    };

    const res = await Api.application.warehousingEntry.submit(params);
    const { code } = res.data;
    if (code === 200) {
      showToast({ type: 'success', message: '保存成功' });
      router.push({ name: 'appsWarehousingEntry' });
    }
  } finally {
    loading.value = false;
  }
};

// 审核
const submitAudit = async () => {
  try {
    await validateForm();
  } catch {
    return;
  }

  // 先规整 & 限制归还数量
  formData.value.detailList = normalizeDetailList(formData.value.detailList);
  (formData.value.detailList || []).forEach(normalizeReturnQty);

  loading.value = true;
  try {
    const wid = warehouseIdValue.value;

    const detailList = applyReturnQtyToProductQty(formData.value.detailList).map((it) => ({
      ...it,
      warehouseId: wid,
    }));

    const payload = {
      ...formData.value,
      warehouseId: wid,
      detailList,
    };

    const res = await Api.application.warehousingEntry.submitAudit(payload);
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
              title: '装配工具归还待审核',
              description: `<div class="gray">${formatDateLabel()}</div><div class="normal">申请人：${applicantName} 发起装配工具归还申请</div><div class="highlight">请及时处理</div>`,
              url: buildMessageUrl(`/apps/warehouse-record/entry/${messageId}`),
            });
          }
        } catch (error) {
          console.error('发送归还审核通知失败', error);
        }
      }
      showToast({ type: 'success', message: '审核成功' });
      router.push({ name: 'appsWarehousingEntry' });
    }
  } finally {
    loading.value = false;
  }
};

// 删除
const removeEvaluate = (row) => {
  const idx = (formData.value.detailList || []).findIndex((item) => item === row);
  if (idx !== -1) formData.value.detailList.splice(idx, 1);
};

const addRow = () => {
  // 行内新增：默认 borrowQty=0，returnQty=0
  formData.value.detailList = [
    ...(formData.value.detailList || []),
    normalizeDetailItem({
      productName: '',
      productCode: '',
      productSpec: '',
      productUnit: '',
      borrowQty: 0,
      returnQty: 0,
      locationId: null,
    }),
  ];
};

const cancelSubmit = () => router.push({ name: 'appsWarehousingEntry' });

// 来源单号查询明细（输入框 blur）
const handleSerch = async (sourceNo) => {
  if (!sourceNo) {
    formData.value.detailList = [];
    return;
  }

  loading.value = true;
  try {
    const params = { type: formData.value.inType, sourceId: sourceNo };
    const res = await Api.application.warehousingEntry.detailList(params);
    const { code, data } = res.data;
    if (code === 200) {
      // 来源单带出借出数量 => borrowQty
      formData.value.detailList = normalizeDetailList(data);
    }
  } finally {
    loading.value = false;
  }
};

// 入库类型改变
const hangleInTypeChange = () => {
  formData.value.inSourceNumber = null;
  formData.value.detailList = [];

  const isOther = formData.value.inType === 'DC_WMS_IN_TYPE_OTHER';
  btnOpen.value = isOther;
  show.value = !isOther;
};

// 仓库/来源单监听
const handleWarehouseChange = (row, type) => {
  console.log(row, type);
  if (type === 'warehouse') {
    formData.value.processingPersonnel = row.warehouseSupervisor;
  } else if (type === 'outboundOrder') {
    formData.value.processingPersonnel = row.processingPersonnel;
    getOutboundDetail(row.id);
  }
};

// 来源单弹窗选中后取明细
const getOutboundDetail = async (id) => {
  if (!id) return;
  const res = await Api.application.warehousingEntry.outboundDetail({ id });
  const { code, data } = res.data;
  if (code === 200) {
    // ✅ 注意：来源单详情通常会带 productQty（借出数量），但我们不直接用 productQty 当 borrowQty
    // 你需要按真实字段改 normalizeDetailItem 的 borrow 映射（建议你返回字段名固定后我帮你对齐）
    formData.value.detailList = normalizeDetailList(data.detailList);
  }
};

// 导入
const uploadFile = async (fileObj) => {
  const form = new FormData();
  form.append('file', fileObj.file);

  const url = `/blade-bip/dc-wms-in-stock/import-excel?warehouseId=${warehouseIdValue.value}`;
  loading.value = true;

  try {
    const response = await axios.post(url, form);
    if (response.data.code === 200) {
      showToast({ type: 'success', message: '导入成功！' });
      formData.value.detailList = normalizeDetailList(response.data.data);
    } else {
      showToast({ type: 'fail', message: response.data.message || '导入失败' });
    }
  } catch (error) {
    console.error('导入失败', error);
    showToast({ type: 'fail', message: '导入失败，请稍后重试' });
  } finally {
    loading.value = false;
  }
};

// 下载模板
const addExport = () => {
  const excelUrl =
    'https://static.eastwinbip.com/static/%E7%8E%B0%E5%9C%BA%E4%BB%93%E5%85%B6%E4%BB%96%E5%85%A5%E5%BA%93%E6%98%8E%E7%BB%86.xlsx?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=dc-minio%2F20250320%2F%2Fs3%2Faws4_request&X-Amz-Date=20250320T054333Z&X-Amz-Expires=432000&X-Amz-SignedHeaders=host&X-Amz-Signature=212ade78cb1367e391b29ff742d6187320255943cdc26a1a273c543cb41bbe30';

  const link = document.createElement('a');
  link.href = excelUrl;
  link.download = '现场仓其他入库明细.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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

.actions-row {
  display: flex;
  gap: 8px;
  padding: 0 12px;
  margin-bottom: 8px;
}

.detail-card {
  margin: 8px 0;
  background: #fff;
  border-radius: 10px;
  padding: 10px 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.04);
  font-size: 13px;
  color: #666;
}

.kv {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 4px 0;
}

.k {
  color: #888;
  min-width: 64px;
}
.v {
  text-align: right;
  flex: 1;
  word-break: break-all;
}

.kv-control .v {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.kv-stepper .v {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.btns {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 8px 10px;
  background: #fff;
  display: flex;
  gap: 8px;
  box-shadow: 0 -6px 18px rgba(0, 0, 0, 0.06);
}

.bottom-spacer {
  height: 72px;
}
</style>
