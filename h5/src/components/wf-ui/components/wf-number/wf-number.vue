<template>
  <div class="wf-number">
    <van-stepper
      v-model="number"
      :min="column.min ?? 0"
      :max="column.max ?? Number.MAX_SAFE_INTEGER"
      :step="column.step ?? 1"
      :disabled="disabled"
      @change="handleStepperChange"
      @focus="handleFocus"
      @blur="handleBlur"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { Stepper } from 'vant';
import Props from '../../mixins/props.js';

export default defineComponent({
  name: 'WfNumber',
  components: {
    [Stepper.name]: Stepper,
  },
  mixins: [Props],
  data() {
    return { number: undefined };
  },
  watch: {
    text: {
      immediate: true,
      handler(val) {
        const numeric = val === '' || val === undefined || val === null ? undefined : Number(val);
        this.number = Number.isNaN(numeric) ? undefined : numeric;
      },
    },
    number(val) {
      this.text = val;
    },
  },
  methods: {
    handleStepperChange() {
      this.handleChange(this.number);
    },
  },
});
</script>

<style lang="scss" scoped>
.wf-number {
  width: 100%;
}
</style>
