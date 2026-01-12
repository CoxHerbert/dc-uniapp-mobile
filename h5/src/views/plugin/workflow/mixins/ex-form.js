import {
  getFormByProcessDefId,
  startProcess,
  detail,
  completeTask,
  transferTask,
  delegateTask,
  rollbackTask,
  terminateProcess,
  addMultiInstance,
  withdrawTask,
} from '../api/task.js';
import { showToast } from 'vant';
import { Base64 } from '@/utils/base64.js';
import { useWorkflowStore } from '@/store/workflow.js';

import defaultValues from './default-values.js';
export default {
  mixins: [defaultValues],
  data() {
    return {
      process: {}, // 流程定义/流程实例信息
      buttonList: [], // 配置按钮信息
      flow: [], // 流转信息
      userSelectType: '', // 人员选择类型 transfer转办 delegate委托 copy抄送 assignee审核人
      checkType: 'radio', // 人员选择check类型 radio单选 checkbox多选
      comment: '', // 评论
      bpmnOption: {}, // 流程图配置信息
      defaultChecked: '', // 人员选择默认选中
      waiting: true, // 骨架屏加载中
    };
  },
  methods: {
    // 动态路由跳转
    dynamicRoute(row, type, async = false) {
      const { id, taskId, processInstanceId, processId, formKey, appFormUrl } = row;
      const param = Base64.encode(
        JSON.stringify({
          processId: id,
          taskId,
          processInsId: processInstanceId || processId,
        })
      );

      let target;
      if (formKey && formKey.startsWith('wf_ex_')) {
        const formName = formKey.substring(6);
        if (appFormUrl) {
          const separator = appFormUrl.includes('?') ? '&' : '?';
          target = `${appFormUrl}${separator}p=${param}`;
        } else {
          const name = `WorkflowExternal${formName}${type === 'start' ? 'Start' : 'Detail'}`;
          target = { name, query: { p: param } };
        }
      } else {
        const name = type === 'start' ? 'WorkflowFormStart' : 'WorkflowFormDetail';
        target = { name, query: { p: param } };
      }

      if (async) {
        return Promise.resolve({ row, type, param, target });
      }

      if (typeof target === 'string') {
        return this.$router.push(target);
      }

      const { replace = false, ...location } = target;
      const navigation = replace ? this.$router.replace : this.$router.push;
      return navigation.call(this.$router, location);
    },
    // 根据可读可写，过滤avue column
    filterAvueColumn(column, taskForm, props = { label: 'label', prop: 'prop' }) {
      const _this = this;

      if (!column || column.length == 0)
        return {
          column,
          vars: [],
        };

      const values = [];
      const vars = [];
      column.forEach((col) => {
        let c = taskForm.find((s) => s.id == col[props.prop]);
        if (c && c.readable) {
          // /**
          //  * @deprecated 与节点配置可读可写冲突
          //  */
          // if (!c) { // 未重新点击节点设计表单字段可读可写。
          // 	if ((this.process.isOwner && this.process.status == 'todo') || !this.process.hasOwnProperty('isOwner')) c = { readable: true, writable: true }
          // 	else c = { readable: true, writable: false }
          // }

          // #ifdef H5 || APP
          let event = ['change', 'blur', 'click', 'focus'];
          // 处理事件
          event.forEach((e) => {
            if (col[e]) col[e] = eval((col[e] + '').replace(/this|proxy/g, '_this'));
          });
          if (col.event)
            Object.keys(col.event).forEach(
              (key) =>
                (col.event[key] = eval((col.event[key] + '').replace(/this|proxy/g, '_this')))
            );
          // #endif

          if (c.writable) {
            // 可写，记录需要提交的字段、处理字段默认值
            vars.push(col[props.prop]);
            if (col.value) col.value = _this.getDefaultValues(col.value);
          } else {
            // 不可写，清除校验、默认值、事件
            if (col.type == 'dynamic') {
              col.children.addBtn = false;
              col.children.delBtn = false;
            } else {
              col.readonly = true;
              col.disabled = true;
            }
            delete col.rules;
            delete col.value;
          }
          if (col.type == 'dynamic') {
            // 处理子表单
            col.children.column = _this.filterAvueColumn(col.children.column, taskForm).column;
          }
          if (col.rules && col.pattern) {
            // 处理正则
            col.rules.forEach((c) => {
              if (c.pattern) c.pattern = new RegExp(col.pattern);
            });
          }
          values.push(col);
        }
      });
      return {
        column: values,
        vars,
      };
    },
    /**
     * 获取流程发起表单
     * @param processDefId 流程定义id
     * @returns Promise({"process": "流程定义信息", "startForm": "开始节点表单"})
     */
    getStartForm(processDefId) {
      return new Promise((resolve, reject) => {
        getFormByProcessDefId({ processDefId })
          .then((res) => {
            const { process } = res.data;
            process.hideComment = true;
            this.process = process;
            resolve(res.data);
          })
          .catch(() => {
            reject();
          });
      });
    },
    /**
     * 发起流程
     * @param form {"processId": "流程定义id", ...表单自定义字段变量}
     */
    handleStartProcess(form) {
      if (this.$refs.examineForm && this.$refs.examineForm.examineForm) {
        const { copyUser, assignee } = this.$refs.examineForm.examineForm;
        form = { ...form, copyUser, assignee };
      }
      return new Promise((resolve, reject) => {
        startProcess(form)
          .then(() => {
            resolve();
          })
          .catch(() => {
            reject();
          });
      });
    },
    /**
     * 获取流程任务详情
     * @param taskId 任务id
     * @param processInsId 流程实例id
     * @returns Promise({"process": "流程实例信息", "form": "表单信息", "flow": "流转信息", "button": "配置按钮信息", "bpmnOption": "流程图配置"})
     */
    getTaskDetail(taskId, processInsId) {
      return new Promise((resolve, reject) => {
        detail({ taskId, processInsId })
          .then((res) => {
            const { process, form, flow, button } = res.data;

            this.process = process;
            this.flow = flow.reverse();
            this.bpmnOption = {
              xml: process.xml,
              flow: flow,
            };
            this.buttonList = button;
            const workflowStore = useWorkflowStore();
            workflowStore.setProcessDetail(process);
            workflowStore.setProcessFlow(this.flow);
            workflowStore.setButtonList(button);
            resolve({ process, form, flow, button });
          })
          .catch(() => {
            reject();
          });
      });
    },
    /**
     * 任务审核
     * @param pass 驳回/通过
     */
    handleCompleteTask(pass, variables, text, process) {
      return new Promise((resolve, reject) => {
        let comment, copyUser, assignee, attachment;
        if (text) comment = text;
        else if (this.$refs.examineForm) {
          const { examineForm } = this.$refs.examineForm;
          copyUser = examineForm.copyUser;
          assignee = examineForm.assignee;
          comment = examineForm.comment;
          attachment = examineForm.attachment;
        }

        if (!pass && !comment) {
          showToast({ message: '请填写批复意见' });
          this.submitLoading = false;
          reject();
          return;
        }
        if (process && Object.keys(process).length > 0) this.process = process;
        const { taskId, processInstanceId, processDefinitionName, processDefinitionId } =
          this.process;
        const param = {
          taskId,
          processInstanceId,
          processDefinitionName,
          processDefinitionId,
          pass,
          comment,
          copyUser,
          assignee,
          variables,
          attachment,
        };
        completeTask(param)
          .then(() => {
            resolve();
          })
          .catch(() => {
            reject();
          });
      });
    },

    /**
     * 驳回到指定节点
     * @param nodeId 节点id
     */
    handleRollbackTask(nodeId) {
      this.submitLoading = true;
      const { taskId } = this.process;
      rollbackTask({ comment: this.comment, nodeId, taskId }).then(() => {
        this.handleNavigateTo(
          { name: 'WorkflowMine', query: { current: '0' }, replace: true },
          '回退成功'
        );
      });
    },
    /**
     * 终止流程
     */
    handleTerminateProcess() {
      this.submitLoading = true;
      const { taskId } = this.process;
      terminateProcess({ taskId, comment: this.comment }).then(() => {
        this.handleNavigateTo(
          { name: 'WorkflowMine', query: { current: '0' }, replace: true },
          '操作成功'
        );
      });
    },
    // 人员选择弹窗
    handleUserSelect({ type, checkType }) {
      if (!this.comment && ['transfer', 'delegate'].includes(type)) {
        showToast({ message: '请填写批复意见' });
        return;
      }
      if (type == 'assignee') this.defaultChecked = this.$refs.examineForm.examineForm.assignee;
      else if (type == 'copy') this.defaultChecked = this.$refs.examineForm.examineForm.copyUser;

      this.$refs['user-select'].visible = true;
      this.userSelectType = type;
      this.checkType = checkType;
    },
    // 选人回调
    handleUserSelectConfirm(id, name) {
      const { comment, copyUser } = this.$refs.examineForm.examineForm;
      const { taskId, processInstanceId, processDefinitionName, processDefinitionId } =
        this.process;

      const type = this.userSelectType;
      const param = {
        taskId,
        processInstanceId,
        processDefinitionName,
        processDefinitionId,
        assignee: id,
        comment,
        copyUser,
      };
      if (type == 'transfer') {
        this.submitLoading = true;
        transferTask(param).then(() => {
          // 转办
          this.handleNavigateTo(
            { name: 'WorkflowMine', query: { current: '0' }, replace: true },
            '转办成功'
          );
        });
      } else if (type == 'delegate') {
        // 委托
        this.submitLoading = true;
        delegateTask(param).then(() => {
          this.handleNavigateTo(
            { name: 'WorkflowMine', query: { current: '0' }, replace: true },
            '委托成功'
          );
        });
      } else if (type == 'addInstance') {
        // 加签
        this.submitLoading = true;
        addMultiInstance(param).then(() => {
          showToast({ message: '加签成功', type: 'success' });
          this.submitLoading = false;
        });
      } else if (type == 'copy') {
        // 抄送
        this.$refs.examineForm.examineForm.copyUser = id;
        this.$refs.examineForm.examineForm.$copyUser = name;
      } else if (type == 'assignee') {
        // 指定下一步审批人
        this.$refs.examineForm.examineForm.assignee = id;
        this.$refs.examineForm.examineForm.$assignee = name;
      }
      this.$refs['user-select'].visible = false;
    },
    /**
     * 撤回/撤销
     */
    handleWithdrawTask(withdrawType) {
      this.submitLoading = true;
      const { taskId } = this.process;
      withdrawTask({ taskId, withdrawType }).then(() => {
        this.handleNavigateTo(
          { name: 'WorkflowMine', query: { current: '0' }, replace: true },
          '操作成功'
        );
      });
    },
    handleNavigateTo(target, msg) {
      const navigate = () => {
        if (!target) return;
        if (typeof target === 'string') {
          this.$router.push(target);
          return;
        }
        const { replace, ...location } = target;
        const navigation = replace ? this.$router.replace : this.$router.push;
        navigation.call(this.$router, location);
      };
      if (msg) {
        showToast({ message: msg });
        setTimeout(navigate, 1000);
      } else {
        navigate();
      }
    },
  },
};
