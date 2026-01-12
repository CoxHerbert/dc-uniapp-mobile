<template>
  <div class="detail">
    <!-- 头部 -->
    <div class="detail-head flex-between flex-c">
      <div class="detail-avatar">{{ getAvatarText(process.startUsername) }}</div>
      <div class="flex-one c">
        <div class="leave bold">{{ process.processDefinitionName }}</div>
        <div class="name">{{ process.startUsername }}</div>
      </div>
      <van-tag v-if="process.status === 'todo'" type="success" size="small">审核中</van-tag>
      <van-tag v-else-if="process.status === 'delay'" type="danger" size="small">已超时</van-tag>
      <template v-else-if="process.status === 'done'">
        <van-tag v-if="process.processIsFinished === 'unfinished'" type="success" size="small"
          >审核中</van-tag
        >
        <van-tag v-else-if="process.processIsFinished === 'finished'" type="success" size="small"
          >已结束</van-tag
        >
        <van-tag v-else-if="process.processIsFinished === 'terminate'" type="danger" size="small"
          >已终止</van-tag
        >
        <van-tag v-else-if="process.processIsFinished === 'withdraw'" type="danger" size="small"
          >已撤销</van-tag
        >
        <van-tag v-else-if="process.processIsFinished === 'recall'" type="danger" size="small"
          >已撤回</van-tag
        >
        <van-tag v-else-if="process.processIsFinished === 'reject'" type="danger" size="small"
          >已驳回</van-tag
        >
      </template>
    </div>
    <!-- tab -->
    <van-tabs v-model:active="current" :border="false">
      <van-tab
        v-for="(tab, index) in tabList"
        :key="tab.name"
        :name="String(index)"
        :title="tab.name"
      />
    </van-tabs>
    <!-- 内容 -->
    <div class="content">
      <div v-show="current === '0'" class="detail-card">
        <div class="split-line">
          <wf-form v-if="init" ref="form" v-model="form" :option="option" @submit="handleSubmit" />
        </div>
        <div v-if="process.status === 'todo'" class="split-line">
          <wkf-exam-form
            ref="examineForm"
            v-model:comment="comment"
            :process="process"
            @user-select="handleUserSelect"
          />
        </div>
      </div>
      <div v-show="current === '1'" class="flow-wrapper">
        <wkf-flow :flow="flow" />
      </div>
    </div>
    <!-- 选人 -->
    <wkf-user-select
      ref="user-select"
      :check-type="checkType"
      :default-checked="defaultChecked"
      @on-confirm="handleUserSelectConfirm"
    />
    <wkf-button
      :loading="submitLoading"
      :button-list="buttonList"
      :process="process"
      :comment="comment"
      @examine="handleExamine"
      @user-select="handleUserSelect"
      @rollback="handleRollbackTask"
      @terminate="handleTerminateProcess"
      @withdraw="handleWithdrawTask"
    />
  </div>
</template>
<script>
import { defineComponent } from 'vue';
import { showToast } from 'vant';
import { Base64 } from '@/utils/base64.js';
import WkfFlow from '../../../components/wf-flow/index.vue';
import WkfUserSelect from '../../../components/wf-user-select/index.vue';
import WkfButton from '../../../components/wf-button/index.vue';
import WkfExamForm from '../../../components/wf-exam-form/index.vue';
import exForm from '../../../mixins/ex-form';

export default defineComponent({
  name: 'WorkflowLeaveDetailPage',
  components: { WkfFlow, WkfUserSelect, WkfButton, WkfExamForm },
  mixins: [exForm],
  data() {
    return {
      init: false,
      form: {},
      option: {
        labelPosition: 'top',
        menuBtn: false,
        column: [
          {
            label: '请假时间',
            prop: 'datetime',
            type: 'datetimerange',
            format: 'yyyy-MM-dd HH:mm:ss',
            valueFormat: 'yyyy-MM-dd HH:mm:ss',
            rules: [{ required: true, message: '请选择请假时间' }],
          },
          {
            label: '请假天数',
            prop: 'days',
            type: 'number',
            rules: [{ required: true, message: '请输入请假天数' }],
          },
          {
            label: '请假理由',
            prop: 'reason',
            type: 'textarea',
            span: 24,
            rules: [{ required: true, message: '请输入请假理由' }],
          },
        ],
      },
      vars: [],
      submitLoading: false,
      current: '0',
      tabList: [{ name: '申请信息' }, { name: '流转信息' }],
    };
  },
  watch: {
    '$route.query.p'(value) {
      this.resolveRouteParams({ p: value });
    },
  },
  created() {
    this.resolveRouteParams(this.$route.query);
  },
  methods: {
    getAvatarText(name = '') {
      if (!name) return '';
      return name.length <= 2 ? name : name.slice(-2);
    },
    resolveRouteParams(query = {}) {
      const { p } = query;
      if (!p) return;
      try {
        const param = JSON.parse(Base64.decode(p));
        const { taskId, processInsId } = param;
        if (taskId && processInsId) this.getDetail(taskId, processInsId);
      } catch (error) {
        console.error('[workflow] 无法解析请假明细参数', error);
      }
    },
    // 获取任务详情
    getDetail(taskId, processInsId) {
      this.getTaskDetail(taskId, processInsId).then((res) => {
        const { process, form } = res;
        const { variables, status } = process;

        this.form = variables;

        const { taskForm } = form;
        const { option, vars } = this.handleResolveOption(this.option, taskForm, status, process);
        this.option = option;
        this.vars = vars;

        setTimeout(() => {
          this.init = true;
        }, 100);
      });
    },
    handleResolveOption(option, taskForm, status, process = {}) {
      const { column, group } = option;
      let vars = [];
      if (status !== 'todo') {
        // 已办，删除字段默认值
        const events = ['change', 'blur', 'click', 'focus'];
        option.detail = true;
        if (column && column.length > 0) {
          column.forEach((col) => {
            if (col.type === 'dynamic') {
              col.children.column.forEach((childCol) => {
                delete childCol.value;
                delete childCol.event;
                events.forEach((evt) => delete childCol[evt]);
              });
            } else {
              delete col.value;
              delete col.event;
              events.forEach((evt) => delete col[evt]);
            }
          });
        }

        if (group && group.length > 0) {
          group.forEach((gro) => {
            if (gro.column && gro.column.length > 0) {
              gro.column.forEach((col) => {
                if (col.type === 'dynamic') {
                  col.children.column.forEach((childCol) => {
                    delete childCol.value;
                    delete childCol.event;
                    events.forEach((evt) => delete childCol[evt]);
                  });
                } else {
                  delete col.value;
                  delete col.event;
                  events.forEach((evt) => delete col[evt]);
                }
              });
            }
          });
        }
      } else {
        const columnFilter = this.filterAvueColumn(column, taskForm);
        const columnArr = columnFilter.column;
        vars = columnFilter.vars || [];

        const groupArr = [];
        if (group && group.length > 0) {
          group.forEach((gro) => {
            const groupFilter = this.filterAvueColumn(gro.column, taskForm);
            gro.column = groupFilter.column;
            vars = vars.concat(groupFilter.vars || []);
            if (gro.column.length > 0) groupArr.push(gro);
          });
        }

        if (process.variables && process.variables.serialNumber) {
          columnArr.unshift({
            label: '流水号',
            prop: 'serialNumber',
            span: 24,
            detail: true,
          });
        }
        option.column = columnArr;
        option.group = groupArr;
        option.labelPosition = 'top';
      }
      return { option, vars };
    },
    // 审核
    handleExamine(pass) {
      this.submitLoading = true;
      this.$refs.form.validate((valid, done) => {
        if (valid) {
          const variables = {};
          this.vars.forEach((v) => {
            if (v !== 'comment' && this.form[v]) variables[v] = this.form[v];
          });

          this.handleCompleteTask(pass, variables)
            .then(() => {
              showToast({ message: '处理成功', type: 'success' });
              setTimeout(() => {
                this.handleNavigateTo({
                  name: 'WorkflowMine',
                  query: { current: '0' },
                  replace: true,
                });
                done();
              }, 1000);
            })
            .catch(() => {
              done();
              this.submitLoading = false;
            });
        } else {
          done();
          this.submitLoading = false;
        }
      });
    },
  },
});
</script>
<style lang="scss" scoped>
.detail {
  background: #f6f6f6;
  min-height: 100%;

  &-head {
    background: #fff;
    padding: 20px;

    .c {
      margin: 0 16px;

      .leave {
        color: #333;
        font-size: 22px;
      }

      .name {
        color: #666;
        font-size: 18px;
      }
    }
  }
}

.detail-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #fab022;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  font-size: 18px;
}

.split-line {
  border-bottom: 20px solid #f6f6f6;
  min-height: 45px;
  background: #fff;
}

.detail-card {
  background: #f6f6f6;
  margin: 16px 0;
  border-radius: 12px;
  overflow: hidden;
}

.flow-wrapper {
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  margin: 16px 0;
}

.content {
  padding: 0 0 20px;
}
</style>
