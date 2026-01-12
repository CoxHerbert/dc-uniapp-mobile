import { ref, onMounted, watch, isRef } from 'vue';
import Api from '@/api'; // 👉 你的 Api 实例，需保证存在 Api.dcit.getDict

/**
 * 把扁平数组构造成树，并映射到 {label,value,children}
 */
export function buildTreeFromFlat(list, opts = {}) {
  const {
    id = 'id',
    parent = 'parentId',
    label = 'dictValue',
    value = 'dictKey',
    classKey = 'listClass',
    // 识别为根节点的 parent 值
    rootParents = [null, undefined, 0, '0', '', '-1'],
  } = opts;

  const arr = Array.isArray(list) ? list : [];
  const byId = new Map();
  const nodes = arr.map((it) => {
    const n = {
      label: it?.[label] ?? it?.label ?? '',
      value: it?.[value] ?? it?.value ?? '',
      id: it?.[id] ?? it?.value,
      parentId: it?.[parent],
      className: it?.[classKey],
      children: [],
      raw: it,
    };
    byId.set(String(n.id ?? n.value), n);
    return n;
  });

  const roots = [];
  for (const n of nodes) {
    const pid = n.parentId;
    const isRoot = rootParents.some((v) => String(v) === String(pid)) || pid == null;
    if (isRoot) roots.push(n);
    else {
      const p = byId.get(String(pid));
      if (p) p.children.push(n);
      else roots.push(n);
    }
  }

  // 移除空 children，避免 UI 误判为可展开
  const prune = (list) =>
    list.map((x) => {
      if (!x.children || x.children.length === 0) {
        const { children, ...rest } = x;
        return rest;
      }
      x.children = prune(x.children);
      return x;
    });

  return prune(roots);
}

/**
 * 兼容未知 payload：从常见包裹层里取出数组
 */
export function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.list)) return payload.list;
  if (Array.isArray(payload?.records)) return payload.records;
  return [];
}

/**
 * 请求后端并转为 {label,value,children} 树
 * @param {string} code 字典编码，如 'DC_FORWARD_STATUS'
 * @param {object} options 字段映射/根父配置
 */
export async function getDictTree(code, options = {}) {
  // 👉 假设你的接口：Api.dcit.getDict({ code })
  const res = await Api.dcit.getDict({ code });
  const list = extractList(res);
  return buildTreeFromFlat(list, options);
}

/**
 * 扁平化树，得到 [{label,value}]（用于普通 Select）
 */
export function flattenTree(tree, includeParents = true) {
  const out = [];
  const walk = (arr) => {
    for (const n of arr || []) {
      if (includeParents || !(n.children && n.children.length)) {
        out.push({ label: n.label, value: n.value });
      }
      if (n.children && n.children.length) walk(n.children);
    }
  };
  walk(Array.isArray(tree) ? tree : []);
  return out;
}

/**
 * Vue 组合式：自动拉取并提供给 Cascader 使用
 */
export function useDictCascader(code, options = {}) {
  const optionsRef = ref([]);
  const loading = ref(false);
  const codeRef = isRef(code) ? code : ref(code);

  const load = async () => {
    loading.value = true;
    try {
      optionsRef.value = await getDictTree(codeRef.value, options);
    } finally {
      loading.value = false;
    }
  };

  onMounted(load);
  watch(codeRef, load);

  return { options: optionsRef, loading, reload: load };
}
