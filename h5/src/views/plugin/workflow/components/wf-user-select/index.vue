<template>
  <div class="wf-user-select">
    <van-popup v-model:show="visible" position="bottom" :style="{ height: '90%' }" round>
      <!-- 搜索区域 -->
      <div class="search-item">
        <van-search
          v-model="searchValue"
          placeholder="请输入姓名"
          shape="square"
          clearable
          background="#f6f6f6"
          @search="getList(true)"
          @clear="getList(true)"
        />
      </div>

      <!-- 列表区域 -->
      <div class="check-item">
        <template v-if="checkType === 'radio'">
          <van-radio-group v-model="radioValue" direction="vertical">
            <van-radio
              v-for="item in list"
              :key="item.id"
              :name="item.id"
              :disabled="item.disabled"
            >
              <div class="user-item">
                <div class="user-item__main">
                  <div class="avatar-placeholder">
                    <span class="avatar-text">
                      {{ (item.realName && item.realName[0]) || '用' }}
                    </span>
                  </div>
                  <div class="user-item__info">
                    <div class="real-name">{{ item.realName }}</div>
                    <div v-if="item.deptName" class="dept-name">{{ item.deptName }}</div>
                  </div>
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
              <div class="user-item">
                <div class="user-item__main">
                  <div class="avatar-placeholder">
                    <span class="avatar-text">
                      {{ (item.realName && item.realName[0]) || '用' }}
                    </span>
                  </div>
                  <div class="user-item__info">
                    <div class="real-name">{{ item.realName }}</div>
                    <div v-if="item.deptName" class="dept-name">{{ item.deptName }}</div>
                  </div>
                </div>
              </div>
            </van-checkbox>
          </van-checkbox-group>
        </template>

        <!-- 空态 -->
        <div v-if="!list.length && loadStatus === 'nomore'" class="empty-wrap">
          <div class="empty-icon"></div>
          <div class="empty-text">暂无数据</div>
        </div>

        <!-- 加载更多 -->
        <div v-if="list.length" class="load-more-wrap">
          <div v-if="loadStatus !== 'nomore'" class="load-more" @click="getList()">
            <span v-if="loadStatus === 'loadmore'">点击加载更多</span>
            <van-loading v-else size="20" />
          </div>
          <div v-else class="load-more load-more--nomore">没有更多了</div>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="foot-item" :class="checkType === 'radio' ? 'flex-evenly' : 'flex-between'">
        <van-checkbox
          v-if="checkType !== 'radio'"
          :model-value="allChecked"
          @update:model-value="toggleAll"
        >
          全选
        </van-checkbox>
        <div class="foot-actions">
          <van-button size="small" class="btn-ghost" @click="handleClose"> 关闭 </van-button>
          <van-button size="small" type="danger" plain @click="handleClear"> 清空 </van-button>
          <van-button size="small" type="primary" @click="handleConfirm"> 确定 </van-button>
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
    defaultChecked: String,
    userUrl: {
      type: String,
      default: '/blade-system/search/user',
    },
    customOption: Object,
    checkType: {
      type: String,
      default: 'radio',
    },
  },
  data() {
    return {
      radioValue: '',
      visible: false,
      allChecked: false,
      searchValue: '',
      checkedValues: [],
      page: {
        size: 10,
        current: 1,
      },
      list: [],
      init: false,
      loadStatus: 'loadmore', // loadmore | loading | nomore
    };
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
        const user = this.list.find((u) => u.id === this.radioValue);
        if (user) this.$emit('onConfirm', user.id, user.realName);
      } else {
        if (this.checkedValues.length === 0) {
          Toast({ message: '请至少选择一项' });
          return;
        }
        const checkList = this.list.filter((item) => this.checkedValues.includes(item.id));
        const ids = checkList.map((c) => c.id);
        const names = checkList.map((c) => c.realName);
        this.$emit('onConfirm', ids.join(','), names.join(','));
      }
      this.handleClose();
    },
    changeDefaultChecked() {
      let defaultChecked = this.defaultChecked || '';
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
          url: this.userUrl,
          method: 'GET',
          params: {
            current,
            size,
            ...this.customOption,
            name: this.searchValue,
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
.wf-user-select {
  height: 100%;
}

/* 顶部搜索区域 */
.search-item {
  padding: 12px 15px 8px;
  background: #ffffff;
  border-bottom: 1px solid #f3f3f3;
  box-sizing: border-box;

  :deep(.van-search) {
    border-radius: 8px;
  }
}

/* 列表区域 */
.check-item {
  padding: 8px 12px 70px;
  background-color: #f5f6fa;
  height: calc(100% - 110px);
  box-sizing: border-box;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;

  :deep(.van-radio),
  :deep(.van-checkbox) {
    padding: 0;
    margin-bottom: 8px;
  }

  :deep(.van-radio__icon),
  :deep(.van-checkbox__icon) {
    margin-right: 8px;
  }

  :deep(.van-radio__label),
  :deep(.van-checkbox__label) {
    width: 100%;
  }
}

/* 用户卡片 */
.user-item {
  width: 100%;
  background-color: #ffffff;
  padding: 12px 15px;
  border-radius: 8px;
  box-sizing: border-box;
  box-shadow: 0 4px 10px rgba(15, 35, 95, 0.04);
  display: flex;
  flex-direction: column;
}

.user-item__main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4c8dff, #66b1ff);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-text {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
}

.user-item__info {
  flex: 1;
  min-width: 0;
}

.real-name {
  color: #222222;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 3px;
}

.dept-name {
  color: #a0a3b5;
  font-size: 12px;
  line-height: 1.4;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

/* 空态 */
.empty-wrap {
  padding-top: 40px;
  text-align: center;
  color: #a0a3b5;
  font-size: 13px;
}

.empty-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 12px;
  border-radius: 50%;
  border: 1px dashed #d5d8e6;
  box-sizing: border-box;
}

.empty-text {
  color: #a0a3b5;
}

/* 加载更多 */
.load-more-wrap {
  padding-bottom: 10px;
}

.load-more {
  text-align: center;
  padding: 10px 0;
  color: #999;
  font-size: 12px;
}

.load-more--nomore {
  color: #c0c4d6;
}

/* 底部操作栏 */
.foot-item {
  width: 100%;
  padding: 10px 15px calc(10px + env(safe-area-inset-bottom));
  border-top: 1px solid #f1f1f1;
  position: absolute;
  bottom: 0;
  left: 0;
  box-sizing: border-box;
  background: #ffffff;
  display: flex;
  align-items: center;
  z-index: 10;
  box-shadow: 0 -3px 9px rgba(37, 45, 72, 0.08);

  :deep(.van-checkbox) {
    font-size: 13px;
    color: #555;
  }
}

.flex-between {
  justify-content: space-between;
}

.flex-evenly {
  justify-content: space-evenly;
}

.foot-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* 轻一点的关闭按钮 */
.btn-ghost {
  border-color: #dcdfe6;
  color: #606266;
}
</style>
