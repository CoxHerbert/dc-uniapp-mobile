<template>
  <div class="wf-flow">
    <van-steps
      v-if="displayFlow.length"
      direction="vertical"
      :active="activeIndex"
      active-color="#1989fa"
      inactive-color="#969799"
    >
      <van-step v-for="(item, index) in displayFlow" :key="index" class="wf-flow-item">
        <div class="time">
          {{ item.endTime || item.createTime }}
        </div>

        <div class="desc">
          <div class="desc-item">
            {{ item.assigneeName }} 在 [{{ item.createTime }}] 开始处理 [{{
              item.historyActivityType === 'endEvent'
                ? '结束'
                : item.historyActivityName || '未命名'
            }}] 环节
          </div>

          <div v-if="item.historyActivityDurationTime" class="desc-item">
            任务历时 [{{ item.historyActivityDurationTime }}]
          </div>

          <!-- 审批意见（按原逻辑：默认只展示第一条，其余点击“展开/收起”） -->
          <template v-if="item.comments && getAddComments(item).length">
            <div v-for="(comment, cIndex) in getAddComments(item)" :key="cIndex" class="desc-item">
              <!-- 第一条永远展示 -->
              <template v-if="cIndex < 1">
                <span v-if="commentMap[comment.type]">
                  {{ commentMap[comment.type] }}: [{{ comment.fullMessage }}]
                </span>
                <span v-if="getAddComments(item).length > 1" class="toggle" @click="handleClick">
                  {{ toggleText }}
                  <van-icon :name="isFlag ? 'arrow-up' : 'arrow-down'" color="#1989fa" size="14" />
                </span>
                <div v-if="comment.time" class="comment-time">
                  {{ comment.time }}
                </div>
              </template>

              <!-- 其余条仅在展开时展示（保持原组件全局展开/收起的行为） -->
              <template v-else-if="isFlag">
                <span v-if="commentMap[comment.type]">
                  {{ commentMap[comment.type] }}: [{{ comment.fullMessage }}]
                </span>
                <div v-if="comment.time" class="comment-time">
                  {{ comment.time }}
                </div>
              </template>
            </div>
          </template>

          <!-- 附件 -->
          <template v-if="item.attachments && item.attachments.length > 0">
            <div class="attachment-row">
              <span class="attachment-label">附件:</span>
              <div class="attachment-list">
                <div
                  v-for="(attachment, cIndex) in item.attachments"
                  :key="cIndex"
                  class="attachment-item"
                >
                  <span class="attachment-link" @click="handleAttachments(attachment)">
                    {{ attachment.name }}
                  </span>
                </div>
              </div>
            </div>
          </template>

          <div v-if="item.endTime" class="desc-item">结束时间: [{{ item.endTime }}]</div>
        </div>
      </van-step>
    </van-steps>

    <div v-else class="wf-flow-empty">暂无流程记录</div>
  </div>
</template>

<script>
import { Toast, Steps, Step } from 'vant';

export default {
  name: 'WfFlow',
  components: {
    [Steps.name]: Steps,
    [Step.name]: Step,
  },
  props: {
    flow: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      // 全局展开/收起（保持原逻辑）
      isFlag: false,
      toggleText: '展开',
      commentMap: {
        assigneeComment: '变更审核人',
        dispatchComment: '调度意见',
        transferComment: '转办意见',
        delegateComment: '委托意见',
        rollbackComment: '驳回意见',
        terminateComment: '终止意见',
        addMultiInstanceComment: '加签',
        deleteMultiInstanceComment: '减签',
        withdrawComment: '撤销',
        recallComment: '撤回',
        comment: '审批意见',
      },
    };
  },
  computed: {
    // 只保留真实节点，过滤 candidate / sequenceFlow
    displayFlow() {
      return (this.flow || []).filter(
        (item) => !['candidate', 'sequenceFlow'].includes(item.historyActivityType)
      );
    },
    // 当前高亮步骤：最后一个
    activeIndex() {
      return this.displayFlow.length ? this.displayFlow.length - 1 : 0;
    },
  },
  methods: {
    handleClick() {
      this.isFlag = !this.isFlag;
      this.toggleText = this.isFlag ? '收起' : '展开';
    },
    getAddComments(item) {
      if (!item || !item.comments) return [];
      return item.comments.filter((c) => c.action === 'AddComment');
    },
    handleAttachments(item) {
      const { url } = item || {};
      if (!url) return;

      const suffix = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
      const imageList = ['jpg', 'png', 'jpeg', 'gif', 'webp', 'bmp'];
      const documentList = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf'];

      if (imageList.includes(suffix) || documentList.includes(suffix)) {
        window.open(url, '_blank');
      } else {
        Toast({
          message: `当前类型 ${suffix} 不支持在移动端展示`,
        });
      }
    },
  },
};
</script>

<style>
page {
  background: #f6f6f6;
}
</style>

<style lang="scss" scoped>
.wf-flow {
  padding: 16px 12px;

  ::v-deep(.van-steps) {
    background: transparent;
  }
}

.wf-flow-item {
  align-items: flex-start;
}

.time {
  color: #222;
  padding: 0 0 5px;
  border-bottom: 1px dashed #ebeef5;
  font-size: 12px;
}

.desc {
  padding: 10px 0;

  &-item {
    margin-bottom: 5px;
    line-height: 25px;
    font-size: 14px;
  }
}

.toggle {
  color: #1989fa;
  float: right;
  display: inline-flex;
  align-items: center;
}

.comment-time {
  color: gray;
  font-size: 12px;
}

.attachment-row {
  display: flex;
  align-items: baseline;
}

.attachment-label {
  margin-right: 5px;
}

.attachment-list {
  width: 80%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-item {
  margin-bottom: 8px;
}

.attachment-link {
  color: rgb(41, 121, 255);
}

.wf-flow-empty {
  padding: 24px 12px;
  text-align: center;
  color: #969799;
  font-size: 14px;
}
</style>
