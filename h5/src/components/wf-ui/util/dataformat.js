import { validateNull, detailDataType, findObject, createObj } from './index.js';
import {
  DIC_SPLIT,
  ARRAY_LIST,
  DATE_LIST,
  INPUT_LIST,
  ARRAY_VALUE_LIST,
  MULTIPLE_LIST,
  SELECTTABLE_LIST,
  SELECT_LIST,
  RANGE_LIST,
} from './variable';

/**
 * 计算级联属性
 */
export const calcCascader = (list = []) => {
  list.forEach((ele, index) => {
    if (!validateNull(ele.cascaderItem)) {
      let cascader = [...ele.cascaderItem];
      let parentProp = ele.prop;
      list[index].cascader = [...cascader];
      cascader.forEach((citem, cindex) => {
        let column = findObject(list, citem);
        if (column === -1) return;
        column.parentProp = parentProp;
        column.cascader = [...cascader].splice(cindex + 1);
        parentProp = column.prop;
      });
    }
  });
  return list;
};

/**
 * 初始化数据格式
 */
export const initVal = (value, column) => {
  let { type, multiple, dataType, separator = DIC_SPLIT, alone, emitPath, range } = column;
  let list = value;
  if (
    (MULTIPLE_LIST.includes(type) && multiple == true) ||
    (ARRAY_VALUE_LIST.includes(type) && emitPath !== false) ||
    (RANGE_LIST.includes(type) && range == true)
  ) {
    if (!Array.isArray(list)) {
      if (validateNull(list)) {
        list = [];
      } else {
        list = (list + '').split(separator) || [];
      }
    }
    // 数据转化
    list.forEach((ele, index) => {
      list[index] = detailDataType(ele, dataType);
    });
    if (ARRAY_LIST.includes(type) && validateNull(list) && alone) list = [''];
  } else {
    list = detailDataType(list, dataType);
  }
  return list;
};

export const initRules = (column = []) => {
  const rules = {};
  column.forEach((col) => {
    if (col.rules) {
      let ruleType = 'string';
      let { type, multiple, dataType, emitPath, prop, value } = col;
      if (
        (MULTIPLE_LIST.includes(type) && multiple) ||
        (ARRAY_VALUE_LIST.includes(type) &&
          emitPath !== false &&
          (Array.isArray(value) || !value) &&
          !['string', 'number'].includes(dataType))
      ) {
        ruleType = 'array';
      } else if (['rate', 'slider', 'number'].includes(type)) {
        ruleType = 'number';
      } else if (SELECTTABLE_LIST.includes(col.component) || col.type == 'table-select') {
        ruleType = 'object';
      }

      col.rules.forEach((r) => {
        if (r.required) r.type = ruleType;
        // #ifdef MP
        if (r.pattern && col.pattern) r.pattern = new RegExp(col.pattern);
        // #endif
      });
      if (['table-select'].includes(type)) {
        console.log(col.rules);
      }

      rules[prop] = col.rules;
    }
  });
  return rules;
};

/**
 * 搜索框获取动态组件
 */
export const getSearchType = (column) => {
  const type = column.type;
  const range = column.searchRange;
  let result = type;
  if (['radio', 'checkbox', 'switch'].includes(type)) {
    result = 'select';
  } else if (DATE_LIST.includes(type)) {
    let rangeKey = 'range';
    if (range) {
      if (!type.includes(rangeKey)) {
        result = type + rangeKey;
      } else {
        result = type;
      }
    } else result = type.replace(rangeKey, '');
  } else if (['textarea'].includes(type)) {
    result = 'input';
  }
  return result;
};

/**
 * 表格初始化值
 */
export const formInitVal = (list = []) => {
  let tableForm = {};
  list.forEach((ele) => {
    if (
      (ARRAY_VALUE_LIST.includes(ele.type) && ele.emitPath !== false) ||
      (MULTIPLE_LIST.includes(ele.type) && ele.multiple) ||
      ele.dataType === 'array'
    ) {
      tableForm[ele.prop] = [];
    } else if (RANGE_LIST.includes(ele.type) && ele.range == true) {
      tableForm[ele.prop] = [0, 0];
    } else if (['rate', 'slider'].includes(ele.type) || ele.dataType === 'number') {
      tableForm[ele.prop] = 0;
    } else {
      tableForm[ele.prop] = '';
    }
    if (ele.bind) {
      tableForm = createObj(tableForm, ele.bind);
    }
    // 表单默认值设置
    if (!validateNull(ele.value)) {
      tableForm[ele.prop] = ele.value;
    }
  });
  return {
    tableForm,
  };
};

export const getPlaceholder = (column, type) => {
  const placeholder = column.placeholder;
  const label = column.label;
  if (type === 'search') {
    const searchPlaceholder = column.searchPlaceholder;
    if (!validateNull(searchPlaceholder)) {
      return searchPlaceholder;
    } else {
      return label;
    }
  } else if (validateNull(placeholder)) {
    return `${label}`;
  }

  return placeholder;
};

export const mpFormInitVal = (ele) => {
  let value;
  if (
    (ARRAY_VALUE_LIST.includes(ele.type) && ele.emitPath !== false) ||
    (MULTIPLE_LIST.includes(ele.type) && ele.multiple) ||
    ele.dataType === 'array'
  ) {
    value = [];
  } else if (RANGE_LIST.includes(ele.type) && ele.range == true) {
    value = [0, 0];
  } else if (['rate', 'slider', 'number'].includes(ele.type) || ele.dataType === 'number') {
    value = undefined;
  } else {
    value = '';
  }
  if (ele.bind) {
    tableForm = createObj(tableForm, ele.bind);
  }
  // 表单默认值设置
  if (!validateNull(ele.value)) {
    value = ele.value;
  }
  return value;
};
