<template>
    <div class="wf-form-start">
        <div class="split-line">
            <wf-form v-model="form" :option="option" @submit="handleSubmit"></wf-form>
        </div>
        <div class="split-line">
            <wkf-exam-form
                v-if="showExamForm"
                ref="examineForm"
                :process="process"
                @user-select="handleUserSelect"
            ></wkf-exam-form>
        </div>

        <!-- 选人 -->
        <wkf-user-select
            ref="user-select"
            :check-type="checkType"
            :default-checked="defaultChecked"
            @onConfirm="handleUserSelectConfirm"
        ></wkf-user-select>
    </div>
</template>

<script>
import { defineComponent } from 'vue';
import { Base64 } from '@/utils/base64.js';
import wkfUserSelect from '../../../components/wf-user-select/index.vue';
import wkfExamForm from '../../../components/wf-exam-form/index.vue';
import exForm from '../../../mixins/ex-form';

export default defineComponent({
    name: 'WorkflowLeaveStartPage',
    mixins: [exForm],
    components: { wkfExamForm, wkfUserSelect },
    computed: {
        showExamForm() {
            const { hideComment, hideCopy, hideExamine } = this.process;
            return !hideComment || !hideCopy || !hideExamine;
        },
    },
    data() {
        return {
            form: {},
            option: {
                labelPosition: 'top',
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
        };
    },
    created() {
        this.resolveRouteParams(this.$route.query);
    },
    watch: {
        '$route.query.p'(value) {
            this.resolveRouteParams({ p: value });
        },
    },
    methods: {
        resolveRouteParams(query = {}) {
            const { p } = query;
            if (!p) return;
            try {
                const param = JSON.parse(Base64.decode(p));
                const { processId } = param;
                if (processId) this.getForm(processId);
            } catch (error) {
                console.error('[workflow] 无法解析请假流程参数', error);
            }
        },
        getForm(processDefId) {
            this.getStartForm(processDefId).then((res) => {
                const { startForm } = res;
                const option = { ...this.option };
                const { column, group } = option;

                const groupArr = [];
                const columnArr = this.filterAvueColumn(column, startForm).column;
                if (group && group.length > 0) {
                    group.forEach((gro) => {
                        gro.column = this.filterAvueColumn(gro.column, startForm).column;
                        if (gro.column.length > 0) groupArr.push(gro);
                    });
                }

                option.column = columnArr;
                option.group = groupArr;
                this.option = option;
            });
        },
        handleSubmit(form, done) {
            form.processId = this.process.id;
            this.handleStartProcess(form)
                .then(() => {
                    this.handleNavigateTo(
                        { name: 'WorkflowMine', query: { current: '1' }, replace: true },
                        '发起成功'
                    );
                })
                .catch(() => {
                    done();
                });
        },
    },
});
</script>

<style scoped>
.wf-form-start {
    background: #f6f6f6;
}

.split-line {
    border-bottom: 20px solid #f6f6f6;
    min-height: 45px;
}
</style>
