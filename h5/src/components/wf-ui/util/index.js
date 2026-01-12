import { DIC_PROPS } from './variable.js'

/**
 * 判断是否为空
 */
export function validateNull(val) {
	// 特殊判断
	if (val && parseInt(val) === 0) return false;
	const list = ['$parent'];
	if (val instanceof Date || typeof val === 'boolean' || typeof val === 'number') return false;
	if (val instanceof Array) {
		if (val.length === 0) return true;
	} else if (val instanceof Object) {
		val = deepClone(val);
		list.forEach(ele => {
			delete val[ele];
		});
		for (var o in val) {
			return false;
		}
		return true;
	} else {
		if (
			val === 'null' ||
			val == null ||
			val === 'undefined' ||
			val === undefined ||
			val === ''
		) {
			return true;
		}
		return false;
	}
	return false;
}

/**
 * 对象深拷贝
 */
export const deepClone = data => {
	var type = getObjType(data);
	var obj;
	if (type === 'array') obj = [];
	else if (type === 'object') obj = {};
	else return data;
	if (type === 'array') {
		for (var i = 0, len = data.length; i < len; i++) {
			data[i] = (() => {
				if (data[i] === 0) {
					return data[i];
				}
				return data[i];
			})();
			if (data[i]) {
				delete data[i].$parent;
			}
			obj.push(deepClone(data[i]));
		}
	} else if (type === 'object') {
		for (var key in data) {
			if (data) {
				delete data.$parent;
			}
			obj[key] = deepClone(data[key]);
		}
	}
	return obj;
}

/**
 * 验证是否存在true/false
 */
export const validData = (val, def) => {
	if (typeof val === 'boolean') {
		return val
	}
	return !validateNull(val) ? val : def
};

export const getObjType = obj => {
	var toString = Object.prototype.toString;
	var map = {
		'[object Boolean]': 'boolean',
		'[object Number]': 'number',
		'[object String]': 'string',
		'[object Function]': 'function',
		'[object Array]': 'array',
		'[object Date]': 'date',
		'[object RegExp]': 'regExp',
		'[object Undefined]': 'undefined',
		'[object Null]': 'null',
		'[object Object]': 'object'
	};
	return map[toString.call(obj)];
}

export const findObject = (list, value, key = 'prop') => {
	let result = -1;
	let type = (() => {
		let result;
		list.forEach(ele => {
			if (ele.column) {
				result = 'group';
			} else if (ele.children) {
				result = 'tree';
			}
		});
		return result;
	})();
	if (type === 'group') {
		list.forEach(ele => {
			const val = findArray(ele.column, value, key, true);
			if (val !== -1) result = val;
		});
	} else if (type === 'tree') {
		result = findLabelNode(list, value, { value: key }, true);
	} else {
		result = findArray(list, value, key, true);
	}
	return result;
}

/**
 * 根据值查找对应的序号
 */
export const findArray = (dic, value, valueKey, obj) => {
	valueKey = valueKey || DIC_PROPS.value;
	for (let i = 0; i < dic.length; i++) {
		if (dic[i][valueKey] === value) {
			return obj ? dic[i] : i;
		}
	}
	return -1;
}

/**
 * 根据label去找到节点
 */
export const findLabelNode = (dic, value, props, obj) => {
	let result;
	if (!obj) dic = detailDicGroup(dic, props);
	let rev = (dic1) => {
		const labelKey = props.label || DIC_PROPS.label;
		const valueKey = props.value || DIC_PROPS.value;
		const childrenKey = props.children || DIC_PROPS.children;
		for (let i = 0; i < dic1.length; i++) {
			const ele = dic1[i];
			const children = ele[childrenKey] || [];
			if (ele[valueKey] === value) {
				result = obj ? ele : ele[labelKey];
			} else {
				rev(children);
			}
		}
	};
	rev(dic);
	return result;
}

/**
 * 处理存在group分组的情况
 */
export const detailDicGroup = (dic = [], props = {}) => {
	let list = deepClone(dic);
	let groupsKey = props[DIC_PROPS.groups] || DIC_PROPS.groups
	dic.forEach(ele => {
		if (ele[groupsKey]) {
			list = list.concat(ele[groupsKey]);
		}
	});
	return list;
}


/**
 * 数组的数据类型转化
 */
export const detailDic = (list = [], props = {}, type) => {
	let valueKey = props.value || DIC_PROPS.value;
	let childrenKey = props.children || DIC_PROPS.children;
	list.forEach(ele => {
		ele[valueKey] = detailDataType(ele[valueKey], type);
		if (ele[childrenKey]) detailDic(ele[childrenKey], props, type);
	});
	return list;
};

/**
 * 获取多层data
 */
export const getDeepData = (res) => {
	return (Array.isArray(res) ? res : res.data) || [];
};

export const getObjValue = (data, params = '', type) => {
	const list = params.split('.');
	let result = data;
	if (list[0] === '' && type !== 'object') {
		return getDeepData(data);
	} else if (list[0] !== '') {
		list.forEach(ele => {
			result = result[ele];
		});
	}
	return result;
};

export function createObj(obj, bind) {
	let list = bind.split('.');
	let first = list.splice(0, 1)[0];
	let deep = {};
	deep[first] = {};
	if (list.length >= 2) {
		let start = '{';
		let end = '}';
		let result = '';
		list.forEach(ele => {
			result = `${result}${start}"${ele}":`;
		});
		result = `${result}""`;
		for (let i = 0; i < list.length; i++) {
			result = `${result}${end}`;
		}
		result = JSON.parse(result);
		deep[first] = result;
	}
	obj = extend(true, obj, deep);
	return obj;
}

export function extend() {
	var target = arguments[0] || {};
	var deep = false;
	var arr = Array.prototype.slice.call(arguments);
	var i = 1;
	var options, src, key, copy;
	var isArray = false;
	if (typeof target === 'boolean') {
		deep = target;
		i++;
		target = arguments[1];
	}
	for (; i < arr.length; i++) { // 循环传入的对象数组
		if ((options = arr[i]) != null) { // 如果当前值不是null，如果是null不做处理
			for (key in options) { // for in循环对象中key
				copy = options[key];
				src = target[key];
				// 如果对象中value值任然是一个引用类型
				if (deep && (toString.call(copy) === '[object Object]' || (isArray = toString.call(copy) ==
						'[object Array]'))) {
					if (isArray) { // 如果引用类型是数组
						// 如果目标对象target存在当前key，且数据类型是数组，那就还原此值，如果不是就定义成一个空数组;
						src = toString.call(src) === '[object Array]' ? src : [];
					} else {
						// 如果目标对象target存在当前key，且数据类型是对象，那就还原此值，如果不是就定义成一个空对象;
						src = toString.call(src) === '[object Object]' ? src : {};
					}
					// 引用类型就再次调用extend，递归，直到此时copy是一个基本类型的值。
					target[key] = extend(deep, src, copy);
				} else if (copy !== undefined && copy !== src) { // 如果这个值是基本值类型，且不是undefined
					target[key] = copy;
				}
			}
		}
	}
	return target;
}


/**
 * 字符串数据类型转化
 */
export const detailDataType = (value, type) => {
	if (validateNull(value)) return value
	if (type === 'number') {
		return Number(value);
	} else if (type === 'string') {
		return value + '';
	} else {
		return value;
	}
};

export function getAsVal(obj, bind = '') {
	let result = deepClone(obj);
	if (validateNull(bind)) return result;
	bind.split('.').forEach(ele => {
		result = !validateNull(result[ele]) ? result[ele] : '';
	});
	return result;
}
