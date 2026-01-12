<template>
  <div class="workflow-create">
    <!-- 顶部导航栏：默认返回上一页，不固定定位 -->
    <van-nav-bar title="新建流程" left-arrow @click-left="handleBack" />

    <div class="workflow-create-body">
      <!-- 搜索：吸顶 -->
      <div class="head-item">
        <div class="search-item">
          <van-search
            v-model="searchValue"
            placeholder="请输入流程名称"
            shape="square"
            :clearable="true"
            class="create-search"
            @search="getList(true)"
            @clear="getList(true)"
          />
        </div>
      </div>

      <van-collapse
        v-if="list.length > 0"
        v-model="activeNames"
        :border="false"
        class="wf-collapse"
      >
        <van-collapse-item v-for="(item, index) in list" :key="index" :name="String(index)">
          <template #title>
            <span class="collapse-title">{{ item.category }}</span>
          </template>

          <div
            v-for="(processItem, cIndex) in item.processList"
            :key="cIndex"
            class="item flex-between flex-c"
            @click="handleProcessClick(processItem)"
          >
            <img
              class="icon"
              :src="processItem.icon || createIcons[cIndex % createIcons.length]"
              alt="workflow icon"
            />
            <div class="flex-one r">
              <div class="name txt-cut1">
                {{ processItem.processDefinitionName }}
              </div>
            </div>
          </div>
        </van-collapse-item>
      </van-collapse>

      <wf-empty v-else text="暂无数据" />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { list } from '../../api/process.js';
import exForm from '../../mixins/ex-form.js';
import { useUserStore } from '@/store/user.js';
import { useAuthStore } from '@/store/auth.js';

const defaultCreateIcons = Array.from(
  { length: 10 },
  (_, index) => new URL(`../../static/images/create/icon_${index}.svg`, import.meta.url).href
);

export default defineComponent({
  name: 'WorkflowCreatePage',
  mixins: [exForm],
  data() {
    return {
      createIcons: defaultCreateIcons,
      searchValue: '',
      activeNames: [],
      list: [],
      loading: false,
    };
  },
  mounted() {
    this.getList(true);
  },
  methods: {
    handleBack() {
      this.$router.back();
    },
    async getList(reset = false) {
      if (this.loading) return;
      this.loading = true;
      const param = { processDefinitionName: this.searchValue, platform: 'h5' };
      try {
        const res = await list(param);
        this.list = (res && res.data) || [];
        this.$nextTick(() => {
          this.activeNames = this.list.map((_, idx) => String(idx));
        });
      } catch (error) {
        console.error('[workflow] 获取流程定义失败', error);
      } finally {
        this.loading = false;
      }
    },
    handleProcessClick(processDefinition) {
      this.refreshToken(processDefinition);
    },
    refreshToken(processDefinition) {
      const userStore = useUserStore();
      const authStore = useAuthStore();
      const userInfo = userStore.userInfo;
      if (userInfo && authStore.refreshToken) {
        authStore
          .refresh()
          .catch((error) => {
            console.warn('[workflow] 刷新令牌失败', error);
          })
          .finally(() => {
            this.dynamicRoute(processDefinition, 'start');
          });
      } else {
        this.dynamicRoute(processDefinition, 'start');
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.workflow-create {
  min-height: 100vh;
  background: #f2f3f7;
  display: flex;
  flex-direction: column;

  .workflow-create-body {
    flex: 1;
    padding-bottom: 16px;
  }

  /* 搜索吸顶 */
  .head-item {
    position: sticky;
    top: 0;
    z-index: 9;
    padding: 8px 16px 12px;
    background: #f2f3f7;
  }

  .search-item {
    border-radius: 8px;
    overflow: hidden;

    .create-search {
      --van-search-background: #e4e9ff;
      --van-search-placeholder-color: #8b9ad6;
      --van-search-input-text-color: #333333;
      --van-search-left-icon-color: #8b9ad6;
    }
  }

  .wf-collapse {
    padding: 0 16px 0;
    margin-top: 4px;
  }

  /* 折叠面板内边距调整 */
  ::v-deep(.van-collapse-item__content) {
    padding-top: 8px;
    padding-bottom: 8px;
  }

  .collapse-title {
    color: #333;
    font-size: 16px;
    font-weight: 600;
  }

  .item {
    margin-bottom: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    &:last-child {
      margin-bottom: 0;
    }

    .r {
      word-break: break-all;
    }

    .icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      margin-right: 16px;
    }

    .name {
      font-size: 16px;
      color: #333;
    }
  }
}
</style>
