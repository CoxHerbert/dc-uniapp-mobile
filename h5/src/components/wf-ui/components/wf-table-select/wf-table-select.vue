<template>
  <div class="wf-table-select">
    <div class="wf-table-select__field" @click="handleClick">
      <van-field
        v-model="input"
        readonly
        is-link
        :placeholder="getPlaceholder(column, column.type)"
        :disabled="disabled"
      />
    </div>

    <van-popup
      v-model:show="show"
      position="bottom"
      :style="{ height: '90%' }"
      round
      teleport="body"
      :close-on-click-overlay="false"
    >
      <div class="wf-table-select__search" v-if="singleSearch">
        <van-search
          v-model="searchValue"
          shape="square"
          :placeholder="`请输入${singleSearch.label}`"
          background="#f6f6f6"
          :show-action="false"
          @search="tableLoad(true)"
          @clear="tableLoad(true)"
        />
      </div>
      <div class="wf-table-select__content">
        <template v-if="multiple">
          <van-checkbox-group v-model="checkboxValue">
            <template v-for="(item, index) in data" :key="index">
              <item
                :index="index"
                :item="item"
                :value-key="valueKey"
                :children-key="childrenKey"
                :has-children-key="hasChildrenKey"
                :multiple="multiple"
                :selection-list="Array.from(selectionList)"
                :c-column="cColumn"
                :arrow-keys="arrowKeys"
                :disabled="disabled"
                @row-expand="handleRowExpand"
              />
              <template v-if="item[childrenKey] || item[hasChildrenKey]">
                <div v-show="arrowKeys.includes(item[valueKey])" class="wf-table-select__children">
                  <div class="wf-table-select__children-icon">
                    <van-icon name="arrow-down" />
                  </div>
                  <template v-for="(cItem, cIndex) in item[childrenKey]" :key="cIndex">
                    <item
                      :index="cIndex"
                      :item="cItem"
                      :value-key="valueKey"
                      :children-key="childrenKey"
                      :has-children-key="hasChildrenKey"
                      :multiple="multiple"
                      :selection-list="Array.from(selectionList)"
                      :c-column="cColumn"
                      :arrow-keys="arrowKeys"
                      :disabled="disabled"
                      @row-expand="handleRowExpand"
                    />
                  </template>
                </div>
              </template>
            </template>
          </van-checkbox-group>
        </template>
        <template v-else>
          <van-radio-group v-model="radioValue">
            <template v-for="(item, index) in data" :key="index">
              <item
                :index="index"
                :item="item"
                :value-key="valueKey"
                :children-key="childrenKey"
                :has-children-key="hasChildrenKey"
                :multiple="multiple"
                :selection-list="Array.from(selectionList)"
                :c-column="cColumn"
                :arrow-keys="arrowKeys"
                :disabled="disabled"
                @row-expand="handleRowExpand"
              />
              <template v-if="item[childrenKey] || item[hasChildrenKey]">
                <div v-show="arrowKeys.includes(item[valueKey])" class="wf-table-select__children">
                  <div class="wf-table-select__children-icon">
                    <van-icon name="arrow-down" />
                  </div>
                  <template v-for="(cItem, cIndex) in item[childrenKey]" :key="cIndex">
                    <item
                      :index="cIndex"
                      :item="cItem"
                      :value-key="valueKey"
                      :children-key="childrenKey"
                      :has-children-key="hasChildrenKey"
                      :multiple="multiple"
                      :selection-list="Array.from(selectionList)"
                      :c-column="cColumn"
                      :arrow-keys="arrowKeys"
                      :disabled="disabled"
                      @row-expand="handleRowExpand"
                    />
                  </template>
                </div>
              </template>
            </template>
          </van-radio-group>
        </template>
        <div v-if="needPage" class="wf-table-select__loadmore">
          <van-button
            v-if="loadStatus === 'loadmore'"
            size="small"
            type="primary"
            plain
            @click="tableLoad(false)"
          >
            加载更多
          </van-button>
          <van-loading v-else-if="loadStatus === 'loading'" size="20px">加载中...</van-loading>
          <span v-else class="wf-table-select__nomore">没有更多了</span>
        </div>
      </div>
      <div class="wf-table-select__action">
        <div>
          <van-checkbox
            v-if="multiple"
            v-model:checked="allCheckedProxy"
            shape="square"
          >
            全选({{ Array.from(selectionList).length || 0 }})
          </van-checkbox>
        </div>

        <div class="wf-table-select__action--right">
          <van-button size="small" type="default" plain @click="close">关闭</van-button>
          <van-button size="small" type="warning" plain @click="handelClear">清空</van-button>
          <van-button size="small" type="primary" @click="handleSubmit">确定</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import {
  Field,
  Popup,
  Search,
  CheckboxGroup,
  Checkbox,
  RadioGroup,
  Radio,
  Icon,
  Button,
  Loading,
  Toast,
} from 'vant';
import Props from '../../mixins/props.js';
import { getAsVal } from '../../util/index.js';
import Item from './item.vue';

export default defineComponent({
  name: 'WfTableSelect',
  components: {
    [Field.name]: Field,
    [Popup.name]: Popup,
    [Search.name]: Search,
    [CheckboxGroup.name]: CheckboxGroup,
    [Checkbox.name]: Checkbox,
    [RadioGroup.name]: RadioGroup,
    [Radio.name]: Radio,
    [Icon.name]: Icon,
    [Button.name]: Button,
    [Loading.name]: Loading,
    Item,
  },
  mixins: [Props],
  data() {
    return {
      input: '',
      show: false,
      searchValue: '',
      isInit: false,
      page: {},
      data: [],
      selectionList: new Set(),
      loadStatus: 'loadmore',
      arrowKeys: [],
      text: '',
      allChecked: false,
    };
  },
  computed: {
    multiple() {
      return this.column.multiple;
    },
    children() {
      return this.column.children || {};
    },
    cColumn() {
      return this.children.column || [];
    },
    cProps() {
      return this.children.props || {};
    },
    url() {
      return this.cProps.url;
    },
    method() {
      return this.cProps.method;
    },
    needPage() {
      return this.cProps.needPage;
    },
    currentPageKey() {
      return this.cProps.currentPageKey;
    },
    pageSizeKey() {
      return this.cProps.pageSizeKey;
    },
    totalKey() {
      return this.cProps.totalKey;
    },
    recordsKey() {
      return this.cProps.recordsKey || '';
    },
    resKey() {
      return this.cProps.resKey || 'data';
    },
    valueKey() {
      const key = this.column.props?.value;
      if (!key) {
        console.error(
          `[table-select](${this.column.label}): 未配置rowKey, 使用默认值'id', 可能会导致选择失效。`
        );
        return 'id';
      }
      return key;
    },
    lazy() {
      return this.cProps.lazy;
    },
    parentKey() {
      return this.cProps.parentKey || 'parentId';
    },
    childrenKey() {
      return this.cProps.childrenKey || 'children';
    },
    hasChildrenKey() {
      return this.cProps.hasChildrenKey || 'hasChildren';
    },
    checkStrictly() {
      return this.cProps.checkStrictly;
    },
    values() {
      return Array.from(this.selectionList)
        .map((item) => item[this.valueKey])
        .join(',');
    },
    labels() {
      const labels = Array.from(this.selectionList)
        .map((item) => item[this.labelKey])
        .join(' | ');
      if (typeof this.formatter === 'function') {
        const label = this.formatter(Array.from(this.selectionList)) || labels;
        return Array.isArray(label) ? label.join(' | ') : label;
      }
      return labels;
    },
    singleSearch() {
      return (this.children.column || []).find((item) => item.search === true);
    },
    checkboxValue: {
      get() {
        return Array.from(this.selectionList).map((item) => item[this.valueKey]);
      },
      set(value) {
        this.handleRowCheck(value);
      },
    },
    radioValue: {
      get() {
        const list = Array.from(this.selectionList);
        return list.length ? list[0][this.valueKey] : '';
      },
      set(value) {
        this.handleRowCheck(value);
      },
    },
    allCheckedProxy: {
      get() {
        return this.allChecked;
      },
      set(val) {
        this.handleAllCheck(val);
      },
    },
  },
  methods: {
    initValue() {
      const val = this.text;
      if (val && typeof val === 'object') {
        const label = val[this.labelKey].split(' | ');
        const value = val[this.valueKey].split(',');
        this.input = val[this.labelKey];
        const arr = [];
        value.forEach((v, i) => {
          if (v) {
            arr.push({
              [this.valueKey]: v,
              [this.labelKey]: label[i],
            });
          }
        });
        this.selectionList = new Set(arr);
      } else {
        this.input = '';
        this.selectionList = new Set();
      }
      this.syncAllChecked();
    },
    handleClick() {
      if (this.disabled) return;
      this.show = true;
      if (!this.isInit) this.tableLoad(true);
    },
    handleRowCheck(value) {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        this.selectionList = new Set();
        this.syncAllChecked();
        return;
      }
      const findRow = (data, key) => {
        if (!data) {
          return;
        }
        for (let i = 0; i < data.length; i++) {
          const s = data[i];
          if (s[this.valueKey] === key) {
            return s;
          }
          const r = findRow(s[this.childrenKey], key);
          if (r) {
            return r;
          }
        }
        return undefined;
      };
      if (this.multiple) {
        const values = Array.isArray(value) ? value : `${value}`.split(',');
        const arr = [];
        values.forEach((v) => {
          const r = findRow(this.data, v);
          if (r) {
            arr.push(r);
          }
        });
        this.selectionList = new Set(arr);
      } else {
        const row = findRow(this.data, value);
        if (row) {
          this.selectionList = new Set([row]);
        } else {
          this.selectionList = new Set();
        }
      }
      this.syncAllChecked();
    },
    handleAllCheck(checked) {
      this.selectionList = new Set();
      if (checked) {
        const arr = [];
        const resolveChildren = (list) => {
          if (!list || list.length === 0) return;
          list.forEach((l) => {
            arr.push(l);
            resolveChildren(l[this.childrenKey]);
          });
        };
        resolveChildren(this.data);
        this.selectionList = new Set(arr);
      }
      this.syncAllChecked();
    },
    handleRowExpand({ row, index }) {
      const key = row[this.valueKey];
      const idx = this.arrowKeys.findIndex((a) => a === key);
      if (idx > -1) {
        this.arrowKeys.splice(idx, 1);
      } else {
        this.arrowKeys.push(key);

        if (!row[this.childrenKey] || row[this.childrenKey].length === 0) {
          this.treeLoad(row, index);
        }
      }
    },
    handelClear() {
      this.selectionList = new Set();
      this.syncAllChecked();
    },
    close() {
      this.show = false;
    },
    handleSubmit() {
      this.input = this.labels;
      this.text = {
        [this.valueKey]: this.values,
        [this.labelKey]: this.labels,
      };
      this.show = false;
      this.$emit('label-change', this.text);
    },
    totalDataLength() {
      let total = 0;
      const getTotal = (list) => {
        if (!list || list.length === 0) return;
        list.forEach((l) => {
          total++;

          getTotal(l[this.childrenKey]);
        });
      };
      getTotal(this.data);
      return total;
    },
    syncAllChecked() {
      const total = this.totalDataLength();
      const selected = Array.from(this.selectionList).length;
      this.allChecked = total > 0 && total === selected;
    },
    treeLoad(tree, index) {
      if (!this.lazy) {
        return;
      }
      const params = {
        [this.parentKey]: tree[this.valueKey],
      };
      this.getList(false, params).then((res) => {
        const { data, value } = res;
        this.data[index][this.childrenKey] = data;
        this.handleRowCheck(value);
      });
    },
    tableLoad(clear = false) {
      this.getList(clear).then((res) => {
        const { total, data, value } = res;
        if (this.needPage) {
          this.page.total = total;

          if (data.length < this.page[this.pageSizeKey]) this.loadStatus = 'nomore';
          else this.loadStatus = 'loadmore';

          this.page[this.currentPageKey]++;
        }

        if (clear) this.data = data || [];
        else this.data = this.data.concat(data || []);

        this.handleRowCheck(value);
      });
    },
    getList(clear = false, query = {}) {
      return new Promise((resolve) => {
        this.loadStatus = 'loading';
        if (clear) {
          this.page = {
            [this.currentPageKey]: 1,
            [this.pageSizeKey]: 5,
          };
        }
        const page = this.page;
        let value;
        if (this.isInit) {
          value = this.values;
        } else if (this.text && typeof this.text === 'object') {
          value = this.text[this.valueKey];
        }
        this.isInit = true;
        const searchProp = this.singleSearch?.prop;
        const searchParams = searchProp ? { [searchProp]: this.searchValue } : {};
        if (typeof this.column.onLoad === 'function') {
          this.column
            .onLoad({
              page: this.page,
              data: searchParams,
              value,
            })
            .then((res) => {
              const { total, data } = res;
              resolve({ total, data, value });
            });
        } else {
          const option = {
            url: this.url,
            method: this.method,
          };

          let params = { ...searchParams };
          if (this.needPage) {
            params = Object.assign(params, page);
          }
          if (this.method === 'get') {
            option.params = { ...params, ...query };
          } else {
            option.data = { ...params, ...query };
          }
          this.$http.request(option).then((res) => {
            const response = getAsVal(res, this.resKey);
            if (!response) {
              Toast.fail('未查询到数据或者返回层级配置错误');
              resolve({ total: 0, data: [], value });
              return;
            }
            const total = getAsVal(response, this.totalKey) || 0;
            const records = getAsVal(response, this.recordsKey) || [];
            resolve({ total, data: records, value });
          });
        }
      });
    },
  },
});
</script>

<style lang="scss" scoped>
.wf-table-select {
  width: 100%;

  &__field {
    position: relative;

    .van-field {
      padding: 10px 0;
    }

    &::after {
      position: absolute;
      top: 0;
      left: 0;
      width: 90%;
      height: 90%;
      z-index: 100;
      content: '';
    }
  }

  &__search {
    padding: 15px;
  }

  &__content {
    height: calc(100% - 116px - env(safe-area-inset-bottom));
    box-sizing: border-box;
    background-color: #f6f6f6;
    overflow-y: auto;
  }

  &__children {
    display: flex;
    flex-direction: column;
    margin-left: 8px;
  }

  &__children-icon {
    text-align: center;
    color: #969799;
    margin-bottom: 4px;
  }

  &__loadmore {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 8px 0 16px;
  }

  &__nomore {
    color: #969799;
    font-size: 13px;
  }

  &__action {
    position: sticky;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 99;
    width: 100%;
    padding: 12px;
    background: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;

    &--right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }
}
</style>
