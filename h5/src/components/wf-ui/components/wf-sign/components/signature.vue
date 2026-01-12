<template>
  <van-popup v-model:show="show" round position="bottom" closeable :style="{ height: '70vh' }">
    <div class="wf-signature">
      <div class="wf-signature__title">签名</div>
      <div class="wf-signature__canvas" :style="canvasStyle">
        <canvas
          ref="canvas"
          class="wf-signature__board"
          @pointerdown.prevent="onPointerDown"
          @pointermove.prevent="onPointerMove"
          @pointerup.prevent="onPointerUp"
          @pointerleave.prevent="onPointerUp"
        ></canvas>
      </div>
      <div class="wf-signature__buttons">
        <van-button size="small" type="default" class="wf-signature__button" @click="rewrite">重签</van-button>
        <van-button size="small" type="primary" class="wf-signature__button" @click="submit">提交</van-button>
      </div>
    </div>
  </van-popup>
</template>

<script>
import { computed, defineComponent, nextTick, ref } from 'vue';
import { Button, Popup, Toast } from 'vant';

export default defineComponent({
  name: 'SignaturePad',
  components: {
    [Popup.name]: Popup,
    [Button.name]: Button,
  },
  setup(_, { expose }) {
    const show = ref(false);
    const canvas = ref(null);
    const width = ref(660);
    const height = ref(500);
    const lineColor = ref('#000');
    const ctx = ref(null);
    const drawing = ref(false);
    const hasDrawn = ref(false);
    let resolveHandler;
    let rejectHandler;

    const canvasStyle = computed(() => ({
      width: `${width.value}px`,
      height: `${height.value}px`,
    }));

    const initCanvas = () => {
      const el = canvas.value;
      if (!el) return;
      const dpr = window.devicePixelRatio || 1;
      el.width = width.value * dpr;
      el.height = height.value * dpr;
      el.style.width = `${width.value}px`;
      el.style.height = `${height.value}px`;
      const context = el.getContext('2d');
      context.scale(dpr, dpr);
      context.lineWidth = 2;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = lineColor.value;
      context.fillStyle = '#fff';
      context.fillRect(0, 0, width.value, height.value);
      ctx.value = context;
      hasDrawn.value = false;
    };

    const getPoint = (event) => {
      const rect = canvas.value.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    };

    const onPointerDown = (event) => {
      if (!ctx.value) return;
      drawing.value = true;
      hasDrawn.value = true;
      const { x, y } = getPoint(event);
      ctx.value.beginPath();
      ctx.value.moveTo(x, y);
    };

    const onPointerMove = (event) => {
      if (!drawing.value || !ctx.value) return;
      const { x, y } = getPoint(event);
      ctx.value.lineTo(x, y);
      ctx.value.stroke();
    };

    const onPointerUp = () => {
      if (!drawing.value) return;
      drawing.value = false;
      if (ctx.value) {
        ctx.value.closePath();
      }
    };

    const rewrite = () => {
      if (!ctx.value) return;
      ctx.value.clearRect(0, 0, width.value, height.value);
      ctx.value.fillStyle = '#fff';
      ctx.value.fillRect(0, 0, width.value, height.value);
      hasDrawn.value = false;
    };

    const submit = () => {
      if (!hasDrawn.value) {
        Toast.fail('请在框内签字');
        return;
      }
      const el = canvas.value;
      const dataUrl = el.toDataURL('image/png', 1.0);
      if (resolveHandler) {
        resolveHandler(dataUrl);
      }
      resolveHandler = null;
      rejectHandler = null;
      show.value = false;
    };

    const sign = ({ width: w = '660', height: h = '500', color = '#000' } = {}) => {
      return new Promise((resolve, reject) => {
        const widthNumber = Number(String(w).replace(/px|rpx/g, ''));
        const heightNumber = Number(String(h).replace(/px|rpx/g, ''));
        width.value = Number.isNaN(widthNumber) ? 660 : widthNumber;
        height.value = Number.isNaN(heightNumber) ? 500 : heightNumber;
        lineColor.value = color || '#000';
        resolveHandler = resolve;
        rejectHandler = reject;
        show.value = true;
        nextTick(() => {
          initCanvas();
        });
      });
    };

    expose({ sign });

    return {
      show,
      canvas,
      canvasStyle,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      rewrite,
      submit,
    };
  },
});
</script>

<style lang="scss" scoped>
.wf-signature {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;

  &__title {
    text-align: center;
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
  }

  &__canvas {
    flex: 1;
    border: 1px dashed #979797;
    background: #fff;
  }

  &__board {
    width: 100%;
    height: 100%;
    touch-action: none;
  }

  &__buttons {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
  }

  &__button {
    flex: 1;
    margin: 0 8px;
  }
}
</style>
