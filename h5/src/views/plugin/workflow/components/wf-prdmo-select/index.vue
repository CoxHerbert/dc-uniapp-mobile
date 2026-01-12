<template>
  <van-popup
    v-model:show="visible"
    position="center"
    round
    :close-on-click-overlay="false"
    :style="{ width: '90vw' }"
  >
    <div class="nf-dialog">
      <!-- 标题 -->
      <div class="nf-dialog__header">专案物料查询</div>

      <!-- 内容：nf-crud 原样保留 -->
      <div class="nf-dialog__body">
        <nf-crud
          v-if="isInit && visible"
          ref="crud"
          v-model:page="page"
          v-model="form"
          :option="option"
          :table-loading="loading"
          :data="data"
          @search-change="searchChange"
          @search-reset="searchReset"
          @selection-change="selectionList = $event"
          @current-change="page.current = $event"
          @size-change="page.pageSize = $event"
          @row-click="rowClick"
          @on-load="onLoad"
        >
          <!-- 单选模式：用 van-radio 替换 el-radio -->
          <template v-if="checkType === 'radio'" #radio="{ row }">
            <van-radio-group v-model="form.radio">
              <van-radio :name="row.id" icon-size="18px" />
            </van-radio-group>
          </template>
        </nf-crud>
      </div>

      <!-- 底部按钮：用 van-button 替换 el-button -->
      <div class="nf-dialog__footer dialog-footer">
        <van-button size="small" type="default" plain @click="handleClose"> 取 消 </van-button>
        <van-button size="small" type="primary" @click="handleConfirm"> 确 定 </van-button>
      </div>
    </div>
  </van-popup>
</template>

<script>
import Api from '@/api';

export default {
  props: {
    modelValue: [String, Number, Object],
    voUrl: {
      type: String,
      default: () => {
        return '/blade-erp/v-prd-mo-material/list';
      },
    },
    customOption: Object,
    checkType: {
      type: String,
      default: () => {
        return 'radio';
      },
    },
    fuseorgid: {
      type: String,
      default: () => {
        return '';
      },
    },
  },
  data() {
    return {
      isInit: false,
      visible: false,
      form: {},
      query: {},
      loading: false,
      page: {
        size: 10,
        current: 1,
        total: 0,
      },
      selectionList: [],
      data: [],
      props: {
        id: 'id',
        name: 'realName',
        records: 'data.data.records',
        total: 'data.data.total',
      },
      option: {
        size: 'default',
        searchSize: 'default',
        align: 'center',
        menu: false,
        addBtn: false,
        header: false,
        border: true,
        tip: false,
        reserveSelection: true,
        highlightCurrentRow: true,
        gutter: 5,
        searchMenuSpan: 6,
        selection: true,
        column: [
          {
            label: '',
            prop: 'radio',
            type: 'radio',
            width: 55,
            hide: true,
          },
          {
            label: '计划跟踪号',
            prop: 'motno',
            overHidden: true,
            search: true,
          },
          {
            label: '物料编码',
            prop: 'materialCode',
            overHidden: true,
            width: 90,
            search: true,
          },

          {
            label: '物料名称',
            prop: 'materialName',
            overHidden: true,
            search: true,
          },
          {
            label: '规格型号',
            prop: 'specification',
            overHidden: true,
          },
          {
            label: '数量',
            prop: 'qty',
            overHidden: true,
          },
        ],
      },
    };
  },
  computed: {
    ids() {
      const ids = new Set();
      this.selectionList.forEach((ele) => {
        ids.add(ele.id);
      });
      return Array.from(ids).join(',');
    },
    names() {
      const names = new Set();
      this.selectionList.forEach((ele) => {
        names.add(ele.realName);
      });
      return Array.from(names).join(',');
    },
  },
  watch: {
    checkType: {
      handler(val) {
        if (val === 'radio') {
          this.option.selection = false;
          this.findObject(this.option.column, 'radio').hide = false;
        } else {
          this.option.selection = true;
          this.findObject(this.option.column, 'radio').hide = true;
        }
      },
      immediate: true,
    },
  },
  mounted() {
    this.init();
  },
  methods: {
    init() {
      if (!this.isInit) {
        if (this.customOption) {
          const { column, userProps } = this.customOption;
          if (column) this.option.column = column;
          if (userProps) this.props = userProps;
        }
        this.isInit = true;
      }
    },
    handleConfirm() {
      if (this.selectionList.length === 0) {
        this.$toast?.warning?.('请选择至少一条数据') ||
          this.$message?.warning('请选择至少一条数据');
        return;
      }
      this.$emit('onConfirm', this.selectionList);
      this.handleClose();
    },
    handleClose() {
      // this.selectionClear()
      this.visible = false;
    },
    searchReset() {
      this.query = {};
      this.onLoad(this.page);
    },
    searchChange(params, done) {
      this.query = params;
      this.page.current = 1;
      this.onLoad(this.page, params);
      done();
    },
    selectionClear() {
      this.selectionList = [];
      if (this.$refs.crud) this.$refs.crud.toggleSelection();
    },
    rowClick(row) {
      if (this.checkType === 'radio') {
        this.selectionList = [row];
        this.form.radio = row.id;
      } else if (this.$refs.crud) {
        this.$refs.crud.toggleSelection([row]);
      }
    },
    async changeDefaultChecked() {
      if (!this.defaultChecked) return;
      const defaultChecked = this.defaultChecked;
      if (this.checkType === 'checkbox') {
        const checks = defaultChecked.split(',');
        if (checks.length > 0) {
          setTimeout(() => {
            checks.forEach(async (c) => {
              let row = this.data.find((d) => d.id === c); // 当前页查找
              if (!row) {
                row = this.selectionList.find((d) => d.id === c); // 勾选列表查找
                if (!row) {
                  const res = await Api.material.getMaterialDetail(c); // 接口查找
                  if (res.data.data) row = res.data.data;
                }
              }
              if (row && this.$refs.crud) this.$refs.crud.toggleRowSelection(row, true);
            });
          }, 500);
        }
      } else {
        let row = this.data.find((d) => d.id === defaultChecked.id);

        if (!row) {
          const res = await Api.material.getMaterialDetail({
            materialCode: defaultChecked.id,
          });
          if (res.data.data) row = res.data.data;
        }

        if (row) {
          this.selectionList = [row];
          this.form.radio = defaultChecked.id;
        } else {
          this.selectionList = [];
          this.form.radio = '';
        }
      }
    },
    onLoad(page, params = {}) {
      this.loading = true;
      const param = {
        current: page.current || 1,
        size: page.pageSize || 10,
        ...Object.assign(params, this.query),
      };
      this.$http
        .request({
          path: this.voUrl,
          method: 'get',
          params: param,
        })
        .then((res) => {
          const { data } = res;
          this.page.total = data.total;
          this.data = data.records;
          this.loading = false;

          this.changeDefaultChecked();
        });
    },
  },
};
</script>

<style lang="scss" scoped>
.nf-dialog {
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;

  &__header {
    padding: 12px 16px;
    font-size: 16px;
    font-weight: 600;
    text-align: center;
    border-bottom: 1px solid #f2f3f5;
  }

  &__body {
    flex: 1;
    overflow: auto;
    padding: 8px 12px 0;
  }

  &__footer {
    padding: 10px 16px 14px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;

    .van-button {
      flex: 1;
    }
  }
}
</style>
