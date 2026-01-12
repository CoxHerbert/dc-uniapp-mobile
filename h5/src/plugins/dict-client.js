// src/plugins/dict-client.js
// 仅内存缓存（ttl=0 可关闭）；后端默认返回“树”。
// get(code)     -> 扁平 [{label,value,id,parentId,listClass,raw}]
// getTree(code) -> 树   同上 + children
export default function createDictClient(options = {}) {
  const {
    getDict, // 必传：如 Api.dict.getDict
    ttl = 5 * 60 * 1000, // 5min；设 0 关闭缓存
    fieldMap = {
      label: 'dictValue',
      value: 'dictKey',
      id: 'id',
      parent: 'parentId',
      classKey: 'listClass',
    },
    rootParents = [null, undefined, 0, '0', '', '-1'],
  } = options;
  if (typeof getDict !== 'function') {
    throw new Error('[dict-client] options.getDict 必须是函数（例如 Api.dict.getDict）');
  }

  // ===== 内存缓存 & 去重 =====
  const mem = new Map(); // k -> { t, v }
  const inflight = new Map(); // k -> Promise
  const now = () => Date.now();

  const getCache = (k) => {
    const hit = mem.get(k);
    if (!hit) return null;
    if (ttl > 0 && now() - hit.t > ttl) {
      mem.delete(k);
      return null;
    }
    return hit.v;
  };
  const setCache = (k, v) => {
    if (ttl !== 0) mem.set(k, { t: now(), v });
  };
  const invalidate = (prefixOrKey = '') => {
    for (const k of Array.from(mem.keys())) {
      if (!prefixOrKey || k === prefixOrKey || k.startsWith(prefixOrKey)) mem.delete(k);
    }
  };
  const clearAll = () => mem.clear();

  // ===== 提取 & 归一化 =====
  const extractList = (payload) => {
    if (Array.isArray(payload)) return payload;
    const p = payload?.data ?? payload;
    if (Array.isArray(p)) return p;
    if (Array.isArray(p?.data)) return p.data;
    if (Array.isArray(p?.list)) return p.list;
    if (Array.isArray(p?.records)) return p.records;
    return [];
  };

  const normalizeFromObjects = (list) => {
    const { label, value, id, parent, classKey } = fieldMap;
    return (Array.isArray(list) ? list : []).map((o) => ({
      label: o?.[label] ?? o?.label,
      value: o?.[value] ?? o?.value,
      id: o?.[id] ?? o?.id ?? o?.[value] ?? o?.value,
      parentId: o?.[parent] ?? o?.parentId,
      listClass: o?.[classKey] ?? o?.listClass,
      raw: o,
    }));
  };

  const normalizeList = (list) => {
    if (Array.isArray(list)) {
      if (list.length && typeof list[0] === 'object') return normalizeFromObjects(list);
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
  };

  const buildTreeFromFlat = (flat) => {
    const byId = new Map();
    const nodes = (flat || []).map((x) => {
      const n = { ...x, children: [] };
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
        else roots.push(n); // 找不到父也不丢
      }
    }
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
  };

  // ===== API 调用（兼容 getDict(code) / getDict({code})）=====
  async function callGetDict(code, params) {
    try {
      return await getDict({ code, ...(params || {}) });
    } catch {
      return await getDict(code);
    }
  }

  // ===== 对外方法 =====
  async function get(code, { force = false, params } = {}) {
    const key = `flat:${code}:${JSON.stringify(params || {})}`;
    if (!force) {
      const c = getCache(key);
      if (c) return c;
    }
    const inflightKey = `get:${key}`;
    if (!inflight.has(inflightKey)) {
      inflight.set(
        inflightKey,
        (async () => {
          const res = await callGetDict(code, params);
          const items = normalizeList(extractList(res));
          setCache(key, items);
          return items;
        })().finally(() => inflight.delete(inflightKey))
      );
    }
    return inflight.get(inflightKey);
  }

  async function getMany(codes = [], { force = false, params } = {}) {
    const tasks = codes.map((c) => get(c, { force, params }));
    const results = await Promise.all(tasks);
    const map = {};
    codes.forEach((c, i) => (map[c] = results[i]));
    return map;
  }

  async function getTree(code, { force = false, params } = {}) {
    const key = `tree:${code}:${JSON.stringify(params || {})}`;
    if (!force) {
      const c = getCache(key);
      if (c) return c;
    }
    const flat = await get(code, { force, params });
    const nodes = buildTreeFromFlat(flat);
    setCache(key, nodes);
    return nodes;
  }

  function findLabel(listOrTree, val) {
    const arr = Array.isArray(listOrTree) ? listOrTree : [];
    const hit = arr.find((x) => x?.value === val);
    return hit ? hit.label : '';
  }

  return { get, getMany, getTree, findLabel, invalidate, clearAll };
}
