<template>
  <!-- 标签模式 -->
  <div v-if="type === 'tag'" class="dc-tag-rows">
    <van-tag
      v-for="(text, idx) in displayItems"
      :key="`${objectName}-${idx}-${text}`"
      class="dc-tag"
      :color="bgColor"
      :text-color="textColor"
      round
    >
      {{ text || '-' }}
    </van-tag>
    <!-- 空态（当没有任何可展示的标签时） -->
    <span v-if="!displayItems.length" class="dc-tag__empty">-</span>
  </div>

  <!-- 文本模式 -->
  <div v-else class="dc-view">
    {{ viewText || props.modelValue || '-' }}
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import cacheRequest from './../../util/request';
// import ComponentApi from './../../api/index';
import cacheData from './../../constant/cacheData';

const props = defineProps({
  // 展示类型：'text' | 'tag'
  type: { type: String, default: 'text' },

  // 标签背景色与文字色
  bgColor: { type: String, default: 'rgb(252.5, 245.7, 235.5)' },
  textColor: { type: String, default: '#e6a23c' },

  // 需要展示的对象名（用于 cache & store 获取映射）
  objectName: { type: String, default: null },

  // 绑定值：支持 string | number | object | array
  modelValue: { type: [String, Number, Object, Array], default: null },

  // 文本展示优先的字段名（未传则走 currentObject.defaultLabel）
  showLabel: { type: String, default: null },
});

// 拉取后得到的条目（对象或原始 id）
const iptTagData = ref([]);

// 当前对象配置（含 url、defaultLabel 等）
const currentObject = computed(() => cacheData?.[props.objectName] ?? null);

// 根据 modelValue 解析成 id 数组
const parseIds = (val) => {
  if (Array.isArray(val)) return val.map((it) => it?.id ?? it).filter(Boolean);
  if (val && typeof val === 'object') return [val?.id].filter(Boolean);
  if (typeof val === 'string') return val.split(',').filter(Boolean);
  if (typeof val === 'number') return [String(val)];
  return [];
};

watch(
  [() => props.modelValue, currentObject],
  async ([newVal, object]) => {
    try {
      if (!object) {
        iptTagData.value = [];
        return;
      }

      const ids = parseIds(newVal);
      if (!ids.length) {
        iptTagData.value = [];
        return;
      }

      // 触发缓存/视图接口预取（维持你的原始逻辑）
      const viewData = await cacheRequest.getView({
        url: object.url,
        data: ids,
      });

      // 将 id 映射为对象（或保留原始 id）
      iptTagData.value = Array.isArray(viewData) ? viewData : [];
    } catch (error) {
      console.error(error);
      iptTagData.value = [];
    }
  },
  { deep: true, immediate: true }
);

// 计算展示字段名
const labelKey = computed(() => {
  return props.showLabel || currentObject.value?.defaultLabel || null;
});

// 供标签模式使用的数组
const displayItems = computed(() => {
  if (!Array.isArray(iptTagData.value) || !iptTagData.value.length) return [];
  return iptTagData.value
    .map((item) => {
      if (item && typeof item === 'object') {
        if (labelKey.value && item[labelKey.value] != null) return item[labelKey.value];
        if (item.id != null) return item.id;
        return '';
      }
      // 原始 id 字符串
      return item ?? '';
    })
    .filter((s) => s !== '');
});

// 供文本模式使用的逗号拼接字符串
const viewText = computed(() => {
  if (!displayItems.value.length) return '-';
  return displayItems.value.join(',');
});
</script>

<style lang="scss" scoped>
.dc-tag-rows {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 6px; // 行列间距
  vertical-align: middle;

  .dc-tag {
    // 仅做微调；颜色由 props 控制并交给 van-tag
    padding: 0 8px;
    font-size: 12px;
    line-height: 22px;
    height: 22px;
    border-radius: 6px;
  }

  .dc-tag__empty {
    font-size: 12px;
    color: #999;
    line-height: 22px;
    height: 22px;
    display: inline-flex;
    align-items: center;
  }
}

.dc-view {
  display: inline-block;
  vertical-align: middle;
}
</style>
