<template>
  <div class="wf-user-select">
    <div class="wf-user-select__field" @click="handleSelect">
      <van-field
        v-model="name"
        :placeholder="placeholder || '人员选择'"
        label-width="0"
        right-icon="search"
        readonly
        clickable
        :disabled="readonly || disabled"
      />
    </div>
    <wkf-user-select
      ref="user-select"
      :check-type="checkType"
      :default-checked="value"
      @on-confirm="handleUserSelectConfirm"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import Api from '@/api';
import WkfUserSelect from '../../wf-user-select/index.vue';

export default defineComponent({
  name: 'UserSelect',
  components: { WkfUserSelect },
  props: {
    value: [String, Number],
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
    userUrl: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      name: '',
    };
  },
  watch: {
    value: {
      handler(val) {
        if (val) {
          const checks = String(val).split(',');
          Promise.all(checks.map((c) => Api.user.getUser(c))).then((res) => {
            const names = res
              .map((r) => r.data && r.data.realName)
              .filter((realName) => !!realName);
            this.name = names.join(',');
          });
        } else {
          this.name = '';
        }
      },
      immediate: true,
    },
  },
  methods: {
    handleSelect() {
      if (this.readonly || this.disabled) return;
      this.$refs['user-select'].visible = true;
    },
    handleUserSelectConfirm(id) {
      console.log(id);
      this.$emit('update:modelValue', id);
    },
  },
});
</script>

<style lang="scss" scoped>
.wf-user-select {
  width: 100%;

  &__field {
    position: relative;
  }
}
</style>
