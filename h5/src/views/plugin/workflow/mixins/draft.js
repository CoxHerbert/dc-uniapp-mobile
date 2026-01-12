import { getDetail, submit } from '../api/draft';

export default {
  data() {
    return {
      saveDraftShow: false,
      recoverDraftShow: false,
    };
  },
  methods: {
    initDraft({ processDefId, taskId }) {
      return new Promise((resolve, reject) => {
        getDetail({ processDefId, taskId, platform: 'app' })
          .then((res) => {
            const { data } = res;
            if (data && data.variables && Object.keys(data.variables).length > 0) {
              this.recoverDraftData = data.variables;
              resolve(data.variables);
            } else {
              reject();
            }
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
    handleDraft({ processDefId, taskId, formKey, variables }) {
      this.draftData = {
        processDefId,
        taskId,
        formKey,
        variables: JSON.stringify(variables),
        platform: 'app',
      };
      this.saveDraftShow = true;
    },
    handleDraftSubmit(taskId) {
      submit(this.draftData).then(() => {
        if (taskId) {
          this.handleNavigateTo({ name: 'WorkflowWorkbench', replace: true });
        } else {
          this.handleNavigateTo({ name: 'WorkflowCreate', replace: true });
        }
      });
    },
    handleRevocerDraftSubmit() {
      this.form = JSON.parse(this.recoverDraftData);
      const option = this.deepClone(this.option);
      this.option = {};
      setTimeout(() => {
        this.option = option;
      });
    },
  },
};
