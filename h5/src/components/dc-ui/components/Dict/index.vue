<template>
  <!-- 单值：保持你原来的渲染 -->
  <span
    v-if="items.length <= 1"
    class="dict"
    :style="{ color: color || items[0]?.color || null }"
    :class="items[0]?.listClass"
  >
    {{ items[0]?.label ?? items[0]?.value ?? '-' }}
  </span>

  <!-- 多值：逐个渲染，之间用分隔符 / 或小圆点；也可改成 tag 风格 -->
  <span v-else class="dict dict-list">
    <template v-for="(it, idx) in items" :key="idx">
      <span class="dict-item" :class="it.listClass" :style="{ color: color || it.color || null }">
        {{ it.label ?? it.value ?? '-' }}
      </span>
    </template>
  </span>
</template>

<script setup>
import { computed, unref } from 'vue';

const props = defineProps({
  // 类型（保留）
  type: { type: String, default: '' },
  // 选项：支持 Array 或 Ref<Array>
  options: { type: [Array, Object], default: null },
  // 值：支持 string | number | Array<string|number>
  value: { type: [String, Number, Array], default: '' },
  // 单项统一颜色（若不传，优先用选项里的 it.color）
  color: { type: String, default: null },
  // 输入值分隔符（将 'a,b,c' 切成 ['a','b','c']）
  delimiter: { type: String, default: ',' },
});

// 安全获取数组形式的 options
const optionsArr = computed(() => {
  const raw = unref(props.options);
  return Array.isArray(raw) ? raw : [];
});

// 统一把 value 规范成数组（支持 'a,b' / ['a','b'] / 123）
const values = computed(() => {
  const v = props.value;
  if (v == null || v === '') return [];
  if (Array.isArray(v)) {
    return v
      .flatMap((x) => String(x).split(props.delimiter))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return String(v)
    .split(props.delimiter)
    .map((s) => s.trim())
    .filter(Boolean);
});

// 递归查找
function findDict(options, value) {
  for (const item of options) {
    // 兼容 value/label 以及后端 dictKey/dictValue 结构
    const itemVal = item.value ?? item.dictKey ?? item.code ?? item.key;
    if (String(itemVal) === String(value)) {
      return normalizeItem(item, value);
    }
    if (item.children && Array.isArray(item.children)) {
      const found = findDict(item.children, value);
      if (found) return found;
    }
  }
  // 没找到也返回占位，至少能把原始值展示出来
  return normalizeItem(null, value);
}

// 归一化：生成 { value, label, listClass, color }
function normalizeItem(item, fallbackValue) {
  if (!item) {
    return {
      value: String(fallbackValue),
      label: String(fallbackValue),
      listClass: 'dict-text',
      color: null,
    };
  }
  return {
    value: item.value ?? item.dictKey ?? item.code ?? item.key ?? String(fallbackValue),
    label: item.label ?? item.dictValue ?? item.name ?? item.value ?? String(fallbackValue),
    listClass: item.listClass ?? 'dict-text',
    color: item.color ?? null,
  };
}

const items = computed(() => {
  const opts = optionsArr.value;
  if (!opts.length) {
    // 没有 options 时，直接把 values 做成“原样占位”
    return values.value.map((v) => normalizeItem(null, v));
  }
  return values.value.map((v) => findDict(opts, v));
});
</script>

<style lang="scss" scoped>
.dict {
  display: inline-flex;
  align-items: center;
}

/* 多值容器 */
.dict-list {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0 3px;
}

/* 单个词元（可按需改成 tag 样式） */
.dict-item {
  display: inline-flex;
  line-height: 1.2;
}

/* 分隔符样式（可换成小圆点/竖线等） */
.dict-split {
  margin: 0 4px;
  opacity: 0.6;
}

/* 你之前的 listClass 可以继续生效，例如 .dict-text 等 */
</style>
