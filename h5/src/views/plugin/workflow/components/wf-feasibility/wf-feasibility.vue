<template>
  <div class="wf-feasibility">
    <div class="header-row">
      <div class="ceil">评审内容</div>
      <div class="ceil">总分</div>
      <div class="ceil">评分</div>
    </div>
    <div v-for="(col, i) in localValue" :key="i" class="content-row">
      <div class="ceil">{{ col.feaEvaluationConclusion }}</div>
      <div class="ceil">{{ col.feaEvaluationTotalScore }}</div>
      <div class="ceil score-cell">
        <van-field
          v-model="localValue[i].feaEvaluationScore"
          class="input-item"
          type="number"
          input-align="center"
          :maxlength="6"
          placeholder="请输入"
          @blur="(event) => handleInput(event.target.value, i)"
          @update:model-value="(val) => handleInput(val, i)"
        />
      </div>
    </div>
    <div class="content-row summary-row">
      <div class="ceil">总分</div>
      <div class="ceil">{{ total }}</div>
      <div class="ceil">{{ hasScore }}</div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'WfFeasibility',
  props: {
    modelValue: {
      type: [String, Array],
      default: () => [],
    },
    value: {
      type: [String, Array],
      default: () => [],
    },
    columns: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      localValue: [],
    };
  },
  computed: {
    innerValue() {
      return this.modelValue !== undefined ? this.modelValue : this.value;
    },
    total() {
      if (Array.isArray(this.localValue)) {
        return this.localValue.reduce((rec, item) => {
          const totalScore = parseInt(item.feaEvaluationTotalScore, 10);
          return rec + (Number.isNaN(totalScore) ? 0 : totalScore);
        }, 0);
      }
      return '-';
    },
    hasScore() {
      if (Array.isArray(this.localValue)) {
        return this.localValue.reduce((rec, item) => {
          const score = parseFloat(item.feaEvaluationScore);
          return rec + (Number.isNaN(score) ? 0 : score);
        }, 0);
      }
      return '-';
    },
  },
  watch: {
    innerValue: {
      handler(val) {
        if (Array.isArray(val)) {
          this.localValue = val.map((item) => ({ ...item }));
        } else if (typeof val === 'string' && val.length > 0) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
              this.localValue = parsed.map((item) => ({ ...item }));
              this.emitValue(parsed);
            }
          } catch (error) {
            this.localValue = [];
          }
        } else {
          this.localValue = [];
        }
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    handleInput(val, index) {
      if (!Array.isArray(this.localValue)) return;
      const valueNew = [...this.localValue];
      const target = valueNew[index];
      if (!target) return;
      const max = parseFloat(target.feaEvaluationTotalScore) || 0;
      const numeric = Math.max(Math.min(max, parseFloat(val) || 0), 0);
      target.feaEvaluationScore = numeric;
      this.localValue.splice(index, 1, { ...target });
      this.emitValue(this.localValue);
    },
    emitValue(value) {
      this.$emit('update:modelValue', value);
    },
  },
});
</script>

<style lang="scss" scoped>
.wf-feasibility {
  border-top: 1px solid #eaeaeb;
}

.header-row .ceil {
  font-weight: bold;
}

.header-row,
.content-row {
  display: flex;
  border-bottom: 1px solid #eaeaeb;
}

.ceil {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  line-height: 1.4;
  font-size: 14px;
  border-left: 1px solid #eaeaeb;
  min-height: 50px;
  box-sizing: border-box;
}

.ceil:nth-child(3n + 1) {
  border-right: none;
  width: 60%;
}

.ceil:nth-child(3n + 2) {
  width: 20%;
  border-right: 1px solid #eaeaeb;
  border-left: 1px solid #eaeaeb;
}

.ceil:nth-child(3n + 3) {
  border-left: none;
  border-top: none;
  border-right: 1px solid #eaeaeb;
  width: 20%;
}

.summary-row {
  font-weight: 600;
}

.input-item {
  width: 100%;
}
</style>
