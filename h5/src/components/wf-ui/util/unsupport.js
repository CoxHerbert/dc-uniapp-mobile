/**
 * 因移动端组件限制，过滤掉部分无法支持的类型
 */
export const filter = (column) => {
  const { type, multiple, remote, component } = column;
  let result = false;

  // 支持的字段类型
  const typeList = [
    undefined,
    'input',
    'number',
    'textarea',
    'radio',
    'checkbox',
    'select',
    'cascader',
    'tree',
    'upload',
    'date',
    'daterange',
    'datetime',
    'datetimerange',
    'time',
    'timerange',
    'rate',
    'slider',
    'switch',
    'dynamic',
    'map',
    'sign',
    'table-select',
    'wf-select-dialog',
    'wf-upload-v2',
    'wf-date-vant',
  ];
  if (typeList.includes(type)) result = true;

  // 多选字段全部过滤
  // if (multiple && !['upload', 'table-select'].includes(type)) result = false;

  // 远程搜索全部过滤
  if (remote) result = false;

  // // #ifndef H5
  // // 自定义字段全部过滤
  // if (component) result = false
  // // #endif
  return result;
};
