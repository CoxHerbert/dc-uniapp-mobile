<template>
  <div class="wf-date-vant">
    <!-- 日期选择器 -->
    <div class="date-section">
      <van-cell-group title="日期选择">
        <van-cell
          title="选择日期"
          :value="selectedDate || '请选择日期'"
          @click="showDatePicker = true"
          is-link
        />
      </van-cell-group>

      <van-popup v-model:show="showDatePicker" position="bottom">
        <van-date-picker
          v-model="currentDate"
          title="选择日期"
          :min-date="minDate"
          :max-date="maxDate"
          @confirm="onDateConfirm"
          @cancel="showDatePicker = false"
        />
      </van-popup>
    </div>

    <!-- 时间选择器 -->
    <div class="time-section">
      <van-cell-group title="时间选择">
        <van-cell
          title="选择时间"
          :value="selectedTime || '请选择时间'"
          @click="showTimePicker = true"
          is-link
        />
      </van-cell-group>

      <van-popup v-model:show="showTimePicker" position="bottom">
        <van-time-picker
          v-model="currentTime"
          title="选择时间"
          @confirm="onTimeConfirm"
          @cancel="showTimePicker = false"
        />
      </van-popup>
    </div>

    <!-- 日期时间选择器 -->
    <div class="datetime-section">
      <van-cell-group title="日期时间选择">
        <van-cell
          title="选择日期时间"
          :value="selectedDateTime || '请选择日期时间'"
          @click="showDateTimePicker = true"
          is-link
        />
      </van-cell-group>

      <van-popup v-model:show="showDateTimePicker" position="bottom">
        <van-date-picker
          v-model="currentDateTimeArr"
          type="datetime"
          title="选择日期时间"
          :min-date="minDateArr"
          :max-date="maxDateArr"
          :columns-type="['year', 'month', 'day', 'hour', 'minute']"
          @confirm="onDateTimeConfirm"
          @cancel="showDateTimePicker = false"
        />
      </van-popup>
    </div>

    <!-- 显示选中的结果 -->
    <div class="result-section" v-if="selectedDate || selectedTime || selectedDateTime">
      <van-cell-group title="选择结果">
        <van-cell v-if="selectedDate" title="日期" :value="selectedDate" />
        <van-cell v-if="selectedTime" title="时间" :value="selectedTime" />
        <van-cell v-if="selectedDateTime" title="日期时间" :value="selectedDateTime" />
      </van-cell-group>
    </div>
  </div>
</template>

<script>
import Props from '../../mixins/props.js';
export default {
  name: 'WfDateVant',
  mixins: [Props],
  data() {
    return {
      // 日期选择器相关
      showDatePicker: false,
      currentDate: ['2024', '01', '01'],
      selectedDate: '',

      // 时间选择器相关
      showTimePicker: false,
      currentTime: ['12', '00'],
      selectedTime: '',

      // 日期时间选择器相关
      showDateTimePicker: false,
      currentDateTime: new Date(),
      currentDateTimeArr: [],
      selectedDateTime: '',

      // 日期范围限制
      minDate: new Date(2020, 0, 1),
      maxDate: new Date(2030, 11, 31),
    };
  },

  methods: {
    // 日期确认事件
    onDateConfirm({ selectedValues }) {
      this.selectedDate = selectedValues.join('-');
      this.updateValue(this.selectedDate);
      this.showDatePicker = false;
    },

    // 时间确认事件
    onTimeConfirm({ selectedValues }) {
      this.selectedTime = selectedValues.join(':');
      this.updateValue(this.selectedTime);
      this.showTimePicker = false;
    },

    // 日期时间确认事件
    onDateTimeConfirm({ selectedValues }) {
      this.currentDateTimeArr = selectedValues;
      const [year, month, day, hour, minute] = selectedValues;
      const date = new Date(year, month - 1, day, hour, minute);
      this.selectedDateTime = this.formatDateTime(date);
      this.updateValue(this.selectedDateTime);
      this.showDateTimePicker = false;
    },

    // 格式化日期时间
    formatDateTime(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },

    // 更新值并触发事件
    updateValue(value) {
      this.text = value;
      this.handleChange(value);
    },

    // 初始化值
    initValue() {
      if (this.text) {
        // 根据column的type来决定初始化哪个值
        if (this.column.type === 'date') {
          this.selectedDate = this.text;
          const dateArr = this.text.split('-');
          if (dateArr.length === 3) {
            this.currentDate = dateArr;
          }
        } else if (this.column.type === 'time') {
          this.selectedTime = this.text;
          const timeArr = this.text.split(':');
          if (timeArr.length >= 2) {
            this.currentTime = [timeArr[0], timeArr[1]];
          }
        } else if (this.column.type === 'datetime') {
          this.selectedDateTime = this.text;
          this.currentDateTime = new Date(this.text);
          // 初始化数组格式 [年, 月, 日, 时, 分]
          const date = new Date(this.text);
          this.currentDateTimeArr = [
            date.getFullYear(),
            date.getMonth() + 1,
            date.getDate(),
            date.getHours(),
            date.getMinutes()
          ];
        }
      }
    },
  },

  watch: {
    text: {
      handler(val) {
        if (val) {
          this.initValue();
        }
      },
      immediate: true,
    },
  },

  computed: {
    minDateArr() {
      return [this.minDate.getFullYear(), this.minDate.getMonth() + 1, this.minDate.getDate(), 0, 0];
    },
    maxDateArr() {
      return [this.maxDate.getFullYear(), this.maxDate.getMonth() + 1, this.maxDate.getDate(), 23, 59];
    }
  },
  
  mounted() {
    this.initValue();
  },
};
</script>

<style scoped>
.wf-date-vant {
  padding: 16px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.date-section,
.time-section,
.datetime-section {
  margin-bottom: 20px;
}

.result-section {
  margin-top: 20px;
}

:deep(.van-cell-group__title) {
  padding: 16px 16px 8px;
  font-size: 14px;
  color: #969799;
}

:deep(.van-cell__value) {
  color: #323233;
  font-weight: 500;
}
</style>
