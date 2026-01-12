<template>
  <div>
    <van-popup v-model:show="visible" position="bottom" :style="{ height: '90%' }" round>
      <div class="search-item">
        <div
          v-for="(item, index) in singleSearch"
          :key="index"
          class="search-item-input"
          :class="{ wid100: singleSearch.length === 1 }"
        >
          <van-search
            v-model="searchFormData[item.prop]"
            :placeholder="`请输入${item.label}`"
            shape="square"
            clearable
            background="#f6f6f6"
            @search="getList(true)"
            @clear="getList(true)"
          />
        </div>
      </div>
      <div class="check-item">
        <template v-if="checkType === 'radio'">
          <van-radio-group v-model="radioValue" direction="vertical">
            <van-radio
              v-for="group in list"
              :key="group.id"
              :name="group.id"
              :disabled="group.disabled"
            >
              <div class="item">
                <div v-for="(itemColumn, idx) in column" :key="idx" class="item-column">
                  <div class="real-name">{{ itemColumn.label }}</div>
                  <div class="dept-name">{{ group[itemColumn.prop] || '-' }}</div>
                </div>
              </div>
            </van-radio>
          </van-radio-group>
        </template>
        <template v-else>
          <van-checkbox-group v-model="checkedValues" direction="vertical">
            <van-checkbox
              v-for="item in list"
              :key="item.id"
              :name="item.id"
              :disabled="item.disabled"
            >
              <div class="item">
                <div v-for="(itemColumn, idx) in column" :key="idx" class="item-column">
                  <div class="real-name">{{ itemColumn.label }}</div>
                  <div class="dept-name">{{ item[itemColumn.prop] || '-' }}</div>
                </div>
              </div>
            </van-checkbox>
          </van-checkbox-group>
        </template>
        <div v-if="loadStatus !== 'nomore'" class="load-more" @click="getList()">
          <span v-if="loadStatus === 'loadmore'">点击加载更多</span>
          <van-loading v-else size="20" />
        </div>
        <div v-else class="load-more">没有更多了</div>
      </div>
      <div class="foot-item" :class="checkType === 'radio' ? 'flex-evenly' : 'flex-between'">
        <van-checkbox
          v-if="checkType !== 'radio'"
          :model-value="allChecked"
          @update:model-value="toggleAll"
        >
          全选
        </van-checkbox>
        <div class="foot-actions" :class="{ 'flex-between': checkType === 'checkbox' }">
          <van-button size="small" type="primary" @click="handleClose">关闭</van-button>
          <van-button size="small" type="danger" plain @click="handleClear">清空</van-button>
          <van-button size="small" type="primary" @click="handleConfirm">确定</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { Toast } from 'vant';

export default defineComponent({
  name: 'WfUserSelect',
  props: {
    defaultChecked: {
      type: String,
      default: '',
    },
    params: {
      type: Object,
      default: () => ({}),
    },
    fnUrl: {
      type: String,
      default: '/blade-bip/laborRegister/list-select',
    },
    customOption: Object,
    checkType: {
      type: String,
      default: 'radio',
    },
    cColumn: Object,
  },
  data() {
    return {
      searchFormData: {},
      radioValue: '',
      visible: false,
      allChecked: false,
      checkedValues: [],
      page: {
        size: 10,
        current: 1,
      },
      list: [],
      init: false,
      loadStatus: 'loadmore',
    };
  },
  computed: {
    qparams() {
      return this.params;
    },
    column() {
      return this.cColumn.children.column;
    },
    singleSearch() {
      return this.cColumn.children.column.filter((item) => item.search === true);
    },
  },
  watch: {
    visible(val) {
      if (!this.init && val) this.getList();
      if (this.init && val) this.changeDefaultChecked();
    },
    checkedValues(val) {
      if (this.checkType !== 'radio') {
        this.allChecked = val.length === this.list.length && this.list.length > 0;
      }
    },
  },
  methods: {
    toggleAll(val) {
      if (val) {
        this.checkedValues = this.list.map((item) => item.id);
        this.allChecked = true;
      } else {
        this.checkedValues = [];
        this.allChecked = false;
      }
    },
    handleClear() {
      this.$emit('onConfirm', '', '');
      this.handleClose();
    },
    handleClose() {
      this.selectionClear();
      this.visible = false;
    },
    selectionClear() {
      this.checkedValues = [];
      this.allChecked = false;
      this.radioValue = '';
    },
    handleConfirm() {
      if (this.checkType === 'radio') {
        if (!this.radioValue) {
          Toast({ message: '请至少选择一项' });
          return;
        }
        const selectData = this.list.find((u) => u.id === this.radioValue);
        if (selectData) this.$emit('onConfirm', selectData);
      } else {
        if (this.checkedValues.length === 0) {
          Toast({ message: '请至少选择一项' });
          return;
        }
        const selected = this.list.filter((item) => this.checkedValues.includes(item.id));
        this.$emit('onConfirm', selected);
      }
      this.handleClose();
    },
    changeDefaultChecked() {
      const defaultChecked = this.defaultChecked || '';
      if (this.checkType === 'radio') {
        this.radioValue = defaultChecked;
      } else {
        const checks = defaultChecked.split(',').filter((item) => !!item);
        this.checkedValues = this.list.filter((l) => checks.includes(l.id)).map((l) => l.id);
        this.allChecked = this.checkedValues.length === this.list.length && this.list.length > 0;
      }
    },
    getList(clear) {
      if (clear) {
        this.page = { current: 1, size: 10 };
      }
      const { current, size } = this.page;
      this.loadStatus = 'loading';
      this.$http
        .request({
          url: this.fnUrl,
          method: 'GET',
          params: {
            current,
            size,
            currentPage: current,
            pageSize: size,
            ...this.qparams,
            ...this.searchFormData,
            fnumber: this.searchFormData.fnumber
              ? encodeURIComponent(`%${this.searchFormData.fnumber}%`)
              : undefined,
            fname: this.searchFormData.fname
              ? encodeURIComponent(`%${this.searchFormData.fname}%`)
              : undefined,
          },
        })
        .then((res) => {
          const { records } = res.data ? res.data : res;
          const list = records || res.data || [];
          if (list.length < size) this.loadStatus = 'nomore';
          else this.loadStatus = 'loadmore';

          if (clear) this.list = list;
          else this.list = this.list.concat(list);

          this.page.current++;
          this.init = true;
          this.changeDefaultChecked();
        });
    },
  },
});
</script>

<style lang="scss" scoped>
.search-item {
  padding: 15px;
  border-bottom: 10px solid #f6f6f6;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;
  justify-content: space-between;

  .search-item-input {
    width: 48%;
  }

  .wid100 {
    width: 100% !important;
  }
}

.check-item {
  padding: 0 8px 60px;
  background-color: #f6f6f6;
  height: calc(100% - 122px);
  box-sizing: border-box;
  overflow-y: auto;
}

.item {
  width: 100%;
  background-color: #fff;
  border-radius: 5px;
  padding: 12px 15px;
  margin-bottom: 10px;
}

.item-column {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.item-column:last-child {
  margin-bottom: 0;
}

.real-name {
  color: #333;
  font-size: 15px;
  margin-right: 10px;
}

.dept-name {
  flex: 1;
  color: #a09fa5;
  font-size: 13px;
  text-align: right;
}

.load-more {
  text-align: center;
  padding: 10px 0;
  color: #999;
}

.foot-item {
  width: 100%;
  padding: 10px 15px;
  border-top: 1px solid #f6f6f6;
  position: absolute;
  bottom: 0;
  left: 0;
  box-sizing: border-box;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.foot-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>
