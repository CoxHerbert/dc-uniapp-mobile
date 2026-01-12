<template>
  <div :class="{ 'wf-flex-end': flexEnd }">
    <div
      class="wf-popup-list"
      :class="{ 'wf-popup-show': show, 'wf-z_index': show && position !== 'relative' }"
      :style="{
        width,
        backgroundColor,
        borderRadius: radius,
        color,
        position,
        left,
        right,
        bottom,
        top,
        transform: `translate(${translateX}, ${translateY})`,
      }"
    >
      <div
        v-if="direction === 'top'"
        class="wf-triangle"
        :style="{
          borderWidth,
          borderColor: `transparent transparent ${backgroundColor} transparent`,
          left: triangleLeft,
          right: triangleRight,
          top: triangleTop,
          bottom: triangleBottom,
        }"
      ></div>
      <div
        v-if="direction === 'bottom'"
        class="wf-triangle"
        :style="{
          borderWidth,
          borderColor: `${backgroundColor} transparent transparent transparent`,
          left: triangleLeft,
          right: triangleRight,
          top: triangleTop,
          bottom: triangleBottom,
        }"
      ></div>
      <div
        v-if="direction === 'left'"
        class="wf-triangle"
        :style="{
          borderWidth,
          borderColor: `transparent ${backgroundColor} transparent transparent`,
          left: triangleLeft,
          right: triangleRight,
          top: triangleTop,
          bottom: triangleBottom,
        }"
      ></div>
      <div
        v-if="direction === 'right'"
        class="wf-triangle"
        :style="{
          borderWidth,
          borderColor: `transparent transparent transparent ${backgroundColor}`,
          left: triangleLeft,
          right: triangleRight,
          top: triangleTop,
          bottom: triangleBottom,
        }"
      ></div>
      <slot></slot>
    </div>
    <div
      v-if="mask"
      class="wf-popup-mask"
      :class="{ 'wf-popup-show': show }"
      :style="{ backgroundColor: maskBgColor }"
      @touchmove.stop.prevent="stop"
      @click="handleClose"
    ></div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'WfPopover',
  props: {
    width: {
      type: String,
      default: '150px',
    },
    radius: {
      type: String,
      default: '4px',
    },
    left: {
      type: String,
      default: 'auto',
    },
    right: {
      type: String,
      default: 'auto',
    },
    top: {
      type: String,
      default: 'auto',
    },
    bottom: {
      type: String,
      default: 'auto',
    },
    translateX: {
      type: String,
      default: '0',
    },
    translateY: {
      type: String,
      default: '0',
    },
    backgroundColor: {
      type: String,
      default: '#4c4c4c',
    },
    color: {
      type: String,
      default: '#fff',
    },
    borderWidth: {
      type: String,
      default: '6px',
    },
    direction: {
      type: String,
      default: 'top',
    },
    triangleLeft: {
      type: String,
      default: 'auto',
    },
    triangleRight: {
      type: String,
      default: 'auto',
    },
    triangleTop: {
      type: String,
      default: 'auto',
    },
    triangleBottom: {
      type: String,
      default: 'auto',
    },
    position: {
      type: String,
      default: 'fixed',
    },
    flexEnd: {
      type: Boolean,
      default: false,
    },
    mask: {
      type: Boolean,
      default: true,
    },
    maskBgColor: {
      type: String,
      default: 'rgba(0, 0, 0, 0)',
    },
    show: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close'],
  methods: {
    handleClose() {
      if (!this.show) {
        return;
      }
      this.$emit('close', {});
    },
    stop() {
      return false;
    },
  },
});
</script>

<style scoped>
.wf-popup-list {
  z-index: 1;
  transition: all 0.3s ease-in-out;
  opacity: 0;
  visibility: hidden;
}

.wf-flex-end {
  width: 100%;
  display: flex;
  justify-content: flex-end;
}

.wf-triangle {
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
  z-index: 997;
}

.wf-popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 995;
  transition: all 0.3s ease-in-out;
  opacity: 0;
  visibility: hidden;
}

.wf-popup-show {
  opacity: 1;
  visibility: visible;
}

.wf-z_index {
  z-index: 999;
}
</style>
