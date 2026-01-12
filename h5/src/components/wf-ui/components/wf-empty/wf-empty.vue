<template>
  <van-empty
    :image="resolvedImage"
    :description="text"
    :style="{ fontSize: fontSizeStyle, ...imageSizeStyle }"
  />
</template>

<script>
import { defineComponent } from 'vue';
import { Empty } from 'vant';
import emptyIllustration from '@/views/plugin/workflow/static/images/public/empty.svg';

export default defineComponent({
  name: 'WfEmpty',
  components: {
    [Empty.name]: Empty,
  },
  props: {
    text: { type: String, default: '暂无数据' },
    mode: { type: String, default: 'list' },
    src: { type: String, default: '' },
    iconSize: { type: [String, Number], default: 145 },
    fontSize: { type: [String, Number], default: 30 },
  },
  computed: {
    resolvedImage() {
      return this.src || emptyIllustration;
    },
    imageSizeStyle() {
      const size = typeof this.iconSize === 'number' ? `${this.iconSize}px` : this.iconSize;
      return { '--van-empty-image-size': size };
    },
    fontSizeStyle() {
      return typeof this.fontSize === 'number' ? `${this.fontSize}px` : this.fontSize;
    },
  },
});
</script>

<style scoped>
.van-empty {
  width: 100%;
}
</style>
