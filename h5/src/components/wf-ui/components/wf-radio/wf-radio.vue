<template>
  <div class="wf-radio" @click="handleClick">
    <van-radio-group v-model="text" :disabled="disabled">
      <van-radio v-for="(item, index) in dic" :key="index" :name="item[valueKey]">
        {{ item[labelKey] }}
      </van-radio>
    </van-radio-group>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { Radio, RadioGroup } from 'vant';
import Props from '../../mixins/props.js';

export default defineComponent({
  name: 'WfRadio',
  components: {
    [Radio.name]: Radio,
    [RadioGroup.name]: RadioGroup,
  },
  mixins: [Props],
});
</script>

<style lang="scss" scoped>
.wf-radio {
  width: 100%;
}
</style>
