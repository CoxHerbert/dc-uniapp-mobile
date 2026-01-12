<template>
  <div class="work-time-calendar">
    <div class="dc-cal__header">
      <van-icon name="arrow-left" class="dc-cal__arrow" @click="goPrevMonth" />
      <div class="dc-cal__title">
        <span class="dc-cal__month">{{ currentMonthLabel }}</span>
        <button class="dc-cal__year" type="button" @click="showYearPicker = true">
          {{ currentYearLabel }}
          <van-icon name="arrow-down" />
        </button>
      </div>
      <van-icon name="arrow" class="dc-cal__arrow" @click="goNextMonth" />
    </div>

    <div class="dc-cal__week">
      <div v-for="w in weekNames" :key="w" class="dc-cal__week-item">{{ w }}</div>
    </div>

    <div class="dc-cal__grid" :class="{ 'is-collapsed': isCollapsed }">
      <div v-for="(week, wIdx) in displayWeeks" :key="wIdx" class="dc-cal__row">
        <div
          v-for="cell in week"
          :key="cell.date"
          class="dc-cal__cell"
          :class="{
            'is-out': !cell.inMonth,
            'is-today': cell.date === today,
            'is-selected': cell.date === internalSelectedDate,
          }"
          @click="onCellClick(cell)"
        >
          <div v-if="cell.date === today" class="dc-cal__dot"></div>
          <span class="dc-cal__text">{{ cell.day }}</span>
        </div>
      </div>
    </div>

    <button class="dc-cal__bar" type="button" :aria-expanded="!isCollapsed" @click="toggleCollapse">
      <span class="dc-cal__bar-handle"></span>
    </button>

    <van-popup v-model:show="showYearPicker" round position="bottom" :safe-area-inset-bottom="true">
      <van-picker
        :columns="yearColumns"
        :default-index="yearDefaultIndex"
        :visible-option-num="5"
        :cancel-button-text="t('common.cancel')"
        :confirm-button-text="t('common.confirm')"
        @confirm="onYearConfirm"
        @cancel="showYearPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  modelValue: {
    type: String,
    default: () => dayjs().format('YYYY-MM-DD'),
  },
  defaultCollapsed: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['update:modelValue', 'date-change']);

const { t, tm } = useI18n();

const today = dayjs().format('YYYY-MM-DD');
const internalSelectedDate = ref(props.modelValue || today);
const visibleMonth = ref(dayjs(internalSelectedDate.value).startOf('month'));
const isCollapsed = ref(props.defaultCollapsed);
const showYearPicker = ref(false);

watch(
  () => props.modelValue,
  (val) => {
    if (val && val !== internalSelectedDate.value) {
      internalSelectedDate.value = val;
      visibleMonth.value = dayjs(val).startOf('month');
    }
  }
);

const defaultWeekNames = ['一', '二', '三', '四', '五', '六', '日'];

const weekNames = computed(() => {
  const names = typeof tm === 'function' ? tm('me.workTime.weekNames') : null;
  if (Array.isArray(names) && names.length === 7) {
    return names;
  }
  return defaultWeekNames;
});

function getTranslationWithFallback(key, params, fallback) {
  const translated = t(key, params);
  if (translated && translated !== key) {
    return translated;
  }
  return fallback;
}

function formatMonthLabel(monthValue) {
  return getTranslationWithFallback(
    'me.workTime.monthLabel',
    { month: monthValue },
    `${monthValue}月`
  );
}

function formatYearLabel(yearValue) {
  return getTranslationWithFallback('me.workTime.yearLabel', { year: yearValue }, `${yearValue}年`);
}

function formatYearOption(yearValue) {
  const fallback = formatYearLabel(yearValue);
  return getTranslationWithFallback('me.workTime.yearOption', { year: yearValue }, fallback);
}

const currentMonthLabel = computed(() => formatMonthLabel(visibleMonth.value.format('M')));
const currentYearLabel = computed(() => formatYearLabel(visibleMonth.value.format('YYYY')));

const currentYear = computed(() => dayjs().year());

const yearColumns = computed(() => {
  const list = [];
  const maxYear = currentYear.value;
  const minYear = maxYear - 10;
  for (let y = maxYear; y >= minYear; y -= 1) {
    list.push({ text: formatYearOption(y), value: y });
  }
  return list;
});

const yearDefaultIndex = computed(() => {
  const idx = yearColumns.value.findIndex((i) => i.value === currentYear.value);
  return idx >= 0 ? idx : yearColumns.value.length - 1;
});

function buildMonthWeeks(baseMonth) {
  const first = baseMonth.startOf('month');
  const last = baseMonth.endOf('month');
  const monthStr = first.format('YYYY-MM');

  const mondayOffset = (first.day() + 6) % 7;
  const daysInMonth = last.date();

  const cells = [];
  for (let i = 0; i < mondayOffset; i++) {
    const d = first.subtract(mondayOffset - i, 'day');
    cells.push({
      date: d.format('YYYY-MM-DD'),
      day: d.date(),
      inMonth: false,
    });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const d = dayjs(`${monthStr}-${String(i).padStart(2, '0')}`);
    cells.push({
      date: d.format('YYYY-MM-DD'),
      day: i,
      inMonth: true,
    });
  }
  const remain = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= remain; i++) {
    const d = last.add(i, 'day');
    cells.push({
      date: d.format('YYYY-MM-DD'),
      day: d.date(),
      inMonth: false,
    });
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

const allWeeks = computed(() => buildMonthWeeks(visibleMonth.value));

const activeWeekIndex = computed(() => {
  const idx = allWeeks.value.flat().findIndex((c) => c.date === internalSelectedDate.value);
  return idx >= 0 ? Math.floor(idx / 7) : 0;
});

const displayWeeks = computed(() =>
  isCollapsed.value ? [allWeeks.value[activeWeekIndex.value] || allWeeks.value[0]] : allWeeks.value
);

function emitSelectedDate(nextDate) {
  const formatted = dayjs(nextDate).format('YYYY-MM-DD');
  if (formatted === internalSelectedDate.value) {
    return formatted;
  }
  internalSelectedDate.value = formatted;
  emit('update:modelValue', formatted);
  emit('date-change', formatted);
  return formatted;
}

function onCellClick(cell) {
  if (!cell.inMonth) {
    const nextDate = emitSelectedDate(cell.date);
    visibleMonth.value = dayjs(nextDate).startOf('month');
  } else {
    emitSelectedDate(cell.date);
  }
}

function goPrevMonth() {
  visibleMonth.value = visibleMonth.value.subtract(1, 'month');
}

function goNextMonth() {
  visibleMonth.value = visibleMonth.value.add(1, 'month');
}

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
}

function onYearConfirm({ selectedOptions }) {
  const y = selectedOptions?.[0]?.value;
  if (typeof y === 'number') {
    const newMonth = visibleMonth.value.year(y);
    const current = dayjs(internalSelectedDate.value);
    if (!current.isSame(newMonth, 'year')) {
      const safeDay = Math.min(current.date(), newMonth.endOf('month').date());
      const nextSelected = newMonth.date(safeDay).format('YYYY-MM-DD');
      emitSelectedDate(nextSelected);
    }
    visibleMonth.value = newMonth.startOf('month');
  }
  showYearPicker.value = false;
}

watch(visibleMonth, (m) => {
  const current = dayjs(internalSelectedDate.value);
  if (!current.isSame(m, 'month')) {
    const safeDay = Math.min(current.date(), m.endOf('month').date());
    const nextSelected = m.date(safeDay).format('YYYY-MM-DD');
    emitSelectedDate(nextSelected);
  }
});
</script>

<style scoped lang="scss">
.work-time-calendar {
  display: flex;
  flex-direction: column;
}

.dc-cal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  margin-bottom: 8px;
  user-select: none;
}

.dc-cal__arrow {
  font-size: 18px;
  color: #333;
  padding: 6px;
  border-radius: 8px;

  &:active {
    background: #f2f3f5;
  }
}

.dc-cal__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.dc-cal__month {
  min-width: 56px;
  text-align: right;
}

.dc-cal__year {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 999px;
  border: 0;
  background: #f2f3f5;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.dc-cal__week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 6px 0;
  color: #848488;
  font-size: 12px;
}

.dc-cal__week-item {
  text-align: center;
}

.dc-cal__grid {
  position: relative;
  display: grid;
  grid-auto-rows: 44px;
  gap: 6px;
  margin-top: 4px;

  &.is-collapsed {
    grid-auto-rows: 44px;
  }
}

.dc-cal__row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.dc-cal__cell {
  position: relative;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  font-size: 15px;
  background: #fff;

  &.is-out {
    color: #c5c8ce;
  }

  &.is-today .dc-cal__text {
    font-weight: 700;
  }

  &.is-selected {
    background: rgba(48, 96, 237, 0.08);
    box-shadow: inset 0 0 0 2px #3060ed;
    color: #3060ed;

    .dc-cal__text {
      font-weight: 700;
    }
  }
}

.dc-cal__dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3060ed;
}

.dc-cal__text {
  line-height: 1;
}

.dc-cal__bar {
  margin: 6px auto 0;
  padding: 6px 0 2px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: 0;
  cursor: pointer;
  color: #848488;
  font-size: 13px;
}

.dc-cal__bar:active {
  opacity: 0.8;
}

.dc-cal__bar-handle {
  width: 54px;
  height: 4px;
  background: #000;
  border-radius: 999px;
}

.dc-cal__bar-icon {
  font-size: 14px;
}
</style>
