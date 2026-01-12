<template>
  <div class="wf-switch">
    <van-switch
      v-model="checked"
      :active-value="activeValue"
      :inactive-value="inactiveValue"
      :disabled="disabled"
      size="24px"
      @change="onChange"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { Switch } from 'vant';
import Props from '../../mixins/props.js';

export default defineComponent({
  name: 'WfSwitch',
  components: {
    [Switch.name]: Switch,
  },
  mixins: [Props],
  data() {
    return { checked: false, activeValue: '1', inactiveValue: '0' };
  },
  watch: {
    text: {
      immediate: true,
      handler(val) {
        this.initValue();
        this.handleChange(val);
      },
    },
  },
  methods: {
    initValue() {
      const { dicData } = this.column;
      if (dicData && dicData.length === 2) {
        this.activeValue = dicData[1].value;
        this.inactiveValue = dicData[0].value;
      }
      this.checked = this.text == this.activeValue;
    },
    onChange(val) {
      this.text = val;
    },
  },
});
</script>

<style lang="scss" scoped>
.wf-switch {
  display: flex;
  align-items: center;
}
</style>
