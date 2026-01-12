// src/views/InboundOrder/constants.js

// 状态码
export const IN_STOCK_STATUS = Object.freeze({
  AUDITED: 'DC_WMS_IN_STATUS_C', // 已审核
  UNAUDITED: 'DC_WMS_IN_STATUS_A', // 未审核
});

// 状态 -> 文案、Tag类型
export const IN_STOCK_STATUS_META = Object.freeze({
  [IN_STOCK_STATUS.AUDITED]: { label: '已审核', type: 'success' },
  [IN_STOCK_STATUS.UNAUDITED]: { label: '未审核', type: 'warning' },
  DEFAULT: { label: '已完成', type: 'primary' },
});

// 直接可用的筛选项（无字典时兜底）
export const IN_STOCK_STATUS_OPTIONS = Object.freeze([
  { label: '全部', value: null },
  { label: '已审核', value: IN_STOCK_STATUS.AUDITED },
  { label: '未审核', value: IN_STOCK_STATUS.UNAUDITED },
]);

// 取展示元数据（文案/Tag 颜色）
export function getInStockStatusMeta(code) {
  const s = (typeof code === 'string' ? code.trim() : code) || '';
  return IN_STOCK_STATUS_META[s] || IN_STOCK_STATUS_META.DEFAULT;
}

/**
 * 如果你有字典（比如 proxy.dicts(['DC_WMS_IN_STATUS'])），
 * 优先用字典生成筛选项；否则回退到 IN_STOCK_STATUS_OPTIONS。
 * 支持多种常见字典结构：{label,value} / {name,method} / {text,value}
 */
export function buildInStockStatusOptions(dictList) {
  const base = [{ label: '全部', value: null }];
  if (Array.isArray(dictList) && dictList.length) {
    const mapped = dictList.map((d) => ({
      label: d.label ?? d.name ?? d.text ?? String(d.value ?? d.method ?? ''),
      value: d.value ?? d.method ?? null,
    }));
    return base.concat(mapped);
  }
  return base.concat(
    IN_STOCK_STATUS_OPTIONS.filter((o) => o.value !== null) // 已审核、未审核
  );
}
