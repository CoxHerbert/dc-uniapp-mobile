// src/stores/dict.js
import { defineStore } from 'pinia';
import Api from '@/api'; // 确保存在 Api.dict.getDict（← 修正原来的 dcit 拼写）

const DEFAULT_TTL = 5 * 60 * 1000; // 5 分钟，可在运行时 setTTL(…) 调整
const inflight = new Map(); // key -> Promise 去重
const now = () => Date.now();

// ------- 提取后端列表 -------
function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  const p = payload?.data ?? payload;
  if (Array.isArray(p)) return p;
  if (Array.isArray(p?.data)) return p.data;
  if (Array.isArray(p?.list)) return p.list;
  if (Array.isArray(p?.records)) return p.records;
  return [];
}

// ------- 归一化到 {label,value,id,parentId,listClass,raw} -------
function normalizeFromObjects(list, fieldMap) {
  const {
    label = 'dictValue',
    value = 'dictKey',
    id = 'id',
    parent = 'parentId',
    classKey = 'listClass',
  } = fieldMap || {};
  const arr = Array.isArray(list) ? list : [];
  return arr.map((o) => {
    const _label = o?.[label] ?? o?.label;
    const _value = o?.[value] ?? o?.value;
    const _id = o?.[id] ?? o?.id ?? _value;
    const _parentId = o?.[parent] ?? o?.parentId;
    const _class = o?.[classKey] ?? o?.listClass;
    return {
      label: _label,
      value: _value,
      id: _id,
      parentId: _parentId,
      listClass: _class,
      raw: o,
    };
  });
}

function normalizeList(list, fieldMap) {
  if (Array.isArray(list)) {
    if (list.length && typeof list[0] === 'object') return normalizeFromObjects(list, fieldMap);
    return list.map((v) => ({
      label: String(v),
      value: v,
      id: v,
      parentId: null,
      listClass: undefined,
      raw: v,
    }));
  }
  if (list && typeof list === 'object') {
    return Object.entries(list).map(([value, label]) => ({
      label,
      value,
      id: value,
      parentId: null,
      listClass: undefined,
      raw: { value, label },
    }));
  }
  return [];
}

// ------- 扁平 -> 树（按 id / parentId） -------
function buildTreeFromFlat(list, { rootParents = [null, undefined, 0, '0', '', '-1'] } = {}) {
  const byId = new Map();
  const nodes = (Array.isArray(list) ? list : []).map((x) => {
    const n = { ...x, children: [] }; // 保留 label/value 等字段
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
      else roots.push(n); // 找不到父亲也视为根，避免丢节点
    }
  }
  // 去空 children
  const prune = (arr) =>
    arr.map((x) => {
      if (!x.children || x.children.length === 0) {
        const { children, ...rest } = x;
        return rest;
      }
      x.children = prune(x.children);
      return x;
    });
  return prune(roots);
}

export const useDictStore = defineStore('dict', {
  state: () => ({
    // 内存缓存
    bag: {}, // { [code]: { items: Option[], exp: number } }
    tree: {}, // { [code]: { nodes: Node[],  exp: number } }
    // 配置
    defaultTTL: DEFAULT_TTL,
    fieldMap: {
      label: 'dictValue',
      value: 'dictKey',
      id: 'id',
      parent: 'parentId',
      classKey: 'listClass',
    },
    rootParents: [null, undefined, 0, '0', '', '-1'],
  }),

  actions: {
    setTTL(ms) {
      this.defaultTTL = Number(ms) || 0; // 设为 0 = 不缓存
    },
    invalidate(codeOrCodes) {
      const codes = Array.isArray(codeOrCodes) ? codeOrCodes : [codeOrCodes];
      for (const c of codes) {
        delete this.bag[c];
        delete this.tree[c];
      }
    },
    clearAll() {
      this.bag = {};
      this.tree = {};
    },

    async get(code, { ttl, params } = {}) {
      const rec = this.bag[code];
      const exp = rec?.exp ?? 0;
      if (exp > now()) return rec.items;

      const key = `get:${code}:${JSON.stringify(params || {})}`;
      let p = inflight.get(key);
      if (!p) {
        p = (async () => {
          // ⚠ 如你的入参并非 { code }，在这里改
          const res = await Api.dict.getDict({ code, ...(params || {}) });
          const list = extractList(res);
          const items = normalizeList(list, this.fieldMap);
          const life = ttl ?? this.defaultTTL;
          this.bag[code] = { items, exp: life > 0 ? now() + life : 0 };
          // 使 tree 失效，强制下次重建
          delete this.tree[code];
          return items;
        })().finally(() => inflight.delete(key));
        inflight.set(key, p);
      }
      return await p;
    },

    async getMany(codes, { ttl, params } = {}) {
      const results = {};
      const need = [];
      for (const c of codes) {
        if (this.bag[c]?.exp > now() || this.bag[c]?.exp === 0) {
          results[c] = this.bag[c].items;
        } else {
          need.push(c);
        }
      }
      if (need.length) {
        await Promise.all(need.map((c) => this.get(c, { ttl, params })));
        for (const c of need) results[c] = this.bag[c].items;
      }
      return results;
    },

    async getTree(code, { ttl, params } = {}) {
      const rec = this.tree[code];
      const exp = rec?.exp ?? 0;
      if (exp > now() || exp === 0) return rec.nodes;

      // 基于归一化后的扁平项构建树（兼容“默认后端返回树但我们拍平再还原”的情况）
      const items = await this.get(code, { ttl, params });
      const nodes = buildTreeFromFlat(items, { rootParents: this.rootParents });
      const life = ttl ?? this.defaultTTL;
      this.tree[code] = { nodes, exp: life > 0 ? now() + life : 0 };
      return nodes;
    },
  },
});
