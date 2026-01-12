<template>
  <div class="dc-recruit-form" :class="{ 'dc-compact': compact }">
    <div class="dc-container">
      <van-cell-group inset>
        <template v-for="f in schema.fields" :key="f.name">
          <template v-if="isVisible(f)">
            <!-- ===================== INPUT ===================== -->
            <template v-if="f.type === 'input'">
              <div v-if="getLayout(f) === 'vertical'" class="dc-field-vertical">
                <div class="dc-field-label" :class="{ required: isRequired(f) }">
                  {{ f.label }}
                </div>
                <van-field
                  v-model="local[f.name]"
                  :label="''"
                  :placeholder="f.placeholder || `请输入${f.label}`"
                  :type="f.inputType || 'text'"
                  :disabled="isDisabled(f)"
                  :readonly="isReadonly(f)"
                  clearable
                  @update:model-value="(val) => onFieldUpdate(f, val)"
                />
                <div v-if="fieldDesc(f)" class="dc-desc">
                  {{ fieldDesc(f) }}
                </div>
              </div>
              <template v-else>
                <van-field
                  v-model="local[f.name]"
                  :label="f.label"
                  :label-width="getLabelWidth(f)"
                  :placeholder="f.placeholder || `请输入${f.label}`"
                  :required="isRequired(f)"
                  :type="f.inputType || 'text'"
                  :disabled="isDisabled(f)"
                  :readonly="isReadonly(f)"
                  clearable
                  @update:model-value="(val) => onFieldUpdate(f, val)"
                />
                <div v-if="fieldDesc(f)" class="dc-desc dc-desc-inset">
                  {{ fieldDesc(f) }}
                </div>
              </template>
            </template>

            <!-- ===================== TEXTAREA ===================== -->
            <template v-else-if="f.type === 'textarea'">
              <div v-if="getLayout(f) === 'vertical'" class="dc-field-vertical">
                <div class="dc-field-label" :class="{ required: isRequired(f) }">
                  {{ f.label }}
                </div>
                <van-field
                  v-model="local[f.name]"
                  :label="''"
                  type="textarea"
                  :rows="f.rows || 3"
                  :maxlength="f.maxlength || 500"
                  show-word-limit
                  :placeholder="f.placeholder || `请输入${f.label}`"
                  :disabled="isDisabled(f)"
                  :readonly="isReadonly(f)"
                  clearable
                  @update:model-value="(val) => onFieldUpdate(f, val)"
                />
                <div v-if="fieldDesc(f)" class="dc-desc">
                  {{ fieldDesc(f) }}
                </div>
              </div>
              <template v-else>
                <van-field
                  v-model="local[f.name]"
                  :label="f.label"
                  :label-width="getLabelWidth(f)"
                  type="textarea"
                  :rows="f.rows || 3"
                  :maxlength="f.maxlength || 500"
                  show-word-limit
                  :placeholder="f.placeholder || `请输入${f.label}`"
                  :required="isRequired(f)"
                  :disabled="isDisabled(f)"
                  :readonly="isReadonly(f)"
                  clearable
                  @update:model-value="(val) => onFieldUpdate(f, val)"
                />
                <div v-if="fieldDesc(f)" class="dc-desc dc-desc-inset">
                  {{ fieldDesc(f) }}
                </div>
              </template>
            </template>

            <!-- ===================== RADIO ===================== -->
            <div v-else-if="f.type === 'radio'">
              <div v-if="getLayout(f) === 'vertical'" class="dc-field-vertical">
                <div class="dc-field-label" :class="{ required: isRequired(f) }">
                  {{ f.label }}
                </div>
                <div class="dc-pad-16">
                  <van-radio-group
                    v-model="local[f.name]"
                    :direction="f.direction || 'horizontal'"
                    :disabled="isDisabled(f)"
                    @update:model-value="(val) => onFieldUpdate(f, val)"
                  >
                    <van-radio v-for="op in f.options || []" :key="op.value" :name="op.value">
                      {{ op.label }}
                    </van-radio>
                  </van-radio-group>
                  <div v-if="fieldDesc(f)" class="dc-desc">
                    {{ fieldDesc(f) }}
                  </div>
                </div>
              </div>
              <template v-else>
                <van-cell
                  :title="f.label"
                  :required="isRequired(f)"
                  :title-style="cellTitleStyle(f)"
                />
                <div class="dc-pad-16">
                  <van-radio-group
                    v-model="local[f.name]"
                    :direction="f.direction || 'horizontal'"
                    :disabled="isDisabled(f)"
                    @update:model-value="(val) => onFieldUpdate(f, val)"
                  >
                    <van-radio v-for="op in f.options || []" :key="op.value" :name="op.value">
                      {{ op.label }}
                    </van-radio>
                  </van-radio-group>
                  <div v-if="fieldDesc(f)" class="dc-desc">
                    {{ fieldDesc(f) }}
                  </div>
                </div>
              </template>
            </div>

            <!-- ===================== CHECKBOX (+extra) ===================== -->
            <div v-else-if="f.type === 'checkbox'">
              <div v-if="getLayout(f) === 'vertical'" class="dc-field-vertical">
                <div class="dc-field-label" :class="{ required: isRequired(f) }">
                  {{ f.label }}
                </div>
                <div class="dc-pad-16">
                  <van-checkbox-group
                    v-model="checkboxModels[f.name]"
                    :disabled="isDisabled(f)"
                    :max="typeof f.max === 'number' ? f.max : undefined"
                  >
                    <div v-for="op in f.options || []" :key="op.value" class="dc-cb-row">
                      <van-checkbox :name="op.value">
                        {{ op.label }}
                      </van-checkbox>
                      <template v-if="op.extra && checkboxModels[f.name].includes(op.value)">
                        <div class="dc-extra-wrap">
                          <van-field
                            v-model="local[op.extra.key]"
                            :label="op.extra.label || ''"
                            :placeholder="op.extra.placeholder || '请输入'"
                            :type="op.extra.inputType || 'text'"
                            :disabled="isDisabled(f)"
                            :readonly="isReadonly(f)"
                            clearable
                            :label-width="0"
                            @update:model-value="
                              (val) => onFieldUpdate({ name: op.extra.key }, val)
                            "
                          />
                        </div>
                      </template>
                    </div>
                  </van-checkbox-group>
                  <div v-if="fieldDesc(f)" class="dc-desc">
                    {{ fieldDesc(f) }}
                  </div>
                </div>
              </div>

              <template v-else>
                <van-cell
                  :title="f.label"
                  :required="isRequired(f)"
                  :title-style="cellTitleStyle(f)"
                />
                <div class="dc-pad-16">
                  <van-checkbox-group
                    v-model="checkboxModels[f.name]"
                    :disabled="isDisabled(f)"
                    :max="typeof f.max === 'number' ? f.max : undefined"
                  >
                    <div v-for="op in f.options || []" :key="op.value" class="dc-cb-row">
                      <van-checkbox :name="op.value">
                        {{ op.label }}
                      </van-checkbox>
                      <template v-if="op.extra && checkboxModels[f.name].includes(op.value)">
                        <div class="dc-extra-wrap">
                          <van-field
                            v-model="local[op.extra.key]"
                            :label="op.extra.label || ''"
                            :placeholder="op.extra.placeholder || '请输入'"
                            :type="op.extra.inputType || 'text'"
                            :disabled="isDisabled(f)"
                            :readonly="isReadonly(f)"
                            clearable
                            :label-width="0"
                            @update:model-value="
                              (val) => onFieldUpdate({ name: op.extra.key }, val)
                            "
                          />
                        </div>
                      </template>
                    </div>
                  </van-checkbox-group>
                  <div v-if="fieldDesc(f)" class="dc-desc">
                    {{ fieldDesc(f) }}
                  </div>
                </div>
              </template>
            </div>

            <!-- ===================== PICKER ===================== -->
            <template v-else-if="f.type === 'picker'">
              <div v-if="getLayout(f) === 'vertical'" class="dc-field-vertical">
                <div class="dc-field-label" :class="{ required: isRequired(f) }">
                  {{ f.label }}
                </div>
                <van-field
                  is-link
                  :readonly="isReadonly(f)"
                  :label="''"
                  :placeholder="f.placeholder || `请选择${f.label}`"
                  :model-value="getPickerLabel(f)"
                  :disabled="isDisabled(f)"
                  @click="openPicker(f)"
                />
                <div v-if="fieldDesc(f)" class="dc-desc">
                  {{ fieldDesc(f) }}
                </div>
              </div>
              <template v-else>
                <van-field
                  is-link
                  :readonly="isReadonly(f)"
                  :label="f.label"
                  :label-width="getLabelWidth(f)"
                  :required="isRequired(f)"
                  :placeholder="f.placeholder || `请选择${f.label}`"
                  :model-value="getPickerLabel(f)"
                  :disabled="isDisabled(f)"
                  @click="openPicker(f)"
                />
                <div v-if="fieldDesc(f)" class="dc-desc dc-desc-inset">
                  {{ fieldDesc(f) }}
                </div>
              </template>
              <van-popup :key="f.name + '-picker'" v-model:show="popup[f.name]" position="bottom">
                <van-picker
                  :columns="Array.isArray(f.columns) ? f.columns : pickerColumnsCache[f.name] || []"
                  :columns-field-names="f.columnsFieldNames || { text: 'label', value: 'value' }"
                  :title="f.label"
                  @confirm="(val) => onPickerConfirm(f, val)"
                  @cancel="popup[f.name] = false"
                />
              </van-popup>
            </template>

            <!-- ===================== DATE / TIME / DATETIME ===================== -->
            <template v-else-if="f.type === 'date'">
              <div v-if="getLayout(f) === 'vertical'" class="dc-field-vertical">
                <div class="dc-field-label" :class="{ required: isRequired(f) }">
                  {{ f.label }}
                </div>
                <van-field
                  is-link
                  :readonly="isReadonly(f)"
                  :label="''"
                  :placeholder="f.placeholder || `请选择${f.label}`"
                  :model-value="local[f.name]"
                  :disabled="isDisabled(f)"
                  @click="openDate(f)"
                />
                <div v-if="fieldDesc(f)" class="dc-desc">
                  {{ fieldDesc(f) }}
                </div>
              </div>
              <template v-else>
                <van-field
                  is-link
                  :readonly="isReadonly(f)"
                  :label="f.label"
                  :label-width="getLabelWidth(f)"
                  :required="isRequired(f)"
                  :placeholder="f.placeholder || `请选择${f.label}`"
                  :model-value="local[f.name]"
                  :disabled="isDisabled(f)"
                  @click="openDate(f)"
                />
                <div v-if="fieldDesc(f)" class="dc-desc dc-desc-inset">
                  {{ fieldDesc(f) }}
                </div>
              </template>

              <van-popup :key="f.name + '-date'" v-model:show="popup[f.name]" position="bottom">
                <template v-if="f.dateType !== 'datetime' && f.dateType !== 'time'">
                  <van-date-picker
                    v-model="dateModel[f.name]"
                    :title="f.label"
                    :columns-type="mapColumnsType(f.dateType)"
                    :min-date="f.minDate || new Date(1990, 0, 1)"
                    :max-date="f.maxDate || new Date(2099, 11, 31)"
                    @confirm="() => onDateConfirmV4(f)"
                    @cancel="popup[f.name] = false"
                  />
                </template>
                <template v-else-if="f.dateType === 'time'">
                  <van-time-picker
                    v-model="timeModel[f.name]"
                    :title="f.label"
                    :columns-type="f.timeColumns || ['hour', 'minute']"
                    @confirm="() => onTimeConfirmV4(f)"
                    @cancel="popup[f.name] = false"
                  />
                </template>
                <template v-else>
                  <van-picker-group
                    :title="f.label"
                    :tabs="['日期', '时间']"
                    @confirm="() => onDateTimeConfirmV4(f)"
                    @cancel="popup[f.name] = false"
                  >
                    <van-date-picker
                      v-model="dateModel[f.name]"
                      :columns-type="['year', 'month', 'day']"
                      :min-date="f.minDate || new Date(1990, 0, 1)"
                      :max-date="f.maxDate || new Date(2099, 11, 31)"
                    />
                    <van-time-picker
                      v-model="timeModel[f.name]"
                      :columns-type="f.timeColumns || ['hour', 'minute']"
                    />
                  </van-picker-group>
                </template>
              </van-popup>
            </template>

            <!-- ===================== AREA ===================== -->
            <template v-else-if="f.type === 'area'">
              <div v-if="getLayout(f) === 'vertical'" class="dc-field-vertical">
                <div class="dc-field-label" :class="{ required: isRequired(f) }">
                  {{ f.label }}
                </div>
                <van-field
                  is-link
                  :readonly="isReadonly(f)"
                  :label="''"
                  :placeholder="f.placeholder || `请选择${f.label}`"
                  :model-value="
                    typeof local[f.name] === 'string' ? local[f.name] : local[f.name]?.text || ''
                  "
                  :disabled="isDisabled(f)"
                  @click="openArea(f)"
                />
                <div v-if="fieldDesc(f)" class="dc-desc">
                  {{ fieldDesc(f) }}
                </div>
              </div>
              <template v-else>
                <van-field
                  is-link
                  :readonly="isReadonly(f)"
                  :label="f.label"
                  :label-width="getLabelWidth(f)"
                  :required="isRequired(f)"
                  :placeholder="f.placeholder || `请选择${f.label}`"
                  :model-value="
                    typeof local[f.name] === 'string' ? local[f.name] : local[f.name]?.text || ''
                  "
                  :disabled="isDisabled(f)"
                  @click="openArea(f)"
                />
                <div v-if="fieldDesc(f)" class="dc-desc dc-desc-inset">
                  {{ fieldDesc(f) }}
                </div>
              </template>
              <van-popup :key="f.name + '-area'" v-model:show="popup[f.name]" position="bottom">
                <van-area
                  :area-list="f.areaList"
                  :title="f.label"
                  @confirm="(detail) => onAreaConfirm(f, detail)"
                  @cancel="popup[f.name] = false"
                />
              </van-popup>
            </template>

            <!-- ===================== CASCADER ===================== -->
            <template v-else-if="f.type === 'cascader'">
              <div v-if="getLayout(f) === 'vertical'" class="dc-field-vertical">
                <div class="dc-field-label" :class="{ required: isRequired(f) }">
                  {{ f.label }}
                </div>
                <van-field
                  is-link
                  :readonly="isReadonly(f)"
                  :label="''"
                  :placeholder="f.placeholder || `请选择${f.label}`"
                  :model-value="
                    typeof local[f.name] === 'string' ? local[f.name] : local[f.name]?.text || ''
                  "
                  :disabled="isDisabled(f)"
                  @click="openCascader(f)"
                />
                <div v-if="fieldDesc(f)" class="dc-desc">
                  {{ fieldDesc(f) }}
                </div>
              </div>
              <template v-else>
                <van-field
                  is-link
                  :readonly="isReadonly(f)"
                  :label="f.label"
                  :label-width="getLabelWidth(f)"
                  :required="isRequired(f)"
                  :placeholder="f.placeholder || `请选择${f.label}`"
                  :model-value="
                    typeof local[f.name] === 'string' ? local[f.name] : local[f.name]?.text || ''
                  "
                  :disabled="isDisabled(f)"
                  @click="openCascader(f)"
                />
                <div v-if="fieldDesc(f)" class="dc-desc dc-desc-inset">
                  {{ fieldDesc(f) }}
                </div>
              </template>
              <van-popup :key="f.name + '-cascader'" v-model:show="popup[f.name]" position="bottom">
                <van-cascader
                  :title="f.label"
                  :options="f.options || []"
                  :field-names="
                    f.fieldNames || { text: 'label', value: 'value', children: 'children' }
                  "
                  :closeable="true"
                  :lazy="!!f.lazyLoad"
                  :lazy-load="
                    f.lazyLoad ? (node, resolve) => cascaderLazyLoad(f, node, resolve) : undefined
                  "
                  @finish="(detail) => onCascaderFinish(f, detail)"
                />
              </van-popup>
            </template>

            <!-- ===================== SEARCH PICKER ===================== -->
            <template v-else-if="f.type === 'searchPicker'">
              <div v-if="getLayout(f) === 'vertical'" class="dc-field-vertical">
                <div class="dc-field-label" :class="{ required: isRequired(f) }">
                  {{ f.label }}
                </div>
                <van-field
                  is-link
                  :readonly="isReadonly(f)"
                  :label="''"
                  :placeholder="f.placeholder || `请选择${f.label}`"
                  :model-value="
                    f.displayFormatter ? f.displayFormatter(local[f.name], local) : local[f.name]
                  "
                  :disabled="isDisabled(f)"
                  @click="openSearchPicker(f)"
                />
                <div v-if="fieldDesc(f)" class="dc-desc">
                  {{ fieldDesc(f) }}
                </div>
              </div>
              <template v-else>
                <van-field
                  is-link
                  :readonly="isReadonly(f)"
                  :label="f.label"
                  :label-width="getLabelWidth(f)"
                  :required="isRequired(f)"
                  :placeholder="f.placeholder || `请选择${f.label}`"
                  :model-value="
                    f.displayFormatter ? f.displayFormatter(local[f.name], local) : local[f.name]
                  "
                  :disabled="isDisabled(f)"
                  @click="openSearchPicker(f)"
                />
                <div v-if="fieldDesc(f)" class="dc-desc dc-desc-inset">
                  {{ fieldDesc(f) }}
                </div>
              </template>
              <van-popup :key="f.name + '-search'" v-model:show="popup[f.name]" position="bottom">
                <div class="dc-search-panel">
                  <van-search
                    v-model="searchState[f.name].q"
                    class="dc-search"
                    show-action
                    placeholder="输入关键字搜索"
                    @search="(val) => doSearch(f, val)"
                    @update:model-value="(val) => doSearch(f, val)"
                  >
                    <template #action>
                      <div class="dc-search-action" @click="doSearch(f, searchState[f.name].q)">
                        搜索
                      </div>
                    </template>
                  </van-search>
                  <div v-if="searchState[f.name].loading" class="dc-pad-16">
                    <van-loading size="24px"> 加载中... </van-loading>
                  </div>
                  <van-empty
                    v-else-if="searchState[f.name].inited && !searchState[f.name].list.length"
                    description="暂无结果"
                  />
                  <van-list v-else :finished="true">
                    <van-cell
                      v-for="item in searchState[f.name].list"
                      :key="
                        (f.search?.valueKey || 'value') in item
                          ? item[f.search?.valueKey || 'value']
                          : JSON.stringify(item)
                      "
                      :title="item[f.search?.labelKey || 'label']"
                      @click="onChooseSearchItem(f, item)"
                    />
                  </van-list>
                </div>
              </van-popup>
            </template>

            <!-- ===================== UPLOADER（dc-uploader） ===================== -->
            <div v-else-if="f.type === 'uploader'">
              <div v-if="getLayout(f) === 'vertical'" class="dc-field-vertical">
                <div class="dc-field-label" :class="{ required: isRequired(f) }">
                  {{ f.label }}
                </div>
                <div class="dc-pad-16">
                  <dc-uploader
                    v-model="uploaderModels[f.name]"
                    :multiple="(f.upload?.maxCount || 1) > 1"
                    :max-count="f.upload?.maxCount || 1"
                    :accept="acceptFor(f)"
                    :max-size-m-b="
                      f.upload?.maxSize ? Math.round(f.upload.maxSize / 1024 / 1024) : null
                    "
                    :disabled="isDisabled(f)"
                    :placeholder="f.placeholder || '请上传文件'"
                    :deletable="f.upload?.deletable ?? true"
                    :show-type-hint="true"
                  />
                </div>
              </div>
              <template v-else>
                <van-cell
                  :title="f.label"
                  :required="isRequired(f)"
                  :title-style="cellTitleStyle(f)"
                />
                <div class="dc-pad-16">
                  <dc-uploader
                    v-model="uploaderModels[f.name]"
                    :multiple="(f.upload?.maxCount || 1) > 1"
                    :max-count="f.upload?.maxCount || 1"
                    :accept="acceptFor(f)"
                    :max-size-m-b="
                      f.upload?.maxSize ? Math.round(f.upload.maxSize / 1024 / 1024) : null
                    "
                    :disabled="isDisabled(f)"
                    :placeholder="f.placeholder || '请上传文件'"
                    :deletable="f.upload?.deletable ?? true"
                    :show-type-hint="true"
                  />
                  <div class="dc-tip">
                    {{ f.placeholder }}
                  </div>
                  <div v-if="fieldDesc(f)" class="dc-desc">
                    {{ fieldDesc(f) }}
                  </div>
                </div>
              </template>
            </div>
            <!-- =================== /UPLOADER =================== -->
          </template>
        </template>
      </van-cell-group>

      <div v-if="fixedActions" class="dc-actions-spacer"></div>
    </div>

    <!-- 底部固定操作栏 -->
    <div v-if="fixedActions" class="dc-form-actions-fixed">
      <div class="dc-bar-inner">
        <div v-if="showCancel || showClear" class="dc-row dc-row-1">
          <van-button
            v-if="showCancel"
            size="small"
            block
            type="default"
            class="dc-btn-half"
            @click="onCancel"
          >
            {{ cancelText }}
          </van-button>
          <van-button
            v-if="showClear"
            size="small"
            block
            type="warning"
            plain
            class="dc-btn-half"
            @click="onClear"
          >
            {{ clearText }}
          </van-button>
        </div>
        <van-button block type="primary" class="dc-btn-submit" @click="onSubmit">
          {{ submitText }}
        </van-button>
      </div>
    </div>

    <!-- 非固定模式 -->
    <div v-else class="dc-form-actions-nonfixed">
      <van-button v-if="showCancel" block type="default" @click="onCancel">
        {{ cancelText }}
      </van-button>
      <div v-if="showCancel" style="height: 8px"></div>
      <van-button v-if="showClear" block type="warning" plain @click="onClear">
        {{ clearText }}
      </van-button>
      <div v-if="showClear" style="height: 8px"></div>
      <van-button block type="primary" @click="onSubmit">
        {{ submitText }}
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, computed } from 'vue';
import { showToast } from 'vant';

/** change 事件入参：
 * {
 *   name: string;
 *   value: any;
 *   model: Record<string, any>;
 *   field: any;
 * }
 */

const props = defineProps({
  schema: { type: Object, required: true },
  modelValue: { type: Object, default: () => ({}) },

  submitText: { type: String, default: '提交' },
  clearText: { type: String, default: '清空' },
  cancelText: { type: String, default: '取消' },
  showCancel: { type: Boolean, default: true },
  showClear: { type: Boolean, default: true },

  compact: { type: Boolean, default: true },
  fixedActions: { type: Boolean, default: true },
});
const emit = defineEmits([
  'update:modelValue',
  'change',
  'field-change',
  'submit',
  'clear',
  'cancel',
]);

/* ---------------- checkbox 字符串 ↔ 数组 工具 ---------------- */
function toArray(val) {
  if (Array.isArray(val)) return val;
  if (val === '' || val == null) return [];
  return String(val)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
function toCSV(arr) {
  if (!arr) return '';
  return Array.isArray(arr) ? arr.join(',') : String(arr);
}
/* schema 辅助 */
function findField(name) {
  return props.schema.fields.find((x) => x.name === name);
}

/* ---------------- helpers ---------------- */
function getDefaultByType(f) {
  if (f.type === 'checkbox') return '';
  if (f.type === 'uploader') {
    // ✅ 与 DcUploader 的 v-model 对齐：单选 null，多选 []
    const multiple = (f.upload?.maxCount || 1) > 1;
    return multiple ? [] : null;
  }
  return f.defaultValue ?? '';
}
function buildWithDefaults(fields, incoming = {}) {
  const base = {};
  fields.forEach((f) => {
    base[f.name] = incoming[f.name] !== undefined ? incoming[f.name] : getDefaultByType(f);

    // 补充 checkbox extra 字段
    if (f.type === 'checkbox' && Array.isArray(f.options)) {
      f.options.forEach((op) => {
        if (op.extra?.key) {
          const k = op.extra.key;
          base[k] = incoming[k] !== undefined ? incoming[k] : (op.extra.defaultValue ?? '');
        }
      });
    }
  });
  return base;
}
function getLayout(f) {
  return f.layout || props.schema.layout || 'horizontal';
}
function getLabelWidth(f) {
  const w = f.labelWidth ?? props.schema.labelWidth;
  if (w === undefined || w === null || w === '') return undefined;
  return typeof w === 'number' ? `${w}px` : String(w);
}
function cellTitleStyle(f) {
  const w = getLabelWidth(f);
  return w ? { flex: `0 0 ${w}`, maxWidth: w, whiteSpace: 'nowrap' } : {};
}
function fieldDesc(f) {
  const base = f.desc ?? f.description ?? '';
  if (f.type === 'checkbox' && typeof f.max === 'number') {
    const auto = `最多选择${f.max}项`;
    return base ? `${base}（${auto}）` : auto;
  }
  return base || '';
}

/* ---------------- local model ---------------- */
const local = reactive(buildWithDefaults(props.schema.fields, props.modelValue));

/* ===== checkbox 计算代理（供 v-model 成员表达式使用） ===== */
const checkboxModels = reactive({});
function buildCheckboxModels() {
  props.schema.fields.forEach((f) => {
    if (f.type !== 'checkbox') return;
    checkboxModels[f.name] = computed({
      get() {
        return toArray(local[f.name]);
      },
      set(arr) {
        onFieldUpdate(f, toCSV(arr));
      },
    });
  });
}
buildCheckboxModels();

/* ===== uploader 计算代理（对象直传，兼容旧数据） ===== */
const uploaderModels = reactive({});

// 兼容旧值：将字符串/数组字符串/对象数组 转换成 DcUploader 期望的形态
function coerceToVmShape(val, multiple) {
  if (multiple) {
    if (Array.isArray(val)) {
      return val
        .map((x) =>
          typeof x === 'string'
            ? { path: x, attachId: '' }
            : x && typeof x === 'object'
              ? { path: x.path || x.name || '', attachId: x.attachId || x.id || '' }
              : null
        )
        .filter((x) => x && x.path);
    }
    return [];
  } else {
    if (val && typeof val === 'object') {
      const path = val.path || val.link || val.name || '';
      const attachId = val.attachId || val.id || '';
      return path ? { path, attachId } : null;
    }
    return null;
  }
}

function buildUploaderModels() {
  props.schema.fields.forEach((f) => {
    if (f.type !== 'uploader') return;
    const multiple = (f.upload?.maxCount || 1) > 1;

    uploaderModels[f.name] = computed({
      get() {
        return coerceToVmShape(local[f.name], multiple);
      },
      set(vmVal) {
        // 仅保留表单需要的瘦身数据：{path, attachId}
        if (multiple) {
          local[f.name] = (Array.isArray(vmVal) ? vmVal : [])
            .filter((x) => x && x.path)
            .map((x) => ({ path: x.path, attachId: x.attachId || '' }));
        } else {
          local[f.name] =
            vmVal && vmVal.path ? { path: vmVal.path, attachId: vmVal.attachId || '' } : null;
        }
        // 同步到父层
        syncUpstream(f.name, local[f.name]);
      },
    });
  });
}
buildUploaderModels();

/* ----- date/time mirrors ----- */
const dateModel = reactive({});
const timeModel = reactive({});
function ensureDateTimeModels() {
  props.schema.fields.forEach((f) => {
    if (f.type !== 'date') return;
    const v = local[f.name];
    if (f.dateType === 'time') {
      if (!timeModel[f.name]) timeModel[f.name] = parseHMSToArr(v);
    } else if (f.dateType === 'datetime') {
      if (!dateModel[f.name]) dateModel[f.name] = parseYMDToArr((v || '').split(' ')[0]);
      if (!timeModel[f.name]) timeModel[f.name] = parseHMSToArr((v || '').split(' ')[1]);
    } else {
      if (!dateModel[f.name]) dateModel[f.name] = parseYMDToArr(v);
    }
  });
}
ensureDateTimeModels();

/* 防递归：同步 props → local（差异复制） */
watch(
  () => props.modelValue,
  (nv) => {
    const next = buildWithDefaults(props.schema.fields, nv || {});
    let dirty = false;
    Object.keys(next).forEach((k) => {
      if (!isShallowEqual(local[k], next[k])) {
        local[k] = next[k];
        dirty = true;
      }
    });
    if (dirty) {
      ensureDateTimeModels();
      buildCheckboxModels();
      buildUploaderModels();
    }
  },
  { deep: true }
);

/* 如 schema 可能动态变更，同步 models（可选） */
watch(
  () => props.schema.fields,
  () => {
    buildCheckboxModels();
    buildUploaderModels();
  },
  { deep: true }
);

/* ----- emit helpers ----- */
function safeClone(value) {
  const seen = new WeakSet();
  const walk = (v) => {
    if (v === null || typeof v !== 'object') return v;
    if (seen.has(v)) return undefined;
    seen.add(v);
    if (Array.isArray(v)) return v.map(walk);
    const out = {};
    for (const k of Object.keys(v)) {
      if (k === 'nodes') continue;
      const kv = v[k];
      if (typeof kv === 'function' || typeof kv === 'symbol') continue;
      out[k] = walk(kv);
    }
    return out;
  };
  try {
    const sc = typeof structuredClone === 'function' ? structuredClone(value) : value;
    return walk(sc);
  } catch {
    return walk(value);
  }
}
function isShallowEqual(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b))
    return a.length === b.length && a.every((v, i) => a[i] === b[i]);
  if (typeof a === 'object' && typeof b === 'object' && a && b) {
    const ka = Object.keys(a),
      kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every((k) => a[k] === b[k]);
  }
  return false;
}
function deepEqual(a, b) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}
function syncUpstream(name, value) {
  const payload = safeClone(local);
  if (!deepEqual(payload, props.modelValue)) {
    emit('update:modelValue', payload);
  }
  const field = props.schema.fields.find((x) => x.name === name) || null;
  const evt = { name, value, model: payload, field };
  emit('change', evt);
  emit('field-change', evt);
}
function onFieldUpdate(f, val) {
  const next = f?.type === 'checkbox' ? toCSV(Array.isArray(val) ? val : toArray(val)) : val;
  if (!isShallowEqual(local[f.name], next)) {
    local[f.name] = next;
    syncUpstream(f.name, next);
  }
}

/* ----- visibility / required / disabled / readonly / validate ----- */
const get = (k) => {
  const f = findField(k);
  if (f?.type === 'checkbox') return toArray(local[k]);
  return local[k];
};
const isVisible = (f) => {
  const cond = f.visibleWhen;
  if (!cond) return true;
  const list = Array.isArray(cond) ? cond : [cond];
  return list.every((c) => {
    const v = get(c.when);
    if ('equals' in c) return v === c.equals;
    if ('includes' in c) return Array.isArray(v) && v.includes(c.includes);
    return true;
  });
};
const isRequired = (f) => {
  if (typeof f.required === 'boolean' || f.required === undefined) return !!f.required;
  const c = f.required;
  const v = get(c.when);
  if ('equals' in c) return v === c.equals;
  if ('includes' in c) return Array.isArray(v) && v.includes(c.includes);
  return false;
};
function isDisabled(f) {
  if (typeof f.disabled === 'boolean' || f.disabled === undefined) return !!f.disabled;
  const c = f.disabled;
  const v = get(c.when);
  if ('equals' in c) return v === c.equals;
  if ('includes' in c) return Array.isArray(v) && v.includes(c.includes);
  return false;
}
function isReadonly(f) {
  if (typeof f.readonly === 'boolean' || f.readonly === undefined) return !!f.readonly;
  const c = f.readonly;
  const v = get(c.when);
  if ('equals' in c) return v === c.equals;
  if ('includes' in c) return Array.isArray(v) && v.includes(c.includes);
  return false;
}

function validateField(f) {
  if (!isVisible(f)) return true;
  const logicVal = get(f.name);
  if (isRequired(f)) {
    if (f.type === 'uploader') {
      const multiple = (f.upload?.maxCount || 1) > 1;

      // ⚡️强制标准化，避免 local 里是字符串 / 异构对象
      const coerced = coerceToVmShape(logicVal, multiple);

      let has = false;
      if (multiple) {
        has = Array.isArray(coerced) && coerced.some((it) => it && it.path);
      } else {
        has = coerced && coerced.path;
      }

      if (!has) {
        return `${f.label}为必传项`;
      }
    } else if (f.type === 'checkbox') {
      if (!toArray(local[f.name]).length) return `请选择${f.label}`;
    } else if (logicVal === '' || logicVal === null || logicVal === undefined) {
      return (
        (f.placeholder && f.placeholder.replace(/^请输入|^请选择/, '请填写')) || `请输入${f.label}`
      );
    }
  }

  if (f.type === 'checkbox') {
    const arr = toArray(local[f.name]);
    if (typeof f.max === 'number' && arr.length > f.max) {
      return `${f.label}最多选择${f.max}项`;
    }
  }

  if (
    f.validate?.pattern &&
    typeof logicVal === 'string' &&
    !new RegExp(f.validate.pattern).test(logicVal)
  ) {
    return f.validate.message || `${f.label}格式不正确`;
  }
  if (typeof f.validate?.validator === 'function') {
    const ret = f.validate.validator(logicVal, local);
    if (ret !== true) return typeof ret === 'string' ? ret : `${f.label}不合法`;
  }

  // 上传的扩展名/大小校验建议交给 DcUploader 选择前处理；这里仅做“是否有值”的业务校验
  // 如需额外校验，可在 f.validate.validator 中自定义

  // checkbox extra
  if (f.type === 'checkbox' && Array.isArray(f.options)) {
    const checked = toArray(local[f.name]);
    for (const op of f.options) {
      if (op?.extra && checked.includes(op.value)) {
        const key = op.extra.key;
        const label = op.extra.label || '补充信息';
        const extraVal = local[key];
        if (op.extra.required && (extraVal === '' || extraVal === null || extraVal === undefined)) {
          return `请填写${label}`;
        }
        if (
          op.extra.pattern &&
          typeof extraVal === 'string' &&
          !new RegExp(op.extra.pattern).test(extraVal)
        ) {
          return op.extra.message || `${label}格式不正确`;
        }
        if (typeof op.extra.validator === 'function') {
          const r = op.extra.validator(extraVal, local);
          if (r !== true) return typeof r === 'string' ? r : `${label}不合法`;
        }
      }
    }
  }
  return true;
}
function validate() {
  for (const f of props.schema.fields) {
    const res = validateField(f);
    if (res !== true) return res;
  }
  return true;
}

/* ====== DcUploader 辅助 ====== */
// 将 'png,jpg,application/pdf' 规范化为 '.png,.jpg,application/pdf'
function acceptFor(f) {
  const acc = f.upload?.accept;
  if (!acc) return 'image/*';
  const items = String(acc)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((x) => (x.includes('/') || x.startsWith('.') || x === '*/*' ? x : `.${x}`));
  return items.join(',');
}

/* 弹窗/缓存/搜索（原样） */
const popup = reactive({});
const pickerColumnsCache = reactive({});
const searchCache = reactive({});
const searchState = reactive({});
let debounceTimer = null;

function guardOpen(f, open) {
  if (isDisabled(f) || isReadonly(f)) return;
  if (f.type === 'date') {
    const v = local[f.name];
    if (f.dateType === 'time') {
      timeModel[f.name] = parseHMSToArr(v);
    } else if (f.dateType === 'datetime') {
      const [dStr, tStr] = (v || '').split(' ');
      dateModel[f.name] = parseYMDToArr(dStr);
      timeModel[f.name] = parseHMSToArr(tStr);
    } else {
      dateModel[f.name] = parseYMDToArr(v, mapColumnsType(f.dateType));
    }
  }
  open();
}

/* picker */
function openPicker(f) {
  guardOpen(f, () => {
    if (f.type === 'picker' && typeof f.columns === 'function') {
      const key = f.name;
      if (!pickerColumnsCache[key] || f.forceReload) {
        Promise.resolve(f.columns()).then((cols) => {
          pickerColumnsCache[key] = cols || [];
        });
      }
    }
    popup[f.name] = true;
  });
}
function onPickerConfirm(f, detail) {
  const valueKey = f.valueKey || 'value';
  const v = detail?.selectedValues?.[0] ?? detail?.value ?? detail;
  onFieldUpdate(f, typeof v === 'object' && v !== null ? (v[valueKey] ?? v) : v);
  popup[f.name] = false;
}
function getPickerColumns(f) {
  if (Array.isArray(f.columns)) return f.columns;
  return pickerColumnsCache[f.name] || [];
}
function getPickerLabel(f) {
  const valueKey = f.valueKey || 'value';
  const labelKey = f.labelKey || 'label';
  const v = local[f.name];
  if (typeof f.displayFormatter === 'function') return f.displayFormatter(v, local);
  const cols = getPickerColumns(f);
  const hit = cols.find((it) => (it && typeof it === 'object' ? it[valueKey] === v : it === v));
  if (!hit) return v ?? '';
  return typeof hit === 'object' ? (hit[labelKey] ?? v ?? '') : String(hit);
}

/* date/time */
function openDate(f) {
  guardOpen(f, () => (popup[f.name] = true));
}
function mapColumnsType(dateType) {
  if (dateType === 'year-month') return ['year', 'month'];
  return ['year', 'month', 'day'];
}
function pad2(s) {
  return String(s ?? '').padStart(2, '0');
}
function parseYMDToArr(str, cols = ['year', 'month', 'day']) {
  if (!str) {
    const now = new Date();
    return cols.length === 2
      ? [String(now.getFullYear()), pad2(now.getMonth() + 1)]
      : [String(now.getFullYear()), pad2(now.getMonth() + 1), pad2(now.getDate())];
  }
  const parts = String(str).split(/[^\d]/).filter(Boolean);
  if (cols.length === 2)
    return [
      parts[0] || String(new Date().getFullYear()),
      pad2(parts[1] || new Date().getMonth() + 1),
    ];
  return [
    parts[0] || String(new Date().getFullYear()),
    pad2(parts[1] || new Date().getMonth() + 1),
    pad2(parts[2] || new Date().getDate()),
  ];
}
function parseHMSToArr(str) {
  if (!str) return ['00', '00'];
  const p = String(str)
    .split(':')
    .map((s) => s.trim());
  if (p.length >= 3) return [pad2(p[0]), pad2(p[1]), pad2(p[2])];
  return [pad2(p[0] || '00'), pad2(p[1] || '00')];
}
function onDateConfirmV4(f) {
  const cols = mapColumnsType(f.dateType);
  const arr = dateModel[f.name] || [];
  const y = arr[0],
    m = pad2(arr[1]),
    d = pad2(arr[2]);
  const val = cols.length === 2 ? `${y}-${m}` : `${y}-${m}-${d}`;
  onFieldUpdate(f, val);
  popup[f.name] = false;
}
function onTimeConfirmV4(f) {
  const arr = timeModel[f.name] || [];
  const hh = pad2(arr[0]),
    mm = pad2(arr[1]),
    ss = arr[2] != null ? pad2(arr[2]) : null;
  const val = ss ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`;
  onFieldUpdate(f, val);
  popup[f.name] = false;
}
function onDateTimeConfirmV4(f) {
  const dArr = dateModel[f.name] || [];
  const tArr = timeModel[f.name] || [];
  const y = dArr[0],
    m = pad2(dArr[1]),
    d = pad2(dArr[2]);
  const hh = pad2(tArr[0] || '00'),
    mm = pad2(tArr[1] || '00'),
    ss = tArr[2] != null ? pad2(tArr[2]) : null;
  const dateStr = `${y}-${m}-${d}`;
  const timeStr = ss ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`;
  onFieldUpdate(f, `${dateStr} ${timeStr}`);
  popup[f.name] = false;
}

/* area/cascader */
function openArea(f) {
  guardOpen(f, () => (popup[f.name] = true));
}
function onAreaConfirm(f, detail) {
  const sel = detail.selectedOptions || [];
  const text = sel.map((i) => i.name || i.text).join('/');
  const val = f.return === 'object' ? { text, codes: sel.map((i) => i.code) } : text;
  onFieldUpdate(f, val);
  popup[f.name] = false;
}
function openCascader(f) {
  guardOpen(f, () => (popup[f.name] = true));
}
function onCascaderFinish(f, { selectedOptions }) {
  const text = (selectedOptions || []).map((i) => i.text || i.label).join('/');
  const val =
    f.return === 'object'
      ? { text, values: (selectedOptions || []).map((i) => i.value) }
      : (selectedOptions?.[selectedOptions.length - 1]?.value ?? '');
  onFieldUpdate(f, val);
  popup[f.name] = false;
}
function cascaderLazyLoad(f, node, resolve) {
  if (typeof f.lazyLoad !== 'function') return resolve([]);
  Promise.resolve(f.lazyLoad(node)).then((children) => resolve(children || []));
}

/* searchPicker */
function openSearchPicker(f) {
  guardOpen(f, () => {
    const key = f.name;
    popup[key] = true;
    if (!searchState[key]) searchState[key] = { q: '', loading: false, list: [], inited: false };
    if (!searchState[key].inited && f.search?.autoload) doSearch(f, '');
  });
}
function doSearch(f, q) {
  const key = f.name;
  if (!f.search || typeof f.search.fetch !== 'function') return;
  searchState[key].q = q;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    searchState[key].loading = true;
    try {
      const cacheKey = q.trim();
      if (f.search.cache !== false && searchCache[key]?.[cacheKey]) {
        searchState[key].list = searchCache[key][cacheKey];
      } else {
        const items = await f.search.fetch(q);
        searchState[key].list = items || [];
        searchCache[key] = searchCache[key] || {};
        if (f.search.cache !== false) searchCache[key][cacheKey] = items || [];
      }
      searchState[key].inited = true;
    } catch (e) {
      showToast('查询失败');
      searchState[key].list = [];
    } finally {
      searchState[key].loading = false;
    }
  }, f.search.debounce ?? 300);
}
function onChooseSearchItem(f, item) {
  const valueKey = f.search?.valueKey || 'value';
  const labelKey = f.search?.labelKey || 'label';
  const v = item[valueKey];
  if (f.search?.attachLabelField) local[f.search.attachLabelField] = item[labelKey];
  onFieldUpdate(f, v);
  popup[f.name] = false;
}

/* submit / clear / cancel */
function onSubmit() {
  const res = validate();
  if (res !== true) return showToast(String(res));
  const payload = props.schema.mapSubmit
    ? props.schema.mapSubmit(safeClone(local))
    : safeClone(local);
  emit('submit', payload);
}
function onClear() {
  clear();
  emit('clear');
}
function onCancel() {
  emit('cancel');
}

/* expose */
function clear() {
  const next = buildWithDefaults(props.schema.fields, {});
  let dirty = false;
  Object.keys(next).forEach((k) => {
    if (!isShallowEqual(local[k], next[k])) {
      local[k] = next[k];
      dirty = true;
    }
  });
  props.schema.fields.forEach((f) => {
    if (f.type === 'checkbox' && Array.isArray(f.options)) {
      f.options.forEach((op) => {
        if (op.extra?.key && local[op.extra.key] === undefined) {
          local[op.extra.key] = op.extra.defaultValue ?? '';
        }
      });
    }
  });
  Object.keys(dateModel).forEach((k) => (dateModel[k] = undefined));
  Object.keys(timeModel).forEach((k) => (timeModel[k] = undefined));
  ensureDateTimeModels();
  buildCheckboxModels();
  buildUploaderModels();
  if (dirty) syncUpstream('__clear__', safeClone(local));
}
function setField(name, value) {
  const f = props.schema.fields.find((x) => x.name === name);
  if (!f) return;
  onFieldUpdate(f, f.type === 'checkbox' ? toCSV(toArray(value)) : value);
}

defineExpose({ clear, validate, setField });
</script>

<style lang="scss" scoped>
$dc-input-bg: #f6f8fa;
$dc-radius: 6px;

.dc-container {
  padding: 10px;
  background: var(--van-cell-group-background);
}

.dc-recruit-form.dc-compact {
  .dc-container {
    padding: 8px;
  }
  :deep(.van-cell-group--inset) {
    margin: 6px 6px;
  }
  .dc-field-vertical {
    margin-bottom: 8px;
  }
  .dc-pad-16 {
    padding: 6px 12px;
  }
  .dc-pad-12 {
    padding: 6px 10px;
  }
  .dc-cb-row {
    margin-bottom: 6px;
  }
}

.dc-field-vertical {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}
.dc-field-label {
  font-size: 14px;
  color: #666;
  margin: 2px 0 6px;
  &.required::before {
    content: '*';
    color: #ee0a24;
    margin-right: 4px;
  }
}

.dc-desc {
  font-size: 12px;
  color: #9aa0a6;
  margin: 6px 2px 0;
  line-height: 1.4;
}
.dc-desc-inset {
  padding: 0 16px;
}

.dc-cb-row {
  margin-bottom: 8px;
}
.dc-extra-wrap {
  margin-top: 6px;
  padding-left: 28px;
}

.dc-pad-16 {
  padding: 8px 16px;
}
.dc-pad-12 {
  padding: 8px 12px;
}
.dc-tip {
  font-size: 12px;
  color: #888;
  margin-top: 6px;
}

:deep(.van-field__control),
:deep(.van-field__value) {
  background-color: $dc-input-bg !important;
  border-radius: $dc-radius;
  padding: 6px 8px;
}

.dc-search-panel {
  padding: 8px 12px 12px;

  .dc-search {
    :deep(.van-search__content) {
      background-color: $dc-input-bg !important;
      border-radius: $dc-radius;
      padding: 2px 8px;
      min-height: 36px;
      display: flex;
      align-items: center;
    }
    :deep(.van-field__control) {
      background-color: transparent !important;
      padding: 0;
      height: 28px;
      line-height: 28px;
    }
    :deep(.van-field__left-icon),
    :deep(.van-field__right-icon) {
      color: #999;
    }
    :deep(.van-field__control::placeholder) {
      color: #b6b6b6;
    }
    :deep(.van-search__action) {
      margin-left: 8px;
      color: var(--van-primary-color);
      font-size: 14px;
    }
  }
}

.dc-form-actions-fixed {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  box-shadow: 0 -6px 24px rgba(0, 0, 0, 0.06);
  padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
  z-index: 999;

  .dc-bar-inner {
    max-width: 720px;
    margin: 0 auto;
  }
  .dc-row.dc-row-1 {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
  }
  .dc-btn-half {
    flex: 1 1 0;
  }
  .dc-btn-submit {
    height: 40px;
  }
}

.dc-actions-spacer {
  height: calc(40px + 8px + 8px + env(safe-area-inset-bottom) + 32px);
}

.dc-form-actions-nonfixed {
  padding: 12px;
  background: #fff;
}
</style>
