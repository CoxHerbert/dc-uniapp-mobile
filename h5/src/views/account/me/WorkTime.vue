<template>
  <div class="me-work-time">
    <!-- 顶部固定导航 -->
    <van-nav-bar
      class="me-work-time__nav"
      :title="t('me.workTime.title')"
      left-arrow
      placeholder
      @click-left="handleBack"
    />
    <!-- 占位：确保内容不被固定导航遮挡（若 van-nav-bar 已内置 placeholder 可删除本行） -->
    <div class="me-work-time__nav-spacer" aria-hidden="true"></div>

    <main class="me-work-time__body">
      <!-- 日期卡片：月视图 / 周视图（收起） -->
      <section class="card card--date">
        <div class="card__content">
          <work-time-calendar v-model="selectedDate" />
        </div>
      </section>

      <!-- 打卡明细 -->
      <section class="card sign-detail">
        <div class="card__title card__title--section">{{ t('me.workTime.punchDetailTitle') }}</div>
        <div class="card__content">
          <div class="field">
            <div class="field__label">{{ t('me.workTime.punchTimeLabel') }}</div>
            <div class="field__value">{{ punchTime }}</div>
          </div>
        </div>
      </section>

      <!-- 分组数据 -->
      <section
        v-for="group in groups"
        :key="group.key"
        class="card card--collapsible"
        :class="{ 'is-collapsed': !isGroupExpanded(group.key) }"
      >
        <button
          class="card__title card__title--toggle card__title--section"
          type="button"
          :aria-expanded="isGroupExpanded(group.key)"
          @click="toggleGroup(group.key)"
        >
          <span>{{ group.label }}</span>
          <van-icon :name="isGroupExpanded(group.key) ? 'arrow-up' : 'arrow-down'" />
        </button>
        <transition name="collapse">
          <div v-show="isGroupExpanded(group.key)" class="card__content card__content--grid">
            <div v-for="col in group.columns" :key="col.prop" class="field">
              <div class="field__label">{{ col.label }}</div>
              <div class="field__value" :class="{ 'field__value--zero': isZeroValue(col.prop) }">
                {{ formatValue(col.prop) }}
              </div>
            </div>
          </div>
        </transition>
      </section>
    </main>

    <transition name="fade">
      <div v-if="loading" class="me-work-time__loading">
        <van-loading size="28px" />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import dayjs from 'dayjs';
import Api from '@/api/index';
import { showToast } from 'vant';
import WorkTimeCalendar from './components/WorkTimeCalendar.vue';
import { goBackOrHome } from '@/utils/navigation';

const router = useRouter();
const { t } = useI18n();

const today = dayjs().format('YYYY-MM-DD');
const selectedDate = ref(today);
const pageInfo = ref({});
const loading = ref(false);

const expandedGroups = ref({
  attendance: true,
  overtime: true,
  abnormal: true,
  correction: true,
});

const groups = computed(() => [
  {
    key: 'attendance',
    label: t('me.workTime.groups.attendance'),
    columns: [
      { label: t('me.workTime.fields.normalHours'), prop: 'normalHours' },
      { label: t('me.workTime.fields.travelNormalHours'), prop: 'travelNormalHours' },
      { label: t('me.workTime.fields.paidLeaveHours'), prop: 'paidLeaveHours' },
      { label: t('me.workTime.fields.unpaidLeaveHours'), prop: 'unpaidLeaveHours' },
      { label: t('me.workTime.fields.restHours'), prop: 'restHours' },
      { label: t('me.workTime.fields.holidayHours'), prop: 'holidayHours' },
      { label: t('me.workTime.fields.paidStopHours'), prop: 'paidStopHours' },
      { label: t('me.workTime.fields.unpaidStopHours'), prop: 'unpaidStopHours' },
    ],
  },
  {
    key: 'overtime',
    label: t('me.workTime.groups.overtime'),
    columns: [
      { label: t('me.workTime.fields.cardOverHours'), prop: 'cardOverHours' },
      { label: t('me.workTime.fields.applyOverHours'), prop: 'applyOverHours' },
      { label: t('me.workTime.fields.normalOverHours'), prop: 'normalOverHours' },
      { label: t('me.workTime.fields.travelOverHours'), prop: 'travelOverHours' },
      { label: t('me.workTime.fields.restOverHours'), prop: 'restOverHours' },
      { label: t('me.workTime.fields.holidayOverHours'), prop: 'holidayOverHours' },
      { label: t('me.workTime.fields.overToLeaveHours'), prop: 'overToLeaveHours' },
      { label: t('me.workTime.fields.leaveSettlementHours'), prop: 'leaveSettlementHours' },
    ],
  },
  {
    key: 'abnormal',
    label: t('me.workTime.groups.abnormal'),
    columns: [
      { label: t('me.workTime.fields.lateMinutes'), prop: 'lateMinutes' },
      { label: t('me.workTime.fields.lateCount'), prop: 'lateCount' },
      { label: t('me.workTime.fields.leaveEarlyMinutes'), prop: 'leaveEarlyMinutes' },
      { label: t('me.workTime.fields.leaveEarlyCount'), prop: 'leaveEarlyCount' },
      { label: t('me.workTime.fields.absenteeismHours'), prop: 'absenteeismHours' },
    ],
  },
  {
    key: 'correction',
    label: t('me.workTime.groups.correction'),
    columns: [
      { label: t('me.workTime.fields.correctionNormalHours'), prop: 'correctionNormalHours' },
      {
        label: t('me.workTime.fields.correctionNormalOverHours'),
        prop: 'correctionNormalOverHours',
      },
      {
        label: t('me.workTime.fields.correctionWeekendOverHours'),
        prop: 'correctionWeekendOverHours',
      },
      {
        label: t('me.workTime.fields.correctionHolidayOverHours'),
        prop: 'correctionHolidayOverHours',
      },
    ],
  },
]);

const punchTime = computed(() => pageInfo.value?.punchCardData || t('me.workTime.emptyValue'));

function isGroupExpanded(key) {
  const state = expandedGroups.value?.[key];
  return state !== false;
}

function toggleGroup(key) {
  expandedGroups.value = {
    ...expandedGroups.value,
    [key]: !isGroupExpanded(key),
  };
}

function handleBack() {
  goBackOrHome(router);
}

function formatValue(prop) {
  const raw = pageInfo.value?.[prop];
  if (raw === undefined || raw === null || raw === '') return '0';
  if (typeof raw === 'number') return raw.toLocaleString();
  const num = Number(raw);
  if (!Number.isNaN(num)) return num.toLocaleString();
  return raw;
}

function isZeroValue(prop) {
  const raw = pageInfo.value?.[prop];
  if (raw === undefined || raw === null || raw === '' || raw === '0') return true;
  const num = Number(raw);
  return !Number.isNaN(num) ? Number(num.toFixed(6)) === 0 : false;
}

async function fetchDetail() {
  loading.value = true;
  try {
    const res = await Api.user.getUserDailyAttendanceInfo({ attendanceDate: selectedDate.value });
    const { code, data, msg } = res.data || {};
    if (code === 200) {
      pageInfo.value = data || {};
    } else {
      pageInfo.value = {};
      showToast({ type: 'fail', message: msg || t('me.workTime.loadFail') });
    }
  } catch (error) {
    pageInfo.value = {};
    showToast({ type: 'fail', message: error?.message || t('me.workTime.loadFail') });
  } finally {
    loading.value = false;
  }
}

watch(
  selectedDate,
  () => {
    fetchDetail();
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
/* 统一定义导航高度，若你的 van-nav-bar 高度不同，请在此处调整 */
:root {
  --dc-nav-height: 46px;
}

.me-work-time {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 0 0 24px;
  padding-bottom: calc(96px + constant(safe-area-inset-bottom));
  padding-bottom: calc(96px + env(safe-area-inset-bottom));
  position: relative;

  &__body {
    display: flex;
    flex-direction: column;
    row-gap: 12px;
  }

  &__loading {
    position: fixed;
    inset: 0;
    background: rgba(255, 255, 255, 0.65);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1100;
  }
}

.card {
  background: #fff;
  border-radius: 0;
  box-shadow: none;
  overflow: hidden;

  &__title {
    padding: 16px;
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }
  &__content {
    padding: 0 16px 12px;
  }
  &__content--grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 8%;
  }
}

.card--collapsible {
  .card__title--toggle {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px;
    background: transparent;
    border: 0;
    font: inherit;
    color: inherit;
    text-align: left;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    color: #333;

    .van-icon {
      color: #848488;
      font-size: 18px;
    }
  }
}

.card__title--section {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

/* 其它字段 */
.field {
  flex: 1 1 46%;
  min-width: 140px;
  &__label {
    font-size: 14px;
    color: #848488;
  }
  &__value {
    margin-top: 8px;
    font-size: 16px;
    font-weight: 500;
    color: #333;
    &--zero {
      color: #848488;
    }
  }
}
.sign-detail .field {
  flex: 1 1 100%;
}

/* 淡入淡出 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.collapse-enter-active,
.collapse-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
