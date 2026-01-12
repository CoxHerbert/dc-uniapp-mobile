<template>
  <div>
    <!-- 待办状态 -->
    <div v-if="process.status === 'todo'" class="wf-button wf-button--todo safe-area-inset-bottom">
      <div class="wf-button-left">
        <van-button
          v-if="getButton('wf_pass')"
          size="small"
          :loading="loading"
          type="primary"
          @click="$emit('examine', true)"
        >
          <span v-if="['recall', 'reject'].includes(process.processIsFinished)">重新提交</span>
          <span v-else>{{ getButton('wf_pass').name }}</span>
        </van-button>
        <van-button
          v-if="getButton('wf_reject')"
          size="small"
          :loading="loading"
          type="danger"
          @click="$emit('examine', false)"
        >
          <span v-if="nodeList.length > 1">{{ getButton('wf_reject').name }}</span>
          <span v-else>取消申请</span>
        </van-button>
      </div>

      <div v-if="buttonList.length > 2" class="wf-button-right">
        <wf-popover
          :show="moreBtnShow"
          position="absolute"
          direction="bottom"
          width="200px"
          right="30px"
          top="-20px"
          translate-y="-100%"
          triangle-right="100px"
          triangle-bottom="-22px"
          background-color="#eee"
          @close="moreBtnShow = false"
        >
          <div class="menu-item" @click="handleOperate('draft')">暂存</div>
          <div v-if="getButton('wf_transfer')" class="menu-item" @click="handleOperate('transfer')">
            {{ getButton('wf_transfer').name }}
          </div>
          <div v-if="getButton('wf_delegate')" class="menu-item" @click="handleOperate('delegate')">
            {{ getButton('wf_delegate').name }}
          </div>
          <div v-if="getButton('wf_rollback')" class="menu-item" @click="handleRollback">
            {{ getButton('wf_rollback').name }}
          </div>
          <div v-if="getButton('wf_terminate')" class="menu-item" @click="modalShow = true">
            {{ getButton('wf_terminate').name }}
          </div>
          <div
            v-if="process.isMultiInstance && getButton('wf_add_instance')"
            class="menu-item"
            @click="handleOperate('addInstance')"
          >
            {{ getButton('wf_add_instance').name }}
          </div>
        </wf-popover>

        <van-button
          class="wf-button__more"
          size="small"
          :loading="loading"
          type="default"
          @click="moreBtnShow = !moreBtnShow"
        >
          更多操作
        </van-button>
      </div>
    </div>

    <!-- 已办状态，可撤回 / 撤销 -->
    <div
      v-if="process.status === 'done' && process.isOwner && process.isReturnable"
      class="wf-button wf-button--done safe-area-inset-bottom"
    >
      <div class="wf-button-center">
        <van-button
          v-if="process.isOwner && process.isReturnable"
          size="small"
          :loading="loading"
          type="warning"
          @click="handleWithdraw('start')"
        >
          撤回
        </van-button>
        <van-button
          v-if="process.isOwner && process.isReturnable"
          size="small"
          :loading="loading"
          type="danger"
          @click="handleWithdraw('end')"
        >
          撤销
        </van-button>
      </div>
    </div>

    <!-- 占位，避免内容被底部按钮遮挡 -->
    <div style="height: 110px"></div>

    <van-action-sheet
      v-model:show="actionSheetVisible"
      :actions="nodeList"
      cancel-text="取消"
      description="选择要退回到的节点"
      close-on-click-action
      @select="handleNodeSelect"
    />
    <van-dialog
      v-model:show="modalShow"
      show-cancel-button
      title="警告"
      message="确定要终止此流程吗？"
      @confirm="handleTerminate"
    />
    <van-dialog
      v-model:show="withdrawModalShow"
      show-cancel-button
      title="警告"
      :message="withdrawContent"
      @confirm="$emit('withdraw', withdrawType)"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { Toast } from 'vant';
import { getBackNodes } from '../../api/task.js';

export default defineComponent({
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
    buttonList: {
      type: Array,
      default: () => [],
    },
    process: {
      type: Object,
      default: () => ({}),
    },
    comment: String,
  },
  data() {
    return {
      moreBtnShow: false,
      actionSheetVisible: false,
      nodeList: [],
      modalShow: false,
      withdrawModalShow: false,
      withdrawContent: '',
      withdrawType: '',
    };
  },
  watch: {
    'process.taskId': {
      handler(val) {
        if (val) {
          getBackNodes({ taskId: val }).then((res) => {
            this.nodeList = (res.data || []).map((d) => ({ name: d.nodeName, nodeId: d.nodeId }));
          });
        }
      },
      immediate: true,
    },
  },
  methods: {
    getButton(type) {
      return this.buttonList.find((btn) => btn.buttonKey === type);
    },
    handleRollback() {
      if (!this.comment) {
        Toast({ message: '请填写批复意见', type: 'fail' });
        return;
      }
      this.moreBtnShow = false;
      if (this.nodeList.length === 0) {
        Toast({ message: '查询不到可退回的节点', type: 'fail' });
      } else {
        this.actionSheetVisible = true;
      }
    },
    handleNodeSelect(action) {
      this.moreBtnShow = false;
      if (action && action.nodeId) {
        this.$emit('rollback', action.nodeId);
      }
    },
    handleOperate(type) {
      this.moreBtnShow = false;
      switch (type) {
        case 'transfer':
          this.$emit('transfer');
          break;
        case 'delegate':
          this.$emit('delegate');
          break;
        case 'addInstance':
          this.$emit('add-instance');
          break;
        case 'draft':
          this.$emit('draft');
          break;
        default:
          break;
      }
    },
    handleTerminate() {
      this.$emit('terminate');
    },
    handleWithdraw(type) {
      this.withdrawType = type;
      this.withdrawContent = type === 'start' ? '确定要撤回此流程吗？' : '确定要撤销此流程吗？';
      this.withdrawModalShow = true;
    },
  },
});
</script>

<style lang="scss" scoped>
.wf-button {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9;
  display: flex;
  align-items: center;
  padding: 10px;
  background: #fff;
  box-shadow: 0 -6px 20px rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
  gap: 10px;

  &--todo {
    justify-content: space-between;
  }

  &--done {
    justify-content: center;
  }
}

.wf-button-left,
.wf-button-right,
.wf-button-center {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 左侧 / 中间区域占据剩余空间，按钮宽度由 flex 决定 */
.wf-button-left,
.wf-button-center {
  flex: 1;
}

/* 右侧“更多操作”区域根据内容自适应宽度 */
.wf-button-right {
  flex-shrink: 0;
  justify-content: flex-end;
}

/* 底部区域内统一按钮风格（仅作用于本组件） */
/* 不再写死宽度，交给 flex 和 padding 自适应 */
.wf-button :deep(.van-button) {
  height: 36px;
  padding: 0 16px;
  border-radius: 999px;
  font-size: 13px;
  flex: 0 0 auto;
}

/* 左侧 / 中间的按钮平分可用空间 */
.wf-button-left :deep(.van-button),
.wf-button-center :deep(.van-button) {
  flex: 1 1 0;
}

/* 右侧按钮根据文字自适应宽度 */
.wf-button-right :deep(.van-button) {
  flex: 0 0 auto;
}

/* “更多操作”按钮不再设置 min-width，完全自适应 */
.wf-button__more {
  /* 空着即可，保留类名方便以后扩展 */
}

/* 主题色可以按你全局规范调 */
.wf-button :deep(.van-button--primary) {
  background: linear-gradient(90deg, #3060ed, #4c8dff);
  border-color: #3060ed;
}

.wf-button :deep(.van-button--default) {
  color: #333;
  border-color: #dddddd;
}

.wf-button :deep(.van-button--danger) {
  background: #ff4d4f;
  border-color: #ff4d4f;
}

.wf-button :deep(.van-button--warning) {
  background: #faad14;
  border-color: #faad14;
}

.menu-item {
  padding: 12px 16px;
  font-size: 13px;
  color: #222;
}

.menu-item + .menu-item {
  border-top: 1px solid #eee;
}
</style>
