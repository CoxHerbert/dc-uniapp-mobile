<template>
  <div class="wf-checkbox" @click="handleClick">
    <van-checkbox-group v-model="checkedValues" :disabled="disabled">
      <van-checkbox v-for="(item, index) in normalizedOptions" :key="index" :name="item[valueKey]">
        {{ item[labelKey] }}
      </van-checkbox>
    </van-checkbox-group>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { Checkbox, CheckboxGroup } from 'vant';
import Props from '../../mixins/props.js';

export default defineComponent({
  name: 'WfCheckbox',
  components: {
    [Checkbox.name]: Checkbox,
    [CheckboxGroup.name]: CheckboxGroup,
  },
  mixins: [Props],
  data() {
    return {
      checkedValues: [],
    };
  },
  computed: {
    normalizedOptions() {
      return this.deepClone(this.dic || []);
    },
  },
  watch: {
    dic: {
      handler(val) {
        if (!this.validateNull(val)) {
          this.syncFromText();
        }
      },
      deep: true,
    },
    text: {
      immediate: true,
      handler() {
        this.syncFromText();
      },
    },
    checkedValues(val) {
      this.text = val.join(',');
    },
  },
  methods: {
    syncFromText() {
      if (this.validateNull(this.text)) {
        this.checkedValues = [];
        return;
      }
      const values = (this.text + '').split(',');
      this.checkedValues = values.filter((item) => item !== '');
    },
  },
});
</script>

<style lang="scss" scoped>
.wf-checkbox {
  width: 100%;
}
</style>
