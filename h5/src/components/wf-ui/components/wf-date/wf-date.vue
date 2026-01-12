<template>
  <div class="wf-date">
    <template v-if="isDateType">
      <van-field
        v-model="date"
        readonly
        is-link
        :placeholder="getPlaceholder(column)"
        :disabled="disabled"
        @click="openCalendar"
      >
        <template #right-icon>
          <van-icon
            v-if="!disabled && !!date"
            name="clear"
            class="wf-date__clear-icon"
            @click.stop="handleClear"
          />
        </template>
      </van-field>
    </template>
    <template v-else>
      <div class="wf-date__time">
        <van-field
          v-model="initStartDate"
          readonly
          is-link
          :placeholder="startPlaceholder"
          :disabled="disabled"
          input-align="center"
          @click="handleTimeFieldClick(startTimeMode)"
        >
          <template #right-icon>
            <van-icon
              v-if="!disabled && !!initStartDate"
              name="clear"
              class="wf-date__clear-icon"
              @click.stop="handleClear"
            />
          </template>
        </van-field>
        <template v-if="type === 6">
          <span class="wf-date__separator">至</span>
          <van-field
            v-model="initEndDate"
            readonly
            is-link
            :placeholder="endPlaceholder"
            :disabled="disabled"
            input-align="center"
            @click="handleTimeFieldClick('timerange-end')"
          >
            <template #right-icon>
              <van-icon
                v-if="!disabled && !!initEndDate"
                name="clear"
                class="wf-date__clear-icon"
                @click.stop="handleClear"
              />
            </template>
          </van-field>
        </template>
      </div>
    </template>

    <van-calendar
      v-model:show="showCalendar"
      teleport="body"
      :type="calendarMode"
      :show-confirm="true"
      :confirm-text="calendarConfirmText"
      :allow-same-day="true"
      :min-date="minDate"
      :max-date="maxDate"
      color="#1989fa"
      v-bind="calendarBindProps"
      @confirm="handleCalendarConfirm"
      @close="handleCalendarClose"
    >
      <!-- <template #footer>
        <div class="wf-date__footer">
          <van-button block type="danger" plain @click="handleCalendarClear"> 清空 </van-button>
        </div>
      </template> -->
    </van-calendar>

    <van-popup v-model:show="showTimePicker" position="bottom" teleport="body">
      <van-picker
        :columns="timeColumns"
        show-toolbar
        :title="timePickerTitle"
        @confirm="handleTimeConfirm"
        @cancel="handleTimeCancel"
      />
    </van-popup>
  </div>
</template>

<script>
import { defineComponent, nextTick } from 'vue';
import { Button, Calendar, Field, Picker, Popup, Icon } from 'vant';
import Props from '../../mixins/props.js';
import timeFormat from '../../util/timeFormat.js';

const TIME_MODES = {
  SINGLE: 'time',
  RANGE_START: 'timerange-start',
  RANGE_END: 'timerange-end',
  DATETIME: 'datetime',
  DATETIME_RANGE_START: 'datetimerange-start',
  DATETIME_RANGE_END: 'datetimerange-end',
};

export default defineComponent({
  name: 'WfDate',
  components: {
    [Field.name]: Field,
    [Popup.name]: Popup,
    [Picker.name]: Picker,
    [Calendar.name]: Calendar,
    [Button.name]: Button,
    [Icon.name]: Icon,
  },
  mixins: [Props],
  emits: ['update:modelValue', 'change', 'label-change'],
  data() {
    const today = new Date();
    return {
      date: '',
      initStartDate: '',
      initEndDate: '',
      startTime: '',
      endTime: '',
      showCalendar: false,
      showTimePicker: false,
      timePickerTitle: '时间',
      timeColumns: [],
      timePickerContext: {
        mode: '',
        date: '',
        defaultValue: '',
      },
      pendingDate: '',
      pendingRange: ['', ''],
      calendarDefaultDate: today,
      calendarDefaultRange: [today, today],
      minDate: new Date(1900, 0, 1),
      maxDate: new Date(2099, 11, 31),
    };
  },
  computed: {
    type() {
      switch (this.column.type) {
        case 'date':
          return 1;
        case 'daterange':
          return 2;
        case 'datetime':
          return 3;
        case 'datetimerange':
          return 4;
        case 'time':
          return 5;
        case 'timerange':
          return 6;
        default:
          return 1;
      }
    },
    valueFormat() {
      switch (this.column.type) {
        case 'date':
        case 'daterange':
          return 'yyyy-MM-dd';
        case 'datetime':
        case 'datetimerange':
          return 'yyyy-MM-dd HH:mm:ss';
        case 'time':
        case 'timerange':
          return 'HH:mm:ss';
        default:
          return 'yyyy-MM-dd';
      }
    },
    isDateType() {
      return [1, 2, 3, 4].includes(this.type);
    },
    calendarMode() {
      return [1, 3].includes(this.type) ? 'single' : 'range';
    },
    calendarConfirmText() {
      // datetime类型直接显示"确定"，因为不再需要第二步时间选择
      return '确定';
    },
    calendarBindProps() {
      if (this.calendarMode === 'single') {
        return {
          defaultDate: this.calendarDefaultDate,
        };
      }
      return {
        defaultRange: this.calendarDefaultRange,
      };
    },
    startPlaceholder() {
      if (this.type === 5) {
        return this.getPlaceholder(this.column);
      }
      return this.column.startPlaceholder || '开始时间';
    },
    endPlaceholder() {
      return this.column.endPlaceholder || '结束时间';
    },
    startTimeMode() {
      return this.type === 6 ? TIME_MODES.RANGE_START : TIME_MODES.SINGLE;
    },
  },
  watch: {
    text: {
      handler(newVal) {
        // 当text变化时，确保modelValue也同步更新
        if (newVal !== undefined && newVal !== this.modelValue) {
          this.$emit('update:modelValue', newVal);
        }
      },
      immediate: false,
    },
    modelValue: {
      handler(newVal) {
        // 确保modelValue变化时同步更新text
        if (newVal !== undefined && newVal !== this.text) {
          this.text = newVal;
        }
      },
      immediate: true,
    },
  },
  methods: {
    validate() {
      // 触发表单验证
      this.handleChange(this.text);
    },
    initValue() {
      const initVal = this.parseValueList(this.text);
      if (!this.validateNull(initVal)) {
        if ([1, 3, 5].includes(this.type)) {
          this.date = initVal[0] || '';
        } else if ([2, 4].includes(this.type)) {
          const label = initVal.filter((item) => !this.validateNull(item));
          this.date = label.join(' 至 ');
        } else {
          this.date = '';
        }

        const startVal = initVal[0];
        const endVal = initVal[1];

        this.initStartDate = startVal
          ? timeFormat(this.formatTime(startVal), this.valueFormat)
          : '';
        this.initEndDate = endVal ? timeFormat(this.formatTime(endVal), this.valueFormat) : '';

        this.startTime = this.extractTimeValue(startVal);
        this.endTime = this.extractTimeValue(endVal);
      } else {
        this.resetLocalState();
      }
    },
    formatTime(val) {
      if ([5, 6].includes(this.type)) {
        return val ? `2008-08-08 ${val}` : '';
      }
      return val;
    },
    parseValueList(value) {
      if (Array.isArray(value)) {
        return value;
      }
      if (this.validateNull(value)) {
        return [];
      }
      return `${value}`.split(',');
    },
    resetLocalState() {
      this.date = '';
      this.initStartDate = '';
      this.initEndDate = '';
      this.startTime = '';
      this.endTime = '';
      this.pendingDate = '';
      this.pendingRange = ['', ''];
    },
    openCalendar() {
      if (this.disabled) return;
      this.setCalendarDefaults();
      this.showCalendar = true;
      this.handleClick();
    },
    setCalendarDefaults() {
      if (this.calendarMode === 'single') {
        this.calendarDefaultDate = this.getCalendarDefaultDate();
      } else {
        this.calendarDefaultRange = this.getCalendarDefaultRange();
      }
    },
    getCalendarDefaultDate() {
      const base = this.date ? `${this.date}`.split(' ')[0] : '';
      return this.toDate(base);
    },
    getCalendarDefaultRange() {
      if (this.date && this.date.includes('至')) {
        const [start, end] = this.date.split(' 至 ');
        return [this.toDate(start), this.toDate(end)];
      }
      const today = new Date();
      return [today, today];
    },
    toDate(value) {
      if (!value) {
        return new Date();
      }
      const [datePart] = `${value}`.split(' ');
      const parsed = new Date(datePart.replace(/-/g, '/'));
      if (Number.isNaN(parsed.getTime())) {
        return new Date();
      }
      return parsed;
    },
    formatDate(date) {
      if (!(date instanceof Date)) {
        return '';
      }
      const year = date.getFullYear();
      const month = this.formatNumber(date.getMonth() + 1);
      const day = this.formatNumber(date.getDate());
      return `${year}-${month}-${day}`;
    },
    handleCalendarConfirm(value) {
      if (Array.isArray(value)) {
        const [start, end] = value;
        const startDate = this.formatDate(start);
        const endDate = this.formatDate(end || start);
        if (this.type === 2) {
          this.applyDateRange(startDate, endDate);
          this.showCalendar = false;
        } else {
          // datetime范围类型：直接应用默认时间，无需二次选择
          this.applyDateTimeRange(startDate, endDate, '12:00:00', '12:00:00');
          this.showCalendar = false;
        }
      } else {
        const dateStr = this.formatDate(value);
        if (this.type === 1) {
          this.applySingleDate(dateStr);
          this.showCalendar = false;
        } else if (this.type === 3) {
          // datetime类型：直接应用默认时间，无需二次选择
          this.applyDateTime(dateStr, '12:00:00');
          this.showCalendar = false;
        }
      }
    },
    applySingleDate(dateStr) {
      const formatted = timeFormat(this.formatTime(dateStr), this.valueFormat);
      this.initStartDate = formatted;
      this.initEndDate = '';
      this.date = formatted;
      this.text = dateStr;
    },
    applyDateRange(startDate, endDate) {
      const startFormatted = timeFormat(this.formatTime(startDate), this.valueFormat);
      const endFormatted = timeFormat(this.formatTime(endDate), this.valueFormat);
      this.initStartDate = startFormatted;
      this.initEndDate = endFormatted;
      this.date = `${startFormatted} 至 ${endFormatted}`;
      this.text = [startDate, endDate];
      // 确保触发modelValue更新
      this.$emit('update:modelValue', [startDate, endDate]);
    },
    // 新增：一键应用日期时间（单选）
    applyDateTime(dateStr, timeStr) {
      const combined = `${dateStr} ${timeStr}`;
      const formatted = timeFormat(this.formatTime(combined), this.valueFormat);
      this.initStartDate = formatted;
      this.initEndDate = '';
      this.date = formatted;
      this.text = combined;
      // 确保触发modelValue更新
      this.$emit('update:modelValue', combined);
      // 触发验证
      this.$nextTick(() => {
        this.handleChange(combined);
      });
    },
    // 新增：一键应用日期时间（范围）
    applyDateTimeRange(startDate, endDate, startTime, endTime) {
      const startCombined = `${startDate} ${startTime}`;
      const endCombined = `${endDate} ${endTime}`;
      const startFormatted = timeFormat(this.formatTime(startCombined), this.valueFormat);
      const endFormatted = timeFormat(this.formatTime(endCombined), this.valueFormat);
      this.initStartDate = startFormatted;
      this.initEndDate = endFormatted;
      this.date = `${startFormatted} 至 ${endFormatted}`;
      this.text = [startCombined, endCombined];
      // 确保触发modelValue更新
      this.$emit('update:modelValue', [startCombined, endCombined]);
    },
    handleCalendarClear() {
      this.handleClear();
      this.showCalendar = false;
    },
    handleCalendarClose() {
      this.showCalendar = false;
    },
    handleTimeFieldClick(mode) {
      if (this.disabled) return;

      // datetime类型不再打开时间选择器，而是直接打开日历
      if (this.type === 3 || this.type === 4) {
        this.openCalendar();
        return;
      }

      if (mode === TIME_MODES.RANGE_END && this.validateNull(this.initStartDate)) {
        this.openTimePicker(TIME_MODES.RANGE_START);
        return;
      }
      this.openTimePicker(mode);
    },
    openTimePicker(mode) {
      const context = {
        mode,
        date: '',
        defaultValue: '',
      };
      switch (mode) {
        case TIME_MODES.SINGLE:
          context.defaultValue = this.initStartDate || '00:00:00';
          this.timePickerTitle = '时间';
          break;
        case TIME_MODES.RANGE_START:
          context.defaultValue = this.initStartDate || '00:00:00';
          this.timePickerTitle = '开始时间';
          break;
        case TIME_MODES.RANGE_END:
          context.defaultValue = this.initEndDate || '00:00:00';
          this.timePickerTitle = '结束时间';
          break;
        case TIME_MODES.DATETIME:
          context.date = this.pendingDate;
          context.defaultValue = this.startTime || '00:00:00';
          this.timePickerTitle = '时间';
          break;
        case TIME_MODES.DATETIME_RANGE_START:
          context.date = this.pendingRange[0];
          context.defaultValue = this.startTime || '00:00:00';
          this.timePickerTitle = '开始时间';
          break;
        case TIME_MODES.DATETIME_RANGE_END:
          context.date = this.pendingRange[1];
          context.defaultValue = this.endTime || '00:00:00';
          this.timePickerTitle = '结束时间';
          break;
        default:
          this.timePickerTitle = '时间';
      }
      this.timePickerContext = context;
      this.timeColumns = this.createTimeColumns(context.defaultValue);
      this.showTimePicker = true;
      this.handleClick();
    },
    createTimeColumns(defaultValue) {
      const { hour, minute, second } = this.parseTimeValue(defaultValue);
      const hours = Array.from({ length: 24 }, (_, index) => this.formatNumber(index));
      const minutes = Array.from({ length: 60 }, (_, index) => this.formatNumber(index));
      const seconds = Array.from({ length: 60 }, (_, index) => this.formatNumber(index));
      return [
        { values: hours, defaultIndex: Math.max(hours.indexOf(hour), 0) },
        { values: minutes, defaultIndex: Math.max(minutes.indexOf(minute), 0) },
        { values: seconds, defaultIndex: Math.max(seconds.indexOf(second), 0) },
      ];
    },
    parseTimeValue(value) {
      const parts = `${value || ''}`.split(':');
      const [hour = '00', minute = '00', second = '00'] = parts;
      return {
        hour: this.formatNumber(hour),
        minute: this.formatNumber(minute),
        second: this.formatNumber(second),
      };
    },
    formatNumber(val) {
      const num = Number(val);
      if (Number.isNaN(num)) {
        return '00';
      }
      return String(num).padStart(2, '0');
    },
    extractTimeValue(value) {
      if (!value) return '';
      if ([5, 6].includes(this.type)) {
        return `${value}`;
      }
      if ([3, 4].includes(this.type)) {
        const [, timePart = ''] = `${value}`.split(' ');
        return timePart;
      }
      return '';
    },
    normalizePickerValues(payload) {
      if (Array.isArray(payload?.selectedValues)) {
        return payload.selectedValues;
      }
      if (Array.isArray(payload?.value)) {
        return payload.value;
      }
      if (Array.isArray(payload)) {
        return payload;
      }
      if (typeof payload?.selectedValue === 'string') {
        return payload.selectedValue.split(':');
      }
      if (typeof payload === 'string') {
        return payload.split(':');
      }
      return [];
    },
    handleTimeConfirm(payload) {
      const selected = this.normalizePickerValues(payload);
      const [hour, minute, second] = [0, 1, 2].map((index) => {
        const value = selected[index];
        return this.formatNumber(value !== undefined ? value : '00');
      });
      const result = `${hour}:${minute}:${second}`;
      const { mode } = this.timePickerContext;
      let reopenMode = '';

      if (mode === TIME_MODES.SINGLE) {
        this.initStartDate = result;
        this.initEndDate = '';
        this.date = result;
        this.text = result;
        this.$emit('update:modelValue', result);
      } else if (mode === TIME_MODES.RANGE_START) {
        this.initStartDate = result;
        this.startTime = result;
        reopenMode = TIME_MODES.RANGE_END;
      } else if (mode === TIME_MODES.RANGE_END) {
        this.initEndDate = result;
        this.endTime = result;
        this.text = [this.initStartDate, this.initEndDate];
        this.date = `${this.initStartDate} 至 ${this.initEndDate}`;
        this.$emit('update:modelValue', [this.initStartDate, this.initEndDate]);
      } else if (mode === TIME_MODES.DATETIME) {
        const combined = `${this.pendingDate} ${result}`;
        this.initStartDate = combined;
        this.initEndDate = '';
        this.date = timeFormat(this.formatTime(combined), this.valueFormat);
        this.text = combined;
        this.$emit('update:modelValue', combined);
      } else if (mode === TIME_MODES.DATETIME_RANGE_START) {
        this.startTime = result;
        this.initStartDate = `${this.pendingRange[0]} ${result}`;
        reopenMode = TIME_MODES.DATETIME_RANGE_END;
      } else if (mode === TIME_MODES.DATETIME_RANGE_END) {
        this.endTime = result;
        this.initEndDate = `${this.pendingRange[1]} ${result}`;
        const startLabel = timeFormat(this.formatTime(this.initStartDate), this.valueFormat);
        const endLabel = timeFormat(this.formatTime(this.initEndDate), this.valueFormat);
        this.date = `${startLabel} 至 ${endLabel}`;
        this.text = [this.initStartDate, this.initEndDate];
        this.$emit('update:modelValue', [this.initStartDate, this.initEndDate]);
        // 触发验证
        this.$nextTick(() => {
          this.handleChange([this.initStartDate, this.initEndDate]);
        });
      }

      if (reopenMode) {
        this.showTimePicker = false;
        nextTick(() => {
          this.openTimePicker(reopenMode);
        });
        return;
      }

      this.pendingDate = '';
      this.pendingRange = ['', ''];
      this.timePickerContext = {
        mode: '',
        date: '',
        defaultValue: '',
      };
      this.showTimePicker = false;
    },
    handleTimeCancel() {
      this.handleClear();
      this.showTimePicker = false;
    },
    handleClear() {
      if (this.stringMode) {
        this.text = '';
        this.$emit('update:modelValue', '');
      } else {
        this.text = [];
        this.$emit('update:modelValue', []);
      }
      this.resetLocalState();
      // 触发验证
      this.$nextTick(() => {
        this.handleChange(this.text);
      });
    },
    // 新增：选择当前日期时间
    handleSelectCurrentDateTime() {
      const now = new Date();
      const dateStr = this.formatDate(now);
      const timeStr = `${this.formatNumber(now.getHours())}:${this.formatNumber(now.getMinutes())}:${this.formatNumber(now.getSeconds())}`;

      if (this.type === 3) {
        // datetime单选
        this.applyDateTime(dateStr, timeStr);
      } else if (this.type === 4) {
        // datetime范围，开始和结束都用当前时间
        this.applyDateTimeRange(dateStr, dateStr, timeStr, timeStr);
      }
      this.showCalendar = false;
    },
    // 新增：选择中午12点
    handleSelectNoonTime() {
      const now = new Date();
      const dateStr = this.formatDate(now);

      if (this.type === 3) {
        this.applyDateTime(dateStr, '12:00:00');
      } else if (this.type === 4) {
        this.applyDateTimeRange(dateStr, dateStr, '12:00:00', '12:00:00');
      }
      this.showCalendar = false;
    },
    // 新增：选择晚上8点
    handleSelectNightTime() {
      const now = new Date();
      const dateStr = this.formatDate(now);

      if (this.type === 3) {
        this.applyDateTime(dateStr, '20:00:00');
      } else if (this.type === 4) {
        this.applyDateTimeRange(dateStr, dateStr, '20:00:00', '20:00:00');
      }
      this.showCalendar = false;
    },
  },
});
</script>

<style lang="scss" scoped>
.wf-date {
  width: 100%;

  &__time {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__separator {
    color: #969799;
    font-size: 14px;
  }

  &__footer {
    padding: 12px 16px 16px;
  }

  &__clear-icon {
    font-size: 16px;
    color: #c8c9cc;
  }

  // 新增：datetime类型的快速选择按钮样式
  &__datetime-footer {
    padding: 12px 16px;
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;

    .van-button {
      margin: 0;
      flex: 1;
      min-width: 80px;
    }
  }
}
</style>
