<template>
  <div class="wf-input">
    <van-field
      v-model="text"
      :type="typeDic[column.type]"
      :maxlength="column.maxlength || 350"
      :placeholder="getPlaceholder(column, column.type)"
      :disabled="disabled"
      :autosize="column.type === 'textarea' ? autosizeConfig : undefined"
      :border="column.border || false"
      :rows="column.rows"
      clearable
      @click="handleClick"
      @focus="handleFocus"
      @blur="handleBlur"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { Field } from 'vant';
import Props from '../../mixins/props.js';

export default defineComponent({
  name: 'WfInput',
  components: {
    [Field.name]: Field,
  },
  mixins: [Props],
  data() {
    return {
      typeDic: {
        input: 'text',
        number: 'digit',
        textarea: 'textarea',
        password: 'password',
      },
    };
  },
  computed: {
    autosizeConfig() {
      const { column } = this;
      if (column?.autosize && typeof column.autosize === 'object') {
        return column.autosize;
      }
      if (column?.type === 'textarea') {
        return { minHeight: 88 };
      }
      return undefined;
    },
  },
});
</script>

<style lang="scss" scoped>
.wf-input {
  width: 100%;
}
</style>
