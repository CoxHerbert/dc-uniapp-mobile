<!-- src/views/recruit/campus/apply.vue -->
<template>
  <van-nav-bar title="简历投递" @click-right="onClickRight">
    <template #right>
      <span class="help">
        帮助文档
        <van-icon name="question-o" size="18" />
      </span>
    </template>
  </van-nav-bar>
  <img class="banner" :src="$assetUrl('/images/recruit/campus/apply/banner.svg')" alt="banner" />
  <dc-recruit-form
    v-model="form"
    :schema="schema"
    submit-text="提交"
    clear-text="清空"
    cancel-text="取消"
    :show-cancel="true"
    :show-clear="true"
    :compact="true"
    :fixed-actions="true"
    @change="handleChange"
    @submit="handleSubmit"
    @clear="handleClear"
    @cancel="handleCancel"
  />
</template>

<script setup>
import { ref, computed, getCurrentInstance, onMounted } from 'vue';
import { showToast } from 'vant';
import Api from '@/api/index';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';

const user = useUserStore();

const router = useRouter();
const { proxy } = getCurrentInstance();
const dictRefs = proxy.dicts(['DC_GENDER', 'DC_APPLY_CHANNEL', 'DC_WORK_LOCATION']);
const positionList = ref([]);

const channelExtra = {
  DC_APPLY_CHANNEL_TSTJ: { key: 'referrerName', placeholder: '姓名', required: true },
  DC_APPLY_CHANNEL_TXXTJ: { key: 'referrerName', placeholder: '姓名', required: true },
};

const genderOptions = computed(() =>
  (dictRefs.DC_GENDER.value || []).map(({ label, value }) => ({ label, value }))
);

const applyChannelOptions = computed(() =>
  (dictRefs.DC_APPLY_CHANNEL.value || []).map(({ label, value }) => {
    const extra = channelExtra[value];
    return extra ? { label, value, extra } : { label, value };
  })
);

const workLocationOptions = computed(() =>
  (dictRefs.DC_WORK_LOCATION.value || []).map(({ label, value }) => ({ label, value }))
);

/** ====== schema：只用 fields；可选全局 layout/labelWidth ====== */
const schema = computed(() => ({
  layout: 'vertical',
  labelWidth: 100,
  fields: [
    {
      type: 'input',
      name: 'name',
      label: '您的姓名',
      required: true,
      placeholder: '请输入姓名',
    },
    {
      type: 'radio',
      name: 'sex',
      label: '您的性别',
      required: true,
      options: genderOptions.value,
    },
    {
      type: 'input',
      name: 'phone',
      label: '请输入您的手机号',
      required: true,
      placeholder: '请输入手机号',
      inputType: 'tel',
      validate: {
        pattern: '^1\\d{10}$',
        message: '手机号格式不正确',
      },
    },
    {
      type: 'input',
      name: 'graduateSchool',
      label: '请填写您的毕业院校',
      required: true,
      placeholder: '请输入毕业院校',
    },
    {
      type: 'input',
      name: 'professionalName',
      label: '请填写您的专业',
      required: true,
      placeholder: '请输入专业',
    },
    {
      type: 'checkbox',
      name: 'applyChannel',
      label: '应聘渠道（单选）',
      required: true,
      max: 1,
      options: applyChannelOptions.value,
    },
    {
      type: 'checkbox',
      name: 'joinPostIds',
      label: '意向岗位（多选）',
      required: true,
      max: 3,
      desc: '最多选择3项',
      options: positionList.value,
    },
    {
      type: 'checkbox',
      name: 'desiredLocation',
      label: '意向工作地点（多选）',
      required: true,
      options: workLocationOptions.value,
    },
    {
      type: 'uploader',
      name: 'file',
      label: '简历上传',
      required: true,
      placeholder: '文件命名方式：“学校+专业+应聘岗位+姓名”',
      upload: {
        maxCount: 1,
        accept: '.pdf,.doc,.docx',
        maxSize: 5242880,
      },
    },
  ],
}));

/** ====== v-model：表单数据 ====== */
const form = ref({
  name: '',
  sex: '',
  phone: '',
  graduateSchool: '',
  professionalName: '',
  applyChannel: '',
  joinPostIds: '',
  desiredLocation: '',
  file: '',
  referrerName: '',
});

onMounted(async () => {
  try {
    const res = await getDetail();
    const { code, data } = res.data;
    if (code === 200) {
      if (data?.id) {
        router.push({ path: '/recruit/campus/apply-detail/userid' });
      }
    }
  } catch (error) {
    console.log('error:', error);
  }
  getCampusPositionList();
});

function getDetail() {
  return Api.recruit.campus.apply.getDetail({ userId: user.userInfo?.id });
}

const getCampusPositionList = () => {
  Api.recruit.campus.apply
    .getPositionLis()
    .then((res) => {
      // 如果有统一的返回格式，可以在这里做一次处理
      const { code, data } = res.data;
      if (code === 200) {
        positionList.value = data.map((item) => {
          const { id, postName } = item;
          return {
            ...item,
            label: postName,
            value: id,
          };
        });
      }
      return res;
    })
    .catch((err) => {
      console.error('获取岗位列表失败:', err);
      throw err;
    });
};

/** ====== 组件事件 ====== */
function handleSubmit(payload) {
  const data = Object.assign({}, form.value, payload);
  Api.recruit.campus.apply
    .postTalentUser(data)
    .then((res) => {
      const { code, data } = res.data;
      if (code === 200) {
        showToast('提交成功');
        // 跳转到 apply-detail/:applyId
        router.push({
          name: 'recruit-campus-apply-detail',
          params: { applyId: data.id }, // ✅ 使用 data.id
        });
      }
    })
    .catch(() => {});
}
function handleClear() {
  // 这里的 form 已被组件重置；如需额外处理可写在此
  showToast('已清空表单');
}
function handleCancel() {
  showToast('已取消');
  // 可按需求返回上一页：history.back()
}
function handleChange({ name, value }) {
  if (name === 'file') {
    form.value.resumeUrl = value?.path || '';
    form.value.resumeId = value?.attachId || '';
  }
}
function onClickRight() {
  router.push({
    name: 'sop-doc',
    params: { docKey: 'campusRecruitApply' },
  });
}
</script>

<style scoped>
/* 可选：页面级额外样式 */
.banner {
  width: 100%;
}
.help {
  display: flex;
  align-items: center;
  color: #fff;
}
</style>
