<template>
  <div class="wf-user-select flex">
    <div class="width50">
      <van-field
        v-model="tenantName"
        placeholder="租户选择"
        label-width="0"
        right-icon="arrow-down"
        readonly
        clickable
        @click="onClick"
      />
      <van-popup v-model:show="show" position="bottom" round>
        <van-picker
          :columns="tenantList"
          :columns-field-names="{ text: 'label' }"
          show-toolbar
          title="租户选择"
          @confirm="handleSubmit"
          @cancel="show = false"
        />
      </van-popup>
    </div>
    <div class="width50 ml">
      <van-field
        v-model="name"
        :placeholder="placeholder || '请选择'"
        label-width="0"
        right-icon="search"
        readonly
        clickable
        @click="handleSelect"
      />
    </div>
    <WkfCustomtableSelect
      ref="user-select"
      :params="{ fuseorgid }"
      :c-column="column"
      :check-type="checkType"
      :default-checked="value.id ? value.id : ''"
      :fn-url="column.children.props.url"
      @on-confirm="handleUserSelectConfirm"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { Toast } from 'vant';
import Api from '@/api';
import WkfCustomtableSelect from '../../wf-customtable-select/index.vue';

export default defineComponent({
  name: 'MaterialSelect',
  components: { WkfCustomtableSelect },
  props: {
    value: {
      type: [Object, Array, String, Number],
      default: () => ({ id: '' }),
    },
    checkType: {
      type: String,
      default: 'radio',
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    placeholder: String,
    column: {
      type: Object,
      default: () => ({
        children: {
          props: {
            url: '',
          },
        },
      }),
    },
    fnUrl: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      tenantName: '',
      fuseorgid: '',
      show: false,
      name: '',
      tenantList: [],
    };
  },
  watch: {
    value: {
      handler(val) {
        if (val && typeof val === 'object' && Object.prototype.hasOwnProperty.call(val, 'id')) {
          this.name = val[this.column?.props?.label] || '';
        } else {
          this.name = '';
        }
      },
      immediate: true,
      deep: true,
    },
  },
  mounted() {
    this.getTenantListList();
  },
  methods: {
    handleSubmit({ selectedOptions }) {
      const option = selectedOptions && selectedOptions[0];
      if (option) {
        this.tenantName = option.label;
        this.fuseorgid = option.value;
      }
      this.show = false;
    },
    async getTenantListList() {
      const res = await Api.org.getOrgList({});
      if (res && res.code === 200) {
        this.tenantList = (res.data || []).map((item) => {
          if (item.id === '100006') {
            this.tenantName = item.orgName;
            this.fuseorgid = item.orgId;
          }
          return {
            label: item.orgName,
            value: item.orgId,
          };
        });
      }
    },
    onClick() {
      this.show = true;
    },
    handleSelect() {
      if (!this.fuseorgid) {
        Toast({ message: '请先选择租户' });
        return;
      }
      if (this.readonly || this.disabled) return;
      this.$refs['user-select'].visible = true;
    },
    handleUserSelectConfirm(selectData) {
      this.$emit('label-change', selectData);
    },
  },
});
</script>

<style lang="scss" scoped>
.flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  .width50 {
    width: 46%;
  }

  .ml {
    margin-left: 8%;
  }
}

.wf-user-select {
  width: 100%;
}
</style>
