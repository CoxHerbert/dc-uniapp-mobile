<template>
  <div class="workflow-form-detail">
    <!-- 顶部导航栏 -->
    <van-nav-bar title="流程详情" left-arrow @click-left="handleBack" />
    <!-- 加一点左右间距，骨架屏和内容共用同一容器 -->
    <div v-if="waiting" class="detail">
      <van-skeleton :row="6" animate />
    </div>

    <div v-else class="detail">
      <!-- 头部：头像 + 标题 + 发起人 + 状态标签 -->
      <section class="detail-head flex-between flex-c">
        <div class="detail-head-info">
          <div class="detail-avatar" aria-hidden="true">{{ avatarText }}</div>
          <div class="flex-one c">
            <div class="leave bold txt-cut1">{{ process.processDefinitionName }}</div>
            <div class="name">{{ process.startUsername }}</div>
          </div>
        </div>
        <div class="detail-head-status">
          <van-tag v-if="process.status === 'todo'" type="success" size="small">审核中</van-tag>
          <van-tag v-else-if="process.status === 'delay'" type="danger" size="small"
            >已超时</van-tag
          >
          <template v-else-if="process.status === 'done'">
            <van-tag v-if="process.processIsFinished === 'unfinished'" type="success" size="small">
              审核中
            </van-tag>
            <van-tag
              v-else-if="process.processIsFinished === 'finished'"
              type="success"
              size="small"
            >
              已结束
            </van-tag>
            <van-tag
              v-else-if="process.processIsFinished === 'terminate'"
              type="danger"
              size="small"
            >
              已终止
            </van-tag>
            <van-tag
              v-else-if="process.processIsFinished === 'withdraw'"
              type="danger"
              size="small"
            >
              已撤销
            </van-tag>
            <van-tag v-else-if="process.processIsFinished === 'recall'" type="danger" size="small">
              已撤回
            </van-tag>
            <van-tag v-else-if="process.processIsFinished === 'reject'" type="danger" size="small">
              已驳回
            </van-tag>
            <van-tag v-else-if="process.processIsFinished === 'deleted'" type="danger" size="small">
              已删除
            </van-tag>
          </template>
        </div>
      </section>

      <!-- Tabs -->
      <section class="detail-tabs" aria-label="流程详情切换">
        <van-tabs v-model:active="current" :border="false">
          <van-tab
            v-for="(tab, index) in tabList"
            :key="tab.name"
            :title="tab.name"
            :name="index"
          />
        </van-tabs>
      </section>

      <!-- 内容 -->
      <div class="content">
        <div v-show="current === 0" class="detail-card card">
          <section
            v-if="
              option &&
              ((option.column && option.column.length > 0) ||
                (option.group && option.group.length > 0))
            "
            class="detail-section"
          >
            <wf-form ref="form" v-model="form" :option="option" />
          </section>
          <section v-if="process.status === 'todo'" class="detail-section">
            <wkf-exam-form
              ref="examineForm"
              v-model:comment="comment"
              :process="process"
              @user-select="handleUserSelect"
            />
          </section>
        </div>
        <section v-show="current === 1" class="flow-wrapper card">
          <wkf-flow :flow="flow" />
        </section>
        <section v-if="current === 2" class="card bpmn-wrapper">
          <WfBpmn :bpmn-option="h5bpmn" />
        </section>
      </div>

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
        @draft="handleDraft({ taskId: process.taskId, variables: form })"
        @examine="handleExamine"
        @user-select="handleUserSelect"
        @rollback="handleRollbackTask"
        @terminate="handleTerminateProcess"
        @withdraw="handleWithdrawTask"
      />
      <van-dialog
        v-model:show="saveDraftShow"
        show-cancel-button
        message="保存至草稿箱并关闭？"
        @confirm="handleDraftSubmit(process.taskId)"
      />
      <van-dialog
        v-model:show="recoverDraftShow"
        show-cancel-button
        message="是否恢复之前保存的草稿？"
        @confirm="handleRevocerDraftSubmit"
        @cancel="form = tempVariables"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { showToast } from 'vant';
import { Base64 } from '@/utils/base64.js';
import WkfFlow from '../../components/wf-flow/index.vue';
import WfBpmn from '../../components/wf-bpmn/index.vue';
import WkfUserSelect from '../../components/wf-user-select/index.vue';
import WkfButton from '../../components/wf-button/index.vue';
import WkfExamForm from '../../components/wf-exam-form/index.vue';
import exForm from '../../mixins/ex-form';
import draft from '../../mixins/draft';
import { useAuthStore } from '@/store/auth.js';

export default defineComponent({
  name: 'WorkflowFormDetailPage',
  components: { WkfFlow, WkfUserSelect, WkfButton, WkfExamForm, WfBpmn },
  mixins: [exForm, draft],
  data() {
    return {
      process: null,
      form: {},
      option: {},
      vars: [],
      submitLoading: false,
      current: 0,
      tabList: [{ name: '申请信息' }, { name: '流转信息' }, { name: '流转图' }],
      summaryOption: {},
      tempVariables: {},
      h5bpmn: {},
    };
  },
  computed: {
    avatarText() {
      const username = this.process?.startUsername || '';
      if (!username) return '';
      return username.substring(0, 1);
    },
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
    // 顶部返回：优先返回上一页，没有上一页则回到工作台（home）
    handleBack() {
      if (window.history.length > 1) {
        this.$router.back();
      } else {
        this.handleNavigateTo({
          name: 'WorkflowWorkbench',
          replace: true,
        });
      }
    },

    resolveRouteParams(query = {}) {
      const { p } = query;
      if (!p) return;
      try {
        const param = JSON.parse(Base64.decode(p));
        const { taskId, processInsId } = param;
        if (taskId && processInsId) {
          this.getDetail(taskId, processInsId);
        }
      } catch (error) {
        console.error('[workflow] 无法解析流程明细参数', error);
      }
    },
    // 获取任务详情
    getDetail(taskId, processInsId) {
      const authStore = useAuthStore();
      this.h5bpmn = {
        taskId: taskId,
        processInsId: processInsId,
        token: authStore.token,
      };
      this.getTaskDetail(taskId, processInsId).then((res) => {
        const { process, form, flow } = res;
        this.process = process;
        const { variables, status } = process;

        if (status === 'todo') {
          // 查询是否有草稿箱
          this.initDraft({ taskId })
            .then(() => {
              this.tempVariables = { ...variables };
              this.recoverDraftShow = true;
            })
            .catch(() => {
              this.form = variables;
            });
        } else {
          this.form = variables;
        }

        let { allForm, allAppForm, taskForm, formList } = form;
        if (formList && formList.length > 0) {
          const options = {
            menuBtn: false,
            detail: true,
            labelPosition: 'top',
            group: [],
          };

          formList.forEach((f) => {
            const { content, appContent, taskName, taskKey } = f;
            let resolved;

            try {
              resolved = this.handleResolveOption(eval('(' + content + ')'), taskForm, 'done');
            } catch (error) {
              try {
                resolved = this.handleResolveOption(JSON.parse(appContent), taskForm, 'done');
              } catch (parseError) {
                console.error('[workflow] 无法解析流程表单分组配置', error, parseError);
                return;
              }
            }

            const { option } = resolved;
            options.group.push({
              label: taskName || taskKey,
              column: option.column,
              collapse: allForm ? false : true,
            });
          });
          this.summaryOption = options;
        }
        if (allForm) {
          let resolved;

          try {
            resolved = this.handleResolveOption(eval('(' + allForm + ')'), taskForm, status);
          } catch (error) {
            try {
              resolved = this.handleResolveOption(JSON.parse(allAppForm), taskForm, status);
            } catch (parseError) {
              console.error('[workflow] 无法解析流程表单配置', error, parseError);
              this.waiting = false;
              return;
            }
          }

          const { option, vars } = resolved;
          option.menuBtn = false;
          for (const key in variables) {
            if (this.validateNull(variables[key])) delete variables[key];
          }
          // 如果是可行性评估
          if (process.processDefinitionKey === 'feasibilityAsessment') {
            option.column?.forEach((_, index) => {
              if (_.component === 'wf-feasibility') {
                option.column[index].columns = Array.isArray(
                  process.variables.feaEvaluationConclusion
                )
                  ? process.variables.feaEvaluationConclusion
                  : JSON.parse(process.variables.feaEvaluationConclusion);
              }
            });
          }
          this.option = {
            ...option,
            labelPosition: 'top',
          };
          this.vars = vars;
        }
        if (!this.option.column) this.option.column = [];
        if (process.variables && process.variables.serialNumber) {
          this.option.column.unshift({
            label: '流水号',
            prop: 'serialNumber',
            span: 24,
            detail: true,
          });
        }
        this.waiting = false;
      });
    },
    handleResolveOption(option, taskForm, status) {
      const { column, group } = option;
      let vars = [];
      if (status !== 'todo') {
        // 已办，删除字段默认值
        option.detail = true;
        if (column && column.length > 0) {
          column.forEach((col) => this.handleResolveEvent(col));
        }

        if (group && group.length > 0) {
          group.forEach((gro) => {
            if (gro.column && gro.column.length > 0) {
              gro.column.forEach((col) => this.handleResolveEvent(col));
            }
          });
        }
      } else {
        const columnFilter = this.filterAvueColumn(column, taskForm);
        const columnArr = columnFilter.column;
        vars = columnFilter.vars || [];

        const groupArr = [];
        if (group && group.length > 0) {
          // 处理group
          group.forEach((gro) => {
            const groupFilter = this.filterAvueColumn(gro.column, taskForm);
            gro.column = groupFilter.column;
            vars = vars.concat(groupFilter.vars);
            if (gro.column.length > 0) groupArr.push(gro);
          });
        }

        option.column = columnArr;
        option.group = groupArr;
      }
      return { option, vars };
    },
    handleResolveEvent(col) {
      const _this = this;
      delete col.value;
      const event = ['change', 'blur', 'click', 'focus'];
      event.forEach((e) => {
        if (col[e]) col[e] = eval((col[e] + '').replace(/this|proxy/g, '_this'));
      });
      if (col.event) {
        Object.keys(col.event).forEach((key) => {
          col.event[key] = eval((col.event[key] + '').replace(/this|proxy/g, '_this'));
        });
      }
      if (col.type === 'dynamic') {
        col.children.column.forEach((cc) => _this.handleResolveEvent(cc));
      }
    },
    // 审核
    handleExamine(pass) {
      this.submitLoading = true;
      const { form, summaryForm } = this.$refs;
      if (form) {
        this.$refs.form.validate((valid, done) => {
          if (valid) {
            const variables = {};
            this.vars.forEach((v) => {
              if (!this.validateNull(this.form[v])) {
                variables[v] = this.form[v];
                if (this.form[`$${v}`]) variables[`$${v}`] = this.form[`$${v}`];
              }
            });
            // 可行性评估提交处理
            if (this.process.processDefinitionKey === 'feasibilityAsessment') {
              variables.feaEvaluationConclusion = JSON.stringify(this.form.feaEvaluationConclusion);
            }

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
                if (typeof done === 'function') done();
                this.submitLoading = false;
              });
          } else {
            done();
            this.submitLoading = false;
          }
        });
      } else if (summaryForm) {
        this.handleCompleteTask(pass, {})
          .then(() => {
            showToast({ message: '处理成功', type: 'success' });
            setTimeout(() => {
              this.handleNavigateTo({
                name: 'WorkflowMine',
                query: { current: '0' },
                replace: true,
              });
            }, 1000);
          })
          .catch(() => {
            this.submitLoading = false;
          });
      } else {
        showToast({ message: '找不到需要提交的表单', type: 'fail' });
      }
    },
  },
});
</script>

<style lang="scss" scoped>
page {
  background: #f6f6f6;
}

.workflow-form-detail {
  min-height: 100vh;
  background: #f6f6f6;
}

/* 页面主体间距 */
.detail {
  box-sizing: border-box;

  .content {
    padding-bottom: 8px;
  }

  /* 头像 + 标题 + 发起人 + 状态标签 */
  &-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 15px;
    margin-bottom: 4px;
    background-color: #fff;
    border-bottom: 1px solid #f2f3f5;
  }

  .detail-head-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  .detail-head-status {
    flex-shrink: 0;
  }

  .c {
    flex: 1;
    min-width: 0;

    .leave {
      color: #1f2b4a;
      font-size: 17px;
      line-height: 1.4;
    }

    .name {
      margin-top: 4px;
      color: #7a8499;
      font-size: 14px;
    }
  }

  /* Tabs 区域，使用 Vant 默认主色 */
  &-tabs {
    margin-bottom: 12px;
    background-color: #fff;

    :deep(.van-tabs__wrap) {
      border-bottom: 1px solid #f2f3f5;
    }

    :deep(.van-tab__text) {
      font-size: 14px;
    }
  }
}

.card {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(31, 43, 74, 0.08);
  margin-bottom: 12px;
  padding: 15px;
}

.detail-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fab022 0%, #ffcd4e 100%);
  color: #fff;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 2px;
}

.detail-card {
  padding: 0;
  overflow: hidden;
}

.detail-section {
  & + .detail-section {
    border-top: 1px solid #f2f3f5;
  }
}

.flow-wrapper {
  padding: 12px;
}

.bpmn-wrapper {
  padding: 0;

  :deep(canvas),
  :deep(svg) {
    border-radius: 0 0 12px 12px;
  }
}
</style>
