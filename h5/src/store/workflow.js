import { defineStore } from 'pinia';
import { todoList } from '@/views/plugin/workflow/api/process.js';

export const useWorkflowStore = defineStore('workflow', {
  state: () => ({
    todoItems: [],
    todoTotal: 0,
    processDetail: null,
    processFlow: [],
    buttonList: [],
  }),
  getters: {
    hasTodo(state) {
      return state.todoItems.length > 0;
    },
  },
  actions: {
    async fetchTodoList(params = { current: 1, size: 5 }) {
      const { append = false, ...query } = params || {};
      const response = await todoList(query);
      const { records = [], total = 0 } = response.data || {};
      this.todoItems = append ? [...this.todoItems, ...records] : records;
      this.todoTotal = total;
      return { records, total };
    },
    setTodoList(records = [], total = 0) {
      this.todoItems = records;
      this.todoTotal = total;
    },
    setProcessDetail(process = null) {
      this.processDetail = process;
    },
    setProcessFlow(flow = []) {
      this.processFlow = Array.isArray(flow) ? flow : [];
    },
    setButtonList(buttonList = []) {
      this.buttonList = Array.isArray(buttonList) ? buttonList : [];
    },
    resetWorkflowContext() {
      this.processDetail = null;
      this.processFlow = [];
      this.buttonList = [];
    },
  },
});
