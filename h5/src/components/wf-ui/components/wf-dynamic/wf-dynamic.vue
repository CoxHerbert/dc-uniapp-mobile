<template>
  <div class="wf-dynamic">
    <div v-if="!text || text.length === 0" class="wf-dynamic__card">
      <div class="wf-dynamic__header">
        <div class="wf-dynamic__title">#1</div>
        <van-button
          v-if="option.addBtn && !disabled"
          icon="plus"
          size="small"
          type="primary"
          plain
          @click="handleAddRow"
        >
          添加
        </van-button>
      </div>
    </div>
    <div v-else>
      <div v-for="(item, index) in text" :key="index" class="wf-dynamic__card">
        <div class="wf-dynamic__header">
          <div class="wf-dynamic__title">#{{ index + 1 }}</div>
          <van-button
            v-if="option.addBtn && !disabled"
            icon="plus"
            size="small"
            type="primary"
            plain
            @click="handleAddRow"
          >
            添加
          </van-button>
        </div>
        <div class="wf-dynamic__body">
          <wf-form
            ref="main"
            v-model="text[index]"
            :option="{ labelPosition: 'top', disabled: disabled, dynamicIndex: index, ...option }"
            @label-change="handleLabelChange"
          />
          <!-- <wkf-form
            ref="main"
            v-model="text[index]"
            :option="{ labelPosition: 'top', disabled: disabled, dynamicIndex: index, ...option }"
            @label-change="handleLabelChange"
          ></wkf-form> -->
        </div>
        <div v-if="!disabled" class="wf-dynamic__footer">
          <van-button
            v-if="option.addBtn"
            block
            size="small"
            type="primary"
            plain
            @click="handleAddRow"
          >
            添 加
          </van-button>
          <van-button
            v-if="option.delBtn"
            block
            size="small"
            type="danger"
            plain
            @click="handleDelRow(index)"
          >
            删 除
          </van-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { Button } from 'vant';
import Props from '../../mixins/props.js';
import wfForm from '../wkf-form/wkf-form.vue';

export default defineComponent({
  name: 'WfDynamic',
  components: {
    [Button.name]: Button,
    wfForm,
  },
  mixins: [Props],
  computed: {
    option() {
      return this.column.children || {};
    },
  },
  methods: {
    handleAddRow() {
      if (!Array.isArray(this.text)) {
        this.text = [];
      }
      this.text.push({});
    },
    handleDelRow(index) {
      if (!Array.isArray(this.text)) return;
      this.text.splice(index, 1);
    },
    handleLabelChange({ prop, value, index }) {
      if (!Array.isArray(this.text) || !this.text[index]) {
        return;
      }
      const next = { ...this.text[index], [`$${prop}`]: value };
      this.text.splice(index, 1, next);
    },
  },
});
</script>

<style lang="scss" scoped>
.wf-dynamic {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__card {
    border: 1px solid #ebedf0;
    border-radius: 8px;
    padding: 16px;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__title {
    font-weight: 600;
    color: #323233;
  }

  &__body {
    padding: 8px 0;
  }

  &__footer {
    display: flex;
    gap: 12px;
    margin-top: 12px;
  }
}
</style>
