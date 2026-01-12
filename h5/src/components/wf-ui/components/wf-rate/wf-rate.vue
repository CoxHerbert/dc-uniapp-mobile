<template>
  <div class="wf-rate">
    <van-rate
      v-model="text"
      :count="column.max || 5"
      :color="activeColor"
      :void-color="voidColor"
      :disabled="disabled"
      :allow-half="column.allowHalf"
    />
    <span v-if="column.showText && column.texts && column.texts[text - 1]" class="wf-rate__text">
      {{ column.texts[text - 1] }}
    </span>
    <span v-else-if="column.showScore && !column.showText" class="wf-rate__text">{{ text }}</span>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { Rate } from 'vant';
import Props from '../../mixins/props.js';

export default defineComponent({
  name: 'WfRate',
  components: {
    [Rate.name]: Rate,
  },
  mixins: [Props],
  data() {
    return { text: 0 };
  },
  computed: {
    activeColor() {
      return Array.isArray(this.column.colors) ? this.column.colors[0] : undefined;
    },
    voidColor() {
      if (Array.isArray(this.column.colors)) {
        return this.column.colors[1] || undefined;
      }
      return undefined;
    },
  },
});
</script>

<style lang="scss" scoped>
.wf-rate {
  &__text {
    margin-left: 8px;
  }
}
</style>
