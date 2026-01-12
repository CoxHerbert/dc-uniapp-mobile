<!-- pages/MaterialInfo.vue -->
<template>
  <div class="page-container page-material-info">
    <!-- 顶部栏 -->
    <van-nav-bar ref="navRef" title="物料信息维护" left-arrow @click-left="handleBack" />
    <!-- 搜索区（吸顶） -->
    <van-sticky
      :offset-top="stickyTop"
      :container="pageBodyRef"
      :z-index="998"
      @scroll="onStickyScroll"
    >
      <div class="search-container" :class="{ 'is-fixed': isSearchSticky }">
        <DcSearchBar
          v-model="snCode"
          placeholder="请输入物料编码查询"
          button-text="查询"
          :show-scan="true"
          @search="handleSearch"
        />
      </div>
    </van-sticky>

    <!-- 表单 -->
    <div v-if="formData.id" class="form-box">
      <van-form ref="formRef" :model="formData" :rules="rules">
        <div v-for="(group, i) in groups" :key="i" class="group">
          <div class="group-title">{{ group.label }}</div>
          <div class="group-content">
            <!-- 字段渲染 -->
            <div
              v-for="(item, j) in group.columns || []"
              :key="j"
              class="mi-form-item"
              :class="{ disabled: item.props && item.props.disabled }"
            >
              <!-- input -->
              <van-field
                v-if="item.type === 'input'"
                v-model="formData[item.prop]"
                :name="item.prop"
                :label="item.label"
                :placeholder="`请输入${item.label}`"
                v-bind="item.props"
              />

              <!-- ✅ 字典选择：支持单选/多选 -->
              <dc-selector
                v-else-if="item.type === 'select-dict'"
                v-model="formData[item.prop]"
                :field="item"
                :label="item.label"
                :placeholder="item.props?.placeholder"
                :title="item.props?.title"
                :multiple="item.props?.multiple"
                :options="resolveDictOptions(item)"
                :disabled="item.props?.disabled"
                :clearable="item.props?.clearable"
                :columns-field-names="resolveColumnsFieldNames(item)"
                :max-tag-count="item.props?.maxTagCount"
                @change="(val) => handleFormItemChange(item, val)"
              />

              <!-- ✅ Vant 选择（通用下拉 / 原 dc-select-popup 语义） -->
              <van-field
                v-else-if="item.type === 'dc-select-popup'"
                :label="item.label"
                is-link
                readonly
                :model-value="displayOptionText(item)"
                :placeholder="item.props?.placeholder || '请选择'"
                @click="openOptionsPicker(item)"
              />

              <!-- ✅ Vant 数字：替代 number -->
              <van-field
                v-else-if="item.type === 'number'"
                :label="item.label"
                type="number"
                :name="item.prop"
                :placeholder="item.props?.placeholder || `请输入${item.label}`"
                :formatter="(v) => formatDecimal(v, item.props?.precision, item.props?.min)"
                format-trigger="onChange"
                :model-value="formData[item.prop]"
                v-bind="filterFieldProps(item)"
                @update:model-value="(val) => onNumberInput(item, val)"
              />

              <!-- ✅ Vant 数字（重量）：替代 weight -->
              <dc-weight
                v-else-if="item.type === 'weight'"
                :label="item.label"
                type="number"
                :name="item.prop"
                :placeholder="item.props?.placeholder || `请输入${item.label}`"
                :formatter="(v) => formatDecimal(v, item.props?.precision, item.props?.min)"
                format-trigger="onChange"
                :model-value="formData[item.prop]"
                v-bind="filterFieldProps(item)"
                @update:model-value="(val) => onNumberInput(item, val)"
              />

              <!-- 上传 -->
              <div v-else-if="item.type === 'upload-img'" class="upload-img-box">
                <div class="upload-label">{{ item.label }}</div>
                <div class="upload-box">
                  <dc-uploader v-model="formData[item.prop]" v-bind="item.props.column" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </van-form>
    </div>
    <!-- 底部按钮 -->
    <div v-if="formData.id" class="page-body_footer" safe-area-inset-bottom>
      <van-button block type="success" @click="doAction('submit')">
        <van-icon name="passed" size="18" /> 提交
      </van-button>
    </div>

    <!-- 无数据提示 -->
    <div v-if="!formData.id" class="no-data">暂无数据, 请先扫码查询</div>

    <!-- 统一 Picker 弹层：字典 / 选项共用 -->
    <van-popup v-model:show="picker.show" position="bottom" round>
      <van-picker
        :columns="picker.columns"
        @confirm="onPickerConfirm"
        @cancel="picker.show = false"
      />
    </van-popup>
  </div>
  <van-back-top />
</template>

<script setup>
import { ref, reactive, getCurrentInstance, unref } from 'vue';
import { useRouter } from 'vue-router';
import { closeToast, showToast } from 'vant';
import Api from '@/api';
import { goBackOrHome } from '@/utils/navigation';
import DcSearchBar from '@/components/dc-ui/components/SearchBar/index.vue';

defineOptions({ name: 'MaterialInfo' });

/** ======= state ======= */
const { proxy } = getCurrentInstance();
const router = useRouter();
const pageBodyRef = ref(null);
const stickyTop = ref(0);
const isSearchSticky = ref(false);

const snCode = ref('');
const formData = reactive({});
const formRef = ref(null);

// Vant Form 的 rules：{ [fieldName]: Rule[] }
const rules = reactive({
  // 示例：
  // qty: [{ required: true, message: '请输入数量', trigger: 'onBlur' }]
});

// 统一 picker 状态（普通下拉共用）
const picker = reactive({
  show: false,
  forProp: '', // 作用字段
  columns: [], // [{ text, value }]
  meta: null, // 记录 item 与 props
});

// 字段分组（保持不变）
const GROUP_SCHEMA = [
  {
    label: '基本信息',
    columns: [
      { label: '物料名称', prop: 'materialName', type: 'input', props: { disabled: true } },
      { label: '物料编码', prop: 'materialNumber', type: 'input', props: { disabled: true } },
      { label: '品牌', prop: 'brand', type: 'input', props: { disabled: true } },
      { label: '规格型号', prop: 'specification', type: 'input', props: { disabled: true } },
      {
        label: '单位',
        prop: 'unitDict',
        type: 'select-dict',
        props: {
          disabled: true,
          dictKey: 'DC_ERP_UNIT',
          placeholder: '请选择',
          columnsFieldNames: {
            text: 'dictValue',
            value: 'dictKey',
          },
        },
      },
      { label: '物料属性', prop: 'attribute', type: 'input', props: { disabled: true } },
      { label: '存货类别', prop: 'categoryName', type: 'input', props: { disabled: true } },
    ],
  },
  {
    label: '尺寸信息',
    columns: [
      {
        label: '尺寸单位',
        prop: 'sizeUnit',
        type: 'select-dict',
        props: {
          dictKey: 'DC_ERP_UNIT',
          placeholder: '请选择',
          columnsFieldNames: {
            text: 'dictValue',
            value: 'dictKey',
          },
        },
      },
      { label: '长', prop: 'length', type: 'number', props: { min: 0, precision: 4 } },
      { label: '宽', prop: 'width', type: 'number', props: { min: 0, precision: 4 } },
      { label: '高', prop: 'height', type: 'number', props: { min: 0, precision: 4 } },
    ],
  },
  {
    label: '重量信息',
    columns: [
      {
        label: '数量',
        prop: 'qty',
        type: 'number',
        props: { placeholder: '请输入', min: 1, precision: 0 },
      },
      {
        label: '重量单位',
        prop: 'weightUnit',
        type: 'select-dict',
        props: {
          dictKey: 'DC_ERP_UNIT',
          placeholder: '请选择',
          columnsFieldNames: {
            text: 'dictValue',
            value: 'dictKey',
          },
        },
      },
      {
        label: '毛重',
        prop: 'grossWeight',
        type: 'weight',
        props: { placeholder: '请输入', min: 0, precision: 4 },
      },
      {
        label: '净重',
        prop: 'netWeight',
        type: 'weight',
        props: { placeholder: '请输入', min: 0, precision: 4 },
      },
    ],
  },
  {
    label: '附件信息',
    columns: [
      {
        label: '附件',
        prop: 'attachId',
        type: 'upload-img',
        props: {
          column: {
            serverDir: 'scm/material',
            type: 'upload',
            multiple: false,
            limit: 1,
          },
        },
      },
    ],
  },
];

const groups = ref(GROUP_SCHEMA);

const dictCodes = Array.from(
  new Set(
    GROUP_SCHEMA.flatMap((group) => group.columns || [])
      .map((column) => column?.props?.dictKey || column?.dictKey)
      .filter(Boolean)
  )
);

const dictRefs = proxy?.dicts ? proxy.dicts(dictCodes) : {};

/** ======= methods（setup 版） ======= */
// Sticky
function onStickyScroll(e) {
  isSearchSticky.value = !!e?.isFixed;
}

const DEFAULT_COLUMNS_FIELD_NAMES = Object.freeze({ text: 'text', value: 'value' });

function resolveDictOptions(item) {
  const column = item || {};
  const columnProps = column.props || {};
  const candidates = [columnProps.options, column.options];
  for (const candidate of candidates) {
    const list = unref(candidate);
    if (Array.isArray(list)) return list;
  }

  const dictKey = columnProps.dictKey || column.dictKey;
  if (dictKey && dictRefs && Object.prototype.hasOwnProperty.call(dictRefs, dictKey)) {
    const list = unref(dictRefs[dictKey]);
    if (Array.isArray(list)) return list;
  }

  return [];
}

function resolveColumnsFieldNames(item) {
  const props = item?.props || {};
  const map =
    props.columnsFieldNames && typeof props.columnsFieldNames === 'object'
      ? props.columnsFieldNames
      : null;
  if (map) return map;
  if (props.labelKey || props.valueKey) {
    return {
      text: props.labelKey || 'text',
      value: props.valueKey || 'value',
    };
  }
  return DEFAULT_COLUMNS_FIELD_NAMES;
}

function displayOptionText(item) {
  const props = item.props || {};
  const fieldNames = resolveColumnsFieldNames(item);
  const { text: textKey, value: valueKey } = fieldNames;
  const { options = [] } = props;
  const val = formData?.[item.prop];
  const hit = options.find((x) => resolveOptionField(x, [valueKey, 'value']) === val);
  return hit ? resolveOptionField(hit, [textKey, 'text', 'label']) : '';
}

function openOptionsPicker(item) {
  const props = item.props || {};
  const fieldNames = resolveColumnsFieldNames(item);
  const { text: textKey, value: valueKey } = fieldNames;
  const { options = [] } = props;
  if (!options.length) {
    showToast({ message: '暂无可选项' });
    return;
  }
  picker.forProp = item.prop;
  picker.columns = options.map((x) => ({
    text: resolveOptionField(x, [textKey, 'text', 'label']),
    value: resolveOptionField(x, [valueKey, 'value']),
  }));
  picker.meta = item;
  picker.show = true;
}

function onPickerConfirm({ selectedValues, selectedOptions }) {
  const opt = selectedOptions?.[0] || selectedOptions || {};
  const value = (selectedValues && selectedValues[0]) ?? opt?.value;
  if (picker.forProp) {
    formData[picker.forProp] = value;
    if (picker.meta) {
      handleFormItemChange(picker.meta, value);
    }
  }
  picker.show = false;
}

// 数值输入（替代 number / weight）
function filterFieldProps(item) {
  const p = item.props || {};
  const { disabled, clearable, maxlength, inputAlign } = p;
  return { disabled, clearable, maxlength, 'input-align': inputAlign };
}

function resolveOptionField(option, keys) {
  if (!option) return '';
  const list = Array.isArray(keys) ? keys : [keys];
  for (const key of list) {
    if (!key) continue;
    if (option[key] != null) return option[key];
    if (option.raw && option.raw[key] != null) return option.raw[key];
  }
  return '';
}

function formatDecimal(value, precision = 0, min) {
  if (value === undefined || value === null) return '';
  let v = String(value).replace(/[^\d.-]/g, '');
  const neg = v.startsWith('-');
  v = v.replace(/-/g, '');
  const parts = v.split('.');
  v = parts[0].replace(/^0+(\d)/, '$1');
  if (parts.length > 1) v += '.' + parts[1].slice(0, Math.max(0, precision));
  if (neg && (min === undefined || min < 0)) v = '-' + v;

  if (v === '' || v === '-' || v === '.') return v;
  const num = Number(v);
  if (!Number.isNaN(num)) {
    if (typeof min === 'number' && num < min) return String(min);
    if (typeof precision === 'number') {
      return num.toFixed(precision).replace(new RegExp(`(\\.\\d{0,${precision}})\\d*$`), '$1');
    }
  }
  return v;
}

function onNumberInput(item, val) {
  const str = formatDecimal(val, item.props?.precision, item.props?.min);
  const num = str === '' || str === '-' || str === '.' ? null : Number(str);
  formData[item.prop] = num;
  handleFormItemChange(item, num);
}

function handleSearch() {
  Api.application.materialMaintenance
    .load({ qrcode: snCode.value })
    .then((res) => {
      closeToast();
      const { code, data } = res.data || {};
      if (code === 200) {
        Object.assign(formData, {
          ...data,
          materialFileId: undefined,
          attachId: data?.materialFileId ? [{ value: data.materialFileId }] : [],
        });
        if (data?.materialFileId) {
          Api.application.materialMaintenance
            .getFileById({ ids: data.materialFileId })
            .then((resFile) => {
              const { code: fileCode, data: fileData } = resFile || {};
              if (fileCode === 200 && fileData?.[0]) {
                formData.attachId = [{ label: fileData[0].originalName, value: fileData[0].id }];
              }
            });
        }
      }
    })
    .catch(() => {
      closeToast();
    });
}

function doAction(action) {
  if (['handleSearch', 'search'].includes(action)) {
    return handleSearch();
  }
  if (action === 'submit') {
    formRef.value?.validate?.().then(() => {
      Api.application.materialMaintenance
        .update({
          scmMaterial: { ...formData, attachId: undefined },
          attachId: formData.attachId?.length ? formData.attachId?.[0] : undefined,
        })
        .then((res) => {
          closeToast();
          const { code, msg } = res?.data || {};
          if (code === 200) {
            showToast({ type: 'success', message: '提交成功' });
          } else {
            showToast({ message: msg || '提交失败' });
          }
        })
        .catch((error) => {
          closeToast();
          const message = error?.response?.data?.msg || error?.msg || error?.message;
          showToast({ message: message || '提交失败' });
        });
    });
  }
}

function handleBack() {
  goBackOrHome(router);
}

// 原有联动逻辑（照搬）
function handleFormItemChange(col, val) {
  if (col.prop === 'grossWeight') {
    if (![undefined, null].includes(val)) {
      formData[col.prop] = (val / formData.qty).toFixed(4);
    }
    if (![undefined, null].includes(formData.qty)) {
      formData.grossWeight = null;
    }
  } else if (col.prop === 'netWeight') {
    if (![undefined, null].includes(val)) {
      formData[col.prop] = (val / formData.qty).toFixed(4);
    }
    if (![undefined, null].includes(formData.qty)) {
      formData.netWeight = null;
    }
  } else if (col.prop === 'qty') {
    formData.grossWeight = null;
    formData.netWeight = null;
  }
}
</script>

<style lang="scss" scoped>
.page-material-info {
  /* 顶部吸顶的偏移量：NavBar 不固定时为 0；若 NavBar 固定，可在外层或页面里把此变量设为 46px + safe-area */
  --mi-sticky-top: 0px;

  min-height: 100vh;
  display: flex;
  flex-flow: column nowrap;
  background: linear-gradient(180deg, #f7e9df 0%, rgba(255, 255, 255, 0) 12%) !important;
  padding-bottom: 200rpx;
  box-sizing: border-box;

  .no-data {
    width: 100%;
    text-align: center;
    margin-top: 100px;
    color: #999;
  }

  :deep(.van-field__control) {
    width: calc(100% - 16px);
  }

  .disabled :deep(.van-field__control) {
    background-color: rgba(0, 0, 0, 0.05) !important;
  }

  /* ✅ 搜索吸顶：跟随 .page-body（内部滚动容器）吸顶 */
  .search-container {
    padding: 12px;
    background-color: #fff;

    position: sticky;
    top: var(--mi-sticky-top);
    z-index: 9;
    border-bottom: 1px solid #f2f3f5;
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.02);
  }

  :deep(.dc-search-panel__search-btn),
  :deep(.dc-search-panel__scan-btn) {
    height: 38px;
  }

  .group-title {
    padding: 10px 0;
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    line-height: 2;
  }

  .group-content {
    border-radius: 6px;
    background-color: #fff;
    padding: 4px 0;
  }

  .mi-form-item + .mi-form-item {
    border-top: 1px solid #f5f5f5;
  }

  .page-body_footer {
    width: 100%;
    position: fixed;
    bottom: 0;
    left: 0;
    z-index: 100;
    padding: 12px 16px calc(24rpx + constant(safe-area-inset-bottom));
    padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
    background: #fff;
    box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.04);
  }

  .upload-img-box {
    margin-bottom: 44px;
    width: 100%;
    overflow: hidden;
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    position: relative;
    padding: 10px 16px;
    box-sizing: border-box;

    .upload-label {
      width: 96px;
      flex: none;
      color: #646566;
      font-size: 28rpx;
      line-height: 1.4;
    }

    .upload-box {
      flex: 1;
      padding-left: 16px;
    }

    :deep(.wf-upload) {
      width: calc(100% - 80px);
      min-width: 200px;
      flex: 1;

      .wf-upload-file {
        width: 200px;
      }
      .wf-upload-file__item--name {
        display: block;
        width: 200px;
      }
    }

    .clear {
      background-color: gray;
      width: 80px;
    }
  }
}
</style>
