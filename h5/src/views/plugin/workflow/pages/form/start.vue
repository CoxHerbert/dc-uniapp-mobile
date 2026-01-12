<template>
  <div class="workflow-form-start">
    <!-- 顶部导航栏 -->
    <van-nav-bar :title="navTitle" left-arrow @click-left="$router.back()" />

    <!-- 内容区域：骨架屏 / 表单主体 -->
    <div v-if="waiting" class="wf-form-start">
      <van-skeleton :row="6" animate />
    </div>
    <div v-else class="wf-form-start">
      <div class="split-line">
        <wf-form
          v-if="
            option &&
            ((option.column && option.column.length > 0) ||
              (option.group && option.group.length > 0))
          "
          v-model="form"
          :option="option"
          @submit="handleSubmit"
        >
          <template #menu>
            <van-button
              type="success"
              size="small"
              :loading="submitLoading"
              block
              @click="
                handleDraft({ processDefId: process.id, formKey: process.formKey, variables: form })
              "
            >
              存为草稿
            </van-button>
          </template>
        </wf-form>
      </div>

      <div class="split-line">
        <wkf-exam-form
          v-if="showExamForm"
          ref="examineForm"
          :process="process"
          @user-select="handleUserSelect"
        />
      </div>

      <wkf-user-select
        ref="user-select"
        :check-type="checkType"
        :default-checked="defaultChecked"
        @on-confirm="handleUserSelectConfirm"
      />
    </div>

    <!-- 草稿相关弹窗 -->
    <van-dialog
      v-model:show="saveDraftShow"
      show-cancel-button
      message="保存至草稿箱并关闭？"
      @confirm="handleDraftSubmit"
    />
    <van-dialog
      v-model:show="recoverDraftShow"
      show-cancel-button
      message="是否恢复之前保存的草稿？"
      @confirm="handleRevocerDraftSubmit"
    />
    <van-date-time v-model:show="show" v-model:current="time" type="time" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { Base64 } from '@/utils/base64.js';
import { isRendererTestEnvironment } from '@/utils/env';
import wkfUserSelect from '../../components/wf-user-select/index.vue';
import wkfExamForm from '../../components/wf-exam-form/index.vue';
import exForm from '../../mixins/ex-form';
import draft from '../../mixins/draft';

export default defineComponent({
  name: 'WorkflowFormStartPage',
  components: { wkfExamForm, wkfUserSelect },
  mixins: [exForm, draft],
  data() {
    return {
      form: {},
      option: {},
      submitLoading: false,
      zcoldValue: {},
      _initFunctionExecuted: false,
    };
  },
  computed: {
    // 是否显示审批相关区域
    showExamForm() {
      const { hideComment, hideCopy, hideExamine } = this.process || {};
      return !hideComment || !hideCopy || !hideExamine;
    },
    // 顶部导航标题：流程发起-流程名称
    navTitle() {
      const process = this.process || {};
      const name = process.processDefinitionName || process.name || '';
      return name ? `流程发起-${name}` : '流程发起';
    },
    enableRendererCompare() {
      return isRendererTestEnvironment();
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
    resolveRouteParams(query = {}) {
      const { p } = query;
      if (!p) return;
      try {
        const param = JSON.parse(Base64.decode(p));
        const { processId } = param;
        if (processId) {
          this.getForm(processId);
        }
      } catch (error) {
        console.error('[workflow] 无法解析流程参数', error);
      }
    },
    runInitFunctionOnce(initFunction) {
      if (this._initFunctionExecuted) return;
      this._initFunctionExecuted = true;

      if (!initFunction) return;
      if (!this.form) this.form = {};

      try {
        let code =
          typeof initFunction === 'function' ? initFunction.toString() : String(initFunction);

        // 兼容 proxy → this
        code = code.replace(/\bproxy\b/g, 'this');

        // ① 如果是函数 / 箭头函数
        if (/^\s*(function\s*\(|\(\s*.*\)\s*=>|.*=>)/.test(code)) {
          const fn = eval(code);
          if (typeof fn === 'function') {
            fn.call(this, this);
            return;
          }
        }

        // ② 当作普通函数体执行
        const runner = new Function(`
          "use strict";
          return (function () {
            with (this) {
              ${code}
            }
          });
        `)();

        runner.call(this);
      } catch (e) {
        console.error('[workflow] initFunction 执行失败:', e);
        console.error('[workflow] initFunction 原始内容:', initFunction);
      }
    },
    getForm(processDefId) {
      this.getStartForm(processDefId).then((res) => {
        let { form, appForm, startForm } = res;
        if (form) {
          let option;

          try {
            option = { ...eval('(' + form + ')'), labelPosition: 'top' };
          } catch (error) {
            try {
              option = { ...JSON.parse(appForm), labelPosition: 'top' };
            } catch (parseError) {
              console.error('[workflow] 无法解析流程表单配置', error, parseError);
              this.waiting = false;
              return;
            }
          }

          const { column, group, initFunction } = option;
          console.log('initFunction======>', initFunction);
          this.runInitFunctionOnce(initFunction);
          // 执行initFunction（如果存在 表单设计器初始化代码执行 目前只针对当前用户全局获取
          // if (initFunction) {
          //   try {
          //     console.log('开始执行initFunction...');
          //     // 确保form对象存在
          //     if (!this.form) {
          //       this.form = {};
          //     }
          //     // 第一步：预处理 - 替换proxy为this
          //     let processedCode;
          //     if (typeof initFunction === 'string') {
          //       processedCode = initFunction.replace(/\bproxy\b/g, 'this');
          //     } else if (typeof initFunction === 'function') {
          //       processedCode = initFunction.toString().replace(/\bproxy\b/g, 'this');
          //     }

          //     console.log('预处理后的代码:', processedCode);
          //     console.log('this.$store======>', this.$store.state.user.userInfoAll);

          //     // 第二步：执行预处理后的代码
          //     if (typeof initFunction === 'string' || typeof initFunction === 'function') {
          //       try {
          //         // 方法2：尝试在函数外部执行逻辑
          //         if (this.$store.state.user.userInfoAll) {
          //           const userInfo = this.$store.state.user.userInfoAll;
          //           if (userInfo && userInfo.id) {
          //             this.form.userId = userInfo.id;
          //             this.form.userNumber = userInfo.account;
          //             this.form.deptId = userInfo.deptId;
          //             this.form.userType = '在职';
          //           }
          //         }
          //       } catch (executeError) {
          //         try {
          //           const store = this.$store;
          //           if (store && store.state && store.state.user && store.state.user.userInfoAll) {
          //             const userInfo = store.state.user.userInfoAll;
          //             if (userInfo && !this.form.userId) {
          //               this.form.userId = userInfo.id;
          //               this.form.userNumber = userInfo.account;
          //               this.form.deptId = userInfo.deptId;
          //               this.form.userType = '在职';
          //               console.log('手动执行initFunction逻辑完成:', {
          //                 userId: this.form.userId,
          //                 userNumber: this.form.userNumber,
          //                 deptId: this.form.deptId,
          //                 userType: this.form.userType,
          //               });
          //             }
          //           } else {
          //             console.log('store状态不完整，无法获取用户信息');
          //           }
          //         } catch (manualError) {
          //           console.error('手动执行也失败:', manualError);
          //         }
          //       }
          //     }
          //   } catch (error) {
          //     console.error('initFunction处理失败:', error);
          //     console.error('错误详情:', error.message);
          //     console.error('initFunction内容:', initFunction);
          //   }
          // } else {
          //   console.log('没有initFunction需要执行');
          // }

          const groupArr = [];
          const columnArr = this.filterAvueColumn(column, startForm).column;
          if (group && group.length > 0) {
            // 处理 group
            group.forEach((gro) => {
              gro.column = this.filterAvueColumn(gro.column, startForm).column;
              if (gro.column.length > 0) groupArr.push(gro);
            });
          }

          option.column = columnArr;
          option.group = groupArr;
          this.option = option;
          this.waiting = false;

          // 查询是否有草稿箱
          this.initDraft({ processDefId }).then(() => {
            this.recoverDraftShow = true;
          });
        }
      });
    },
    handleSubmit(form, done) {
      this.submitLoading = true;
      form.processId = this.process.id;
      form['wf_platform'] = 'app';
      this.handleStartProcess(form)
        .then(() => {
          this.handleNavigateTo(
            { name: 'WorkflowMine', query: { current: '1' }, replace: true },
            '发起成功'
          );
        })
        .catch(() => {
          done();
          this.submitLoading = false;
        });
    },
  },
});
</script>

<style lang="scss" scoped>
.workflow-form-start {
  min-height: 100vh;
  background: #f6f6f6;
}

.split-line {
  border-bottom: 10px solid #f6f6f6;
  min-height: 45px;
}
</style>
