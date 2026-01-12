<template>
  <van-nav-bar title="投递详情" placeholder left-arrow @click-left="onClickLeft" />

  <div class="page">
    <div class="page-top-bg"></div>

    <!-- 基本信息 -->
    <section class="card candidate">
      <div class="row top">
        <div class="left">
          <div class="name">
            {{ detail.name }}
            <img
              v-if="detail.sex === 'DC_GENDER_MAN'"
              height="17"
              :src="$assetUrl('/images/recruit/campus/apply/male.svg')"
              alt="male"
            />
            <img
              v-else-if="detail.sex === 'DC_GENDER_WOMAN'"
              height="18"
              :src="$assetUrl('/images/recruit/campus/apply/female.svg')"
              alt="female"
            />
          </div>
        </div>
        <div class="right">
          <div class="resume-download" @click="onPreviewResume">
            <img height="18" :src="$assetUrl('/images/recruit/campus/apply/CV.svg')" alt="CV" />
            简历附件
          </div>
        </div>
      </div>

      <div class="row">
        <van-tag plain type="primary">{{ detail.graduateSchool }}</van-tag>
        <van-tag plain type="primary">{{ detail.professionalName }}</van-tag>
      </div>

      <van-cell-group inset>
        <van-cell title="应聘渠道">
          <template #default>
            <dc-dict :options="dictRefs.DC_APPLY_CHANNEL" :value="detail.applyChannel" />
          </template>
        </van-cell>
        <van-cell title="推荐人">
          <template #default>{{ detail.referrerName || '-' }}</template>
        </van-cell>
      </van-cell-group>

      <van-cell-group title="求职期望">
        <van-cell title="意向岗位">
          <template #default>
            {{ postNames }}
          </template>
        </van-cell>

        <van-cell title="意向地点">
          <template #default>
            <dc-dict :options="dictRefs.DC_WORK_LOCATION" :value="detail.desiredLocation" />
          </template>
        </van-cell>
      </van-cell-group>
    </section>

    <!-- 评估结果 -->
    <section class="card result">
      <div class="title">评估结果</div>
      <div class="result-box">
        <img v-if="iconSrc" class="status-img" :src="iconSrc" :alt="statusText" />
        <div class="status-text" :class="statusClass">
          {{ statusText || '-' }}
        </div>
        <div class="status-desc">
          {{ finalDesc || '-' }}
        </div>
      </div>
    </section>

    <!-- 评估说明（有就显示） -->
    <section v-if="detail.result?.post || detail.result?.message" class="card">
      <van-cell-group title="评估说明">
        <van-cell v-if="detail.result?.post" title="目标岗位">
          <template #default>
            <pre class="message">{{ detail.result?.post || '-' }}</pre>
          </template>
        </van-cell>
        <van-cell v-if="detail.result?.message" title="备注">
          <template #default>
            <pre class="message">{{ detail.result.message }}</pre>
          </template>
        </van-cell>
      </van-cell-group>
    </section>

    <div class="safe-bottom"></div>
  </div>
</template>

<script setup>
import { computed, reactive, onMounted, toRefs, getCurrentInstance } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Api from '@/api/index';
import { useUserStore } from '@/store/user';
import { goBackOrHome } from '@/utils/navigation';
const user = useUserStore();

const route = useRoute();
const router = useRouter();
const { proxy } = getCurrentInstance();
const dictRefs = proxy.dicts([
  'DC_GENDER',
  'DC_APPLY_CHANNEL',
  'DC_WORK_LOCATION',
  'DC_EVALUATION_STATUS',
]);

// 后端状态码 -> 页面四态 映射
const STATUS_CODE_TO_KEY = {
  DC_EVALUATION_STATUS_PGZ: 'pending',
  DC_EVALUATION_STATUS_XYFS: 'retest',
  DC_EVALUATION_STATUS_YTG: 'pass',
  DC_EVALUATION_STATUS_WTG: 'reject',
};

// 图标
const icons = reactive({
  pending: proxy.$assetUrl('/images/recruit/campus/apply/status-pending.svg'),
  retest: proxy.$assetUrl('/images/recruit/campus/apply/status-retest.svg'),
  pass: proxy.$assetUrl('/images/recruit/campus/apply/status-pass.svg'),
  reject: proxy.$assetUrl('/images/recruit/campus/apply/status-reject.svg'),
});

const pageData = reactive({ detail: {}, positionList: [] });
const { detail, positionList } = toRefs(pageData);
const STATUS_MAP = computed(() => ({
  pending: {
    text: '评估中',
    color: '#3478F6',
    desc: `【联合东创】亲爱的${detail.value?.name}同学，您好！感谢您参与我司《岗位》岗位面试，目前您的面试资料正处于评估阶段，我们会尽快完成审核并告知结果。期间请保持手机畅通，耐心等待后续通知，感谢您的理解与配合！`,
  },
  retest: {
    text: '需要复试',
    color: '#FF8A00',
    desc: `【联合东创】亲爱的${detail.value?.name}同学，您好！恭喜您顺利通过我司简历初筛环节，接下来将进入复试阶段。HR 会尽快与您电话沟通复试时间、形式及相关注意事项，请您留意手机来电，避免错过重要信息。若未及时接到来电，我们也会通过短信补充告知，期待您在复试中的精彩表现！`,
  },
  pass: {
    text: '已通过',
    color: '#00C07F',
    desc: `【联合东创】${detail.value?.name}同学，恭喜您！已成功通过我司本次面试评估！后续 HR 将向您发送入职所需材料清单、报到时间等详细信息，请您保持手机及邮箱畅通，耐心等待通知。欢迎您加入 联合东创 公司大家庭，期待与您携手同行！`,
  },
  reject: {
    text: '未通过',
    color: '#FF3B30',
    desc: `【联合东创】亲爱的${detail.value?.name}同学，您好！！非常感谢您对 联合东创 公司的关注与参与，经综合评估，很遗憾您暂未通过本轮面试。您的简历会纳入我司人才库，未来若有匹配岗位，我们将优先与您联系，期待未来有机会与您再次合作，祝您求职顺利！`,
  },
}));

// ===== 计算字段 =====

// 真实状态：优先使用后端 result.status（字典码）映射为页面四态
const statusKey = computed(() => {
  const code = detail.value?.result?.status;
  return STATUS_CODE_TO_KEY[code] || 'pending';
});

const statusCfg = computed(() => STATUS_MAP[statusKey.value] || STATUS_MAP.value.pending);
const statusText = computed(() => statusCfg.value.text);
const statusClass = computed(() => `s--${statusKey.value}`);
const finalDesc = computed(() => statusCfg.value.desc);
const iconSrc = computed(() => icons[statusKey.value] || '');
const postNames = computed(() => {
  const raw = detail.value.joinPostIds;
  const ids = String(raw).split(',');
  const posts = pageData.positionList
    .filter((post) => ids.includes(post.id))
    .map((post) => post.postName)
    .join(',');
  return posts;
});

// ===== 行为 =====
onMounted(async () => {
  await getCampusPositionList();
  const id = route.params.applyId;
  if (id === 'userid') {
    getDetail({ userId: user.userInfo?.id });
  } else if (id) {
    getDetail({ id });
  }
});

function getDetail(params) {
  Api.recruit.campus.apply.getDetail(params).then((res) => {
    const { code, data } = res.data || {};
    if (code === 200 && data) {
      pageData.detail = normalizeDetail(data);
    }
  });
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

// 规范化字段（把字符串多值转成数组，防止组件难以回显）
function normalizeDetail(data) {
  const toArr = (v) => (Array.isArray(v) ? v : v ? String(v).split(',').filter(Boolean) : []);
  return {
    ...data,
    // 供 <dict> 多选回显
    _desiredLocationArr: toArr(data.desiredLocation),
    // 供“意向岗位”计数/占位
    _joinPostIdsArr: toArr(data.joinPostIds),
  };
}

function onClickLeft() {
  goBackOrHome(router);
}

function onPreviewResume() {
  window.open(proxy.$previewUrl(detail.value?.resumeUrl), '_blank');
}
</script>

<style lang="scss" scoped>
/* 仅新增：多行备注更友好显示 */
pre.message {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}
// ========== Tokens ==========
$brand: #3060ed;
$brand-weak: rgba(48, 96, 237, 0.3);
$bg-page: #f7f8fa;
$text-strong: #333333;
$text-weak: #8c8c8c;
$radius-lg: 12px;
$shadow-soft: 0 2px 12px rgba(0, 0, 0, 0.04);
$gap: 12px;

// 状态色（自动生成 .status-text.s--xxx）
$statuses: (
  pending: #3478f6,
  retest: #ff8a00,
  pass: #00c07f,
  reject: #ff3b30,
);

// ========== Mixins / Utils ==========
@mixin card {
  position: relative;
  margin: 0 $gap $gap;
  padding: $gap;
  background: #fff;
  border-radius: $radius-lg;
  box-shadow: $shadow-soft;
}

@function safe-bottom($fallback: 12px) {
  @return max(env(safe-area-inset-bottom), $fallback);
}

// 统一标题样式（复用 :deep 覆盖 Vant）
@mixin group-title {
  padding: 10px 0;
  color: $text-strong;
  font-weight: 600;
}

// ========== Page ==========
.page {
  min-height: 100vh;
  background: $bg-page;
  padding: $gap 0 safe-bottom(12px);
  position: relative;

  .page-top-bg {
    position: absolute;
    inset: 0 0 auto 0;
    height: 196px;
    background: linear-gradient(180deg, $brand 0%, $brand-weak 64%, rgba(48, 96, 237, 0) 100%);
    z-index: 0;
    pointer-events: none;
  }

  .resume-download {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #1d65f3;
    cursor: pointer;

    img {
      display: block;
    }
  }

  // 卡片
  .card {
    @include card;
  }
}

// ========= Vant overrides =========
:deep(.van-cell-group__title) {
  @include group-title;
}

:deep(.van-cell-group) {
  margin: 0;

  .van-cell {
    // 让每组更紧凑点
    padding: var(--van-cell-vertical-padding) 0;
  }
}

// ========== Candidate ==========
.candidate {
  .row.top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 0 8px;
  }

  .name {
    font-size: 18px;
    font-weight: 600;

    img {
      vertical-align: middle;
      margin-left: 4px;
    }
  }

  .sub {
    margin-top: 4px;
    color: $text-weak;
    font-size: 13px;
  }
}

// ========== Tag（描边浅底） ==========
.van-tag--plain {
  margin-right: 5px;
  padding: 4px 8px;
  color: $brand;
  background-color: rgba($brand, 0.3);
  border-radius: 4px;
  border-color: #fff;
}

// ========== Result Box ==========
.result {
  .title {
    font-weight: 600;
    margin: 4px 4px 12px;
  }
}

.result-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px 8px;
  text-align: center;

  .status-img {
    width: 128px;
    height: 128px;
    object-fit: contain;
    margin-bottom: 8px;
  }

  .status-text {
    font-size: 18px;
    font-weight: 700;
    margin: 6px 0 4px;

    // 根据 $statuses 自动生成颜色类
    @each $key, $color in $statuses {
      &.s--#{$key} {
        color: $color;
      }
    }
  }

  .status-desc {
    color: $text-weak;
    font-size: 13px;
    line-height: 1.4;
    padding: 0 8px 4px;
  }
}

// ========== Safe bottom ==========
.safe-bottom {
  height: env(safe-area-inset-bottom);
}

// ========== 小屏微调 ==========
@media (max-width: 360px) {
  .candidate .name {
    font-size: 16px;
  }
  .result-box .status-img {
    width: 112px;
    height: 112px;
  }
}
</style>
