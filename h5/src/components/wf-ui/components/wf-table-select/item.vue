<template>
  <div class="wf-table-select__content--item">
    <component :is="selectionComponent" :name="item[valueKey]" :disabled="disabled" class="wf-table-select__selector">
      <div class="wf-table-select__item-body">
        <div class="row">
          <div class="row-item" v-for="(col, cIndex) in cColumn" :key="cIndex">
            <div class="row-label" v-if="col.prop !== 'avatar'">{{ col.label }}:</div>
            <div class="row-value" v-if="col.prop !== 'avatar'">{{ item[col.prop] }}</div>
          </div>
        </div>
        <div
          v-if="hasChildren"
          class="wf-table-select__toggle"
          @click.stop="handleRowExpand(item, index)"
        >
          <van-icon :name="arrowKeys.includes(item[valueKey]) ? 'arrow-up' : 'arrow-down'" />
        </div>
      </div>
    </component>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue';
import { Checkbox, Radio, Icon } from 'vant';

export default defineComponent({
  name: 'WfTableSelectItem',
  components: {
    [Checkbox.name]: Checkbox,
    [Radio.name]: Radio,
    [Icon.name]: Icon,
  },
  props: {
    item: {
      type: Object,
      default: () => ({}),
    },
    valueKey: {
      type: String,
      default: 'id',
    },
    childrenKey: {
      type: String,
      default: 'children',
    },
    hasChildrenKey: {
      type: String,
      default: 'hasChildren',
    },
    multiple: {
      type: Boolean,
      default: false,
    },
    selectionList: {
      type: Array,
      default: () => [],
    },
    cColumn: {
      type: Array,
      default: () => [],
    },
    arrowKeys: {
      type: Array,
      default: () => [],
    },
    index: {
      type: Number,
      default: 0,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const selectionComponent = computed(() => (props.multiple ? Checkbox : Radio));
    const hasChildren = computed(
      () => props.item?.[props.childrenKey] || props.item?.[props.hasChildrenKey]
    );

    const handleRowExpand = (row, index) => {
      emit('row-expand', { row, index });
    };

    return {
      selectionComponent,
      hasChildren,
      handleRowExpand,
    };
  },
});
</script>

<style lang="scss" scoped>
.wf-table-select__content--item {
  background-color: #fff;
  margin: 8px;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.wf-table-select__selector {
  width: 100%;
}

.wf-table-select__item-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  box-sizing: border-box;
}

.row {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 10px;

  &-item {
    display: flex;
    align-items: center;
  }

  &-label {
    color: #999;
    font-size: 14px;
    margin-right: 3px;
  }

  &-value {
    flex: 1;
    color: #565656;
    font-size: 14px;
    word-break: break-all;
    word-wrap: break-word;
    white-space: pre-wrap;
  }
}

.wf-table-select__toggle {
  min-width: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #969799;
}
</style>
