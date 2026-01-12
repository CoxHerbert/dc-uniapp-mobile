<template>
  <div class="wf-slider">
    <van-slider
      v-model="sliderValue"
      :min="column.min ?? 0"
      :max="column.max ?? 100"
      :step="column.step ?? 1"
      :range="!!column.range"
      :disabled="disabled"
      @change="onSliderChange"
    />
    <span class="wf-slider__text">{{ showText }}</span>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { Slider } from 'vant';
import Props from '../../mixins/props.js';

export default defineComponent({
  name: 'WfSlider',
  components: {
    [Slider.name]: Slider,
  },
  mixins: [Props],
  data() {
    return {
      sliderValue: 0,
    };
  },
  computed: {
    showText() {
      if (Array.isArray(this.sliderValue)) {
        return this.sliderValue.join(',');
      }
      return this.sliderValue;
    },
  },
  watch: {
    text: {
      immediate: true,
      handler() {
        this.initValue();
      },
    },
  },
  methods: {
    initValue() {
      if (this.column.range) {
        const [start = 0, end = 0] = Array.isArray(this.text)
          ? this.text
          : (this.text || '').split(',').map((v) => Number(v));
        this.sliderValue = [start || 0, end || 0];
      } else {
        const value = Array.isArray(this.text) ? this.text[0] : Number(this.text);
        this.sliderValue = Number.isNaN(value) ? 0 : value || 0;
      }
    },
    onSliderChange(val) {
      if (this.column.range) {
        const valueArray = Array.isArray(val) ? val : this.sliderValue;
        this.text = valueArray;
        this.handleChange(valueArray);
      } else {
        const valueNumber = Array.isArray(val) ? val[0] : val;
        this.text = valueNumber;
        this.handleChange(valueNumber);
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.wf-slider {
  display: flex;
  align-items: center;
  gap: 8px;
  &__text {
    min-width: 60px;
  }
}
</style>
