<template>
  <div
    ref="wrap"
    class="dc-scroll"
    :class="{
      'dc-scroll--momentum': momentum,
      'dc-scroll--no-bounce': !bounce,
      'dc-scroll--safe': safeAreaPadding,
    }"
    :style="computedStyle"
    @scroll.passive="handleScroll"
  >
    <!-- 顶部观测点（可选） -->
    <div
      v-if="observeStart"
      ref="startSentinel"
      class="dc-scroll__sentinel dc-scroll__sentinel--start"
    ></div>

    <!-- 内容 -->
    <slot></slot>

    <!-- 底部观测点（用于触底加载） -->
    <div v-if="observeEnd" ref="endSentinel" class="dc-scroll__sentinel"></div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
  defineProps,
  defineEmits,
  defineExpose,
} from 'vue';

/**
 * Props
 */
const props = defineProps({
  /** 是否使用“视口适配高度”，启用后高度 = 100 * var(--vh) - topOffset - bottomOffset */
  fitViewport: { type: Boolean, default: true },
  /** 顶部/底部要额外扣除的像素（例如固定导航条高度、底部 TabBar 高度） */
  topOffset: { type: Number, default: 0 },
  bottomOffset: { type: Number, default: 0 },

  /** 是否启用 iOS 惯性滚动 */
  momentum: { type: Boolean, default: true },
  /** 是否允许 iOS 弹性回弹；false 时阻止容器边界回弹（不影响容器内部滚动） */
  bounce: { type: Boolean, default: true },

  /** 到顶/到底阈值（像素），用于更早触发回调 */
  threshold: { type: Number, default: 80 },

  /** 触底观察器 */
  observeEnd: { type: Boolean, default: true },
  /** 触顶观察器 */
  observeStart: { type: Boolean, default: false },

  /** v-model:scrollTop */
  scrollTop: { type: Number, default: 0 },

  /** 是否给安全区添加内边距（适配刘海/底部 Home 区域） */
  safeAreaPadding: { type: Boolean, default: true },

  /** 自定义最大高度（不启用 fitViewport 时可手动传入） */
  maxHeight: { type: String, default: '' },

  /** overscroll-behavior 值：'auto' | 'contain' | 'none'（iOS16+ 有效，其它浏览器也适用） */
  overscrollBehavior: { type: String, default: 'contain' }, // 阻断页面级回弹串扰
});

const emit = defineEmits([
  'update:scrollTop',
  'scroll',
  'reach-top',
  'reach-bottom',
  'observe-start',
  'observe-end',
]);

/**
 * DOM refs
 */
const wrap = ref(null);
const endSentinel = ref(null);
const startSentinel = ref(null);

let ioEnd = null;
let ioStart = null;

/**
 * 设备判定
 */
const isIOS = (() => {
  if (typeof navigator === 'undefined') return false;
  return /iP(hone|od|ad)/.test(navigator.platform) || /iOS|iPadOS/.test(navigator.userAgent);
})();

/**
 * 计算样式
 * - 使用 --vh 修复 iOS 100vh 问题
 */
const computedStyle = computed(() => {
  const style = {
    overscrollBehavior: props.overscrollBehavior, // 现代浏览器生效；iOS <16 用 JS 兜底
  };

  if (props.fitViewport) {
    style.height = `calc(var(--vh, 1vh) * 100 - ${props.topOffset}px - ${props.bottomOffset}px)`;
  } else if (props.maxHeight) {
    style.maxHeight = props.maxHeight;
  }

  return style;
});

/**
 * 同步 --vh
 */
function setVHUnit() {
  if (typeof window === 'undefined') return;
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

/**
 * Scroll 事件
 */
function handleScroll(e) {
  const el = e.target;
  emit('update:scrollTop', el.scrollTop);
  emit('scroll', {
    scrollTop: el.scrollTop,
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
  });

  const nearTop = el.scrollTop <= props.threshold;
  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= props.threshold;

  if (nearTop) emit('reach-top', el.scrollTop);
  if (nearBottom) emit('reach-bottom', el.scrollHeight);
}

/**
 * 观察器：触底/触顶
 */
function setupObservers() {
  teardownObservers();
  if (typeof IntersectionObserver === 'undefined') return;

  if (props.observeEnd && endSentinel.value) {
    ioEnd = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) emit('observe-end');
        });
      },
      { root: wrap.value, threshold: 0.01 }
    );
    ioEnd.observe(endSentinel.value);
  }

  if (props.observeStart && startSentinel.value) {
    ioStart = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) emit('observe-start');
        });
      },
      { root: wrap.value, threshold: 0.01 }
    );
    ioStart.observe(startSentinel.value);
  }
}

function teardownObservers() {
  if (ioEnd) {
    ioEnd.disconnect();
    ioEnd = null;
  }
  if (ioStart) {
    ioStart.disconnect();
    ioStart = null;
  }
}

/**
 * iOS 回弹兜底：当到顶下拉或到底上拉时阻止默认回弹
 * - 仅在 bounce=false 时生效
 */
let startY = 0;
function onTouchStart(e) {
  if (!wrap.value) return;
  startY = e.touches ? e.touches[0].clientY : 0;
}

function onTouchMove(e) {
  if (!wrap.value || props.bounce) return;
  const el = wrap.value;
  const currentY = e.touches ? e.touches[0].clientY : 0;
  const dy = currentY - startY;

  const atTop = el.scrollTop <= 0;
  const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;

  // 1) 已在顶部且向下拉；2) 已在底部且向上推 —— 阻止页面级回弹
  if ((atTop && dy > 0) || (atBottom && dy < 0)) {
    // 仅阻止这一层容器的默认回弹，不影响内部滚动
    if (e.cancelable) e.preventDefault();
  }
}

/**
 * 方法暴露
 */
function scrollTo(y, behavior = 'auto') {
  if (!wrap.value) return;
  wrap.value.scrollTo({ top: y, behavior });
}
function scrollToTop(behavior = 'auto') {
  scrollTo(0, behavior);
}
function getEl() {
  return wrap.value;
}
function refreshVH() {
  setVHUnit();
}

defineExpose({ scrollTo, scrollToTop, getEl, refreshVH });

/**
 * 双向绑定：外部更新 scrollTop
 */
watch(
  () => props.scrollTop,
  async (v) => {
    if (!wrap.value) return;
    if (Math.abs(wrap.value.scrollTop - v) > 1) {
      await nextTick();
      wrap.value.scrollTop = v;
    }
  }
);

onMounted(() => {
  // 初始化 vh
  if (props.fitViewport) {
    setVHUnit();
    window.addEventListener('resize', setVHUnit, { passive: true });
    window.addEventListener('orientationchange', setVHUnit, { passive: true });
  }

  // iOS 弹性回弹兜底（仅在 bounce=false 时绑定，且 passive:false 以便 preventDefault）
  if (isIOS) {
    wrap.value.addEventListener('touchstart', onTouchStart, { passive: true });
    wrap.value.addEventListener('touchmove', onTouchMove, { passive: false });
  }

  setupObservers();

  // 初始化到指定 scrollTop
  if (wrap.value && props.scrollTop) {
    wrap.value.scrollTop = props.scrollTop;
  }
});

onBeforeUnmount(() => {
  if (props.fitViewport) {
    window.removeEventListener('resize', setVHUnit);
    window.removeEventListener('orientationchange', setVHUnit);
  }
  if (isIOS && wrap.value) {
    wrap.value.removeEventListener('touchstart', onTouchStart);
    wrap.value.removeEventListener('touchmove', onTouchMove);
  }
  teardownObservers();
});
</script>

<style scoped>
.dc-scroll {
  position: relative;
  width: 100%;
  /* 让子元素产生独立的合成层，提升滚动性能 */
  will-change: scroll-position;
  overflow: auto;

  /* 避免因为滚动条出现/消失导致布局抖动（Safari 17+ 支持；其他浏览器无害） */
  scrollbar-gutter: stable both-edges;

  /* 默认阻断滚动串扰（Chrome/Edge/Firefox/新 Safari 生效） */
  overscroll-behavior: contain;

  /* 修复 position: sticky 在滚动容器中的表现 */
  contain: paint layout style;
}

.dc-scroll--momentum {
  /* iOS 惯性滚动 */
  -webkit-overflow-scrolling: touch;
}

/* 当不允许回弹时，进一步用 CSS 限制新浏览器；旧 iOS 靠 JS 兜底 */
.dc-scroll--no-bounce {
  overscroll-behavior: none;
}

/* 安全区内边距（iOS 刘海、底部 Home 区域） */
.dc-scroll--safe {
  padding-top: max(0px, env(safe-area-inset-top));
  padding-bottom: max(0px, env(safe-area-inset-bottom));
}

/* 触发 IntersectionObserver 的哨兵元素 */
.dc-scroll__sentinel {
  width: 100%;
  height: 1px;
}
.dc-scroll__sentinel--start {
  margin-top: -1px; /* 更早进入可视区 */
}
</style>
