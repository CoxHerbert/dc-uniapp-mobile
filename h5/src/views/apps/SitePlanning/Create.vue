<template>
  <div class="site-planning-create">
    <van-nav-bar title="现场计划单" left-arrow @click-left="handleBack" />

    <div class="base-wrapper ptop16">
      <div class="baseinfo">
        <van-card class="info-card" :border="false">
          <template #desc>
            <van-cell-group>
              <van-field
                label="阶段编码"
                :model-value="form.phaseCode || ''"
                placeholder="请输入阶段编码"
                readonly
              />
              <van-field
                label="阶段名称"
                :model-value="form.phaseName || ''"
                placeholder="请输入阶段名称"
                readonly
              />
              <van-field
                label="开始时间"
                :model-value="form.startDate || ''"
                placeholder="请输入开始时间"
                readonly
              />
              <van-field
                label="结束时间"
                :model-value="form.endDate || ''"
                placeholder="请输入结束时间"
                readonly
              />
              <van-field
                v-model="form.overdueExplanation"
                label="延期说明"
                type="textarea"
                rows="2"
                autosize
                maxlength="200"
                show-word-limit
                placeholder="请输入延期说明"
              />
            </van-cell-group>
          </template>

          <template #footer>
            <van-button
              block
              type="primary"
              class="save-btn"
              :loading="submitting"
              @click="handleSave"
            >
              保存
            </van-button>
          </template>
        </van-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';
import Api from '@/api';
import { goBackOrHome } from '@/utils/navigation';

const route = useRoute();
const router = useRouter();

const form = reactive({
  orderCode: '',
  phaseCode: '',
  phaseName: '',
  startDate: '',
  endDate: '',
  overdueExplanation: '',
});

const submitting = ref(false);

onMounted(() => {
  fetchDetail();
});

async function fetchDetail() {
  const id = route.query?.id;
  if (!id) return;

  try {
    const res = await Api.application.planSheep.detail({ id });
    const data = res?.data?.data ?? res?.data ?? {};
    Object.assign(form, {
      orderCode: '',
      phaseCode: '',
      phaseName: '',
      startDate: '',
      endDate: '',
      ...data,
      overdueExplanation: data?.overdueExplanation ?? '',
    });
  } catch (error) {
    console.error(error);
    showToast('获取详情失败');
  }
}

function handleBack() {
  goBackOrHome(router);
}

async function handleSave() {
  if (submitting.value) return;

  try {
    await showConfirmDialog({
      title: '提示',
      message: '确认保存吗',
    });
  } catch {
    return;
  }

  submitting.value = true;
  try {
    const res = await Api.application.planSheep.submit({ ...form });
    const code = res?.data?.code ?? res?.status;
    const success = res?.data?.success ?? code === 200;
    const message = res?.data?.msg || (success ? '保存成功' : '保存失败');

    showToast(message);

    if (success) {
      setTimeout(() => {
        goBackOrHome(router);
      }, 600);
    }
  } catch (error) {
    console.error(error);
    showToast('系统异常');
  } finally {
    submitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.site-planning-create {
  min-height: 100vh;
  padding-bottom: 100px;
  box-sizing: border-box;

  .ptop16 {
    margin-top: 16px;
  }

  .base-wrapper {
    padding: 0 13px;
    box-sizing: border-box;

    .baseinfo {
      padding-bottom: 24px;
      box-sizing: border-box;

      .info-card {
        --van-card-background: #fff;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);

        :deep(.van-card__header) {
          padding: 16px 12px 0;
        }

        :deep(.van-card__content) {
          // padding: 0 12px 16px;
        }

        :deep(.van-card__desc) {
          margin-top: 12px;
        }

        :deep(.van-cell-group) {
          background-color: transparent;
        }

        :deep(.van-card__footer) {
          padding: 0 12px 16px;
        }
      }

      .info-card__title {
        font-size: 14px;
        font-weight: 600;
        color: #222;
      }

      .save-btn {
        margin-top: 16px;
        border-radius: 4px;
      }
    }
  }
}
</style>
