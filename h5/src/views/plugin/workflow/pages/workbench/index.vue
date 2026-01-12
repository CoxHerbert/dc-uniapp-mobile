<template>
  <div class="home-container">
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <div class="home-scroll">
        <div class="head-item">
          <div class="title">工作台</div>
          <div class="tips">
            {{ total > 0 ? `目前有${total}个待办事宜` : '目前没有待办事宜, 可以放松一下啦' }}
          </div>
        </div>
        <div class="grid-item">
          <div
            v-for="(item, index) in girdList"
            :key="index"
            class="item"
            @click="handleJump(item)"
          >
            <img :src="homeIcons[item.type] || homeIconFallback" class="icon" alt="" />
            <div class="name">{{ item.name }}</div>
          </div>
        </div>

        <div class="card-item">
          <div class="title">
            <div class="line"></div>
            <van-cell
              class="section-cell"
              title="我的待办"
              is-link
              :border="false"
              @click="handleJump(girdList[0])"
            />
          </div>
        </div>
        <van-list
          v-if="list.length > 0"
          v-model:loading="loading"
          v-model:error="error"
          class="card-list"
          :finished="finished"
          finished-text="没有更多了"
          error-text="请求失败，点击重新加载"
          @load="onLoad"
        >
          <wkf-card :list="list" show-btn @refresh="refreshTodo" />
        </van-list>
        <wf-empty v-else text="暂无数据" />
      </div>
    </van-pull-refresh>
    <van-floating-bubble
      axis="xy"
      magnetic="x"
      :gap="{ x: 16, y: 88 }"
      class="create-bubble"
      @click.stop="handleJump(create)"
    >
      <van-icon name="plus" />
    </van-floating-bubble>
  </div>
</template>
<script>
import { defineComponent } from 'vue';
import { mapState, mapActions } from 'pinia';
import { useWorkflowStore } from '@/store/workflow.js';
import wkfCard from '../../components/wf-card/index.vue';

const homeIconMap = {
  db: new URL('../../static/images/home/icon_db.svg', import.meta.url).href,
  qq: new URL('../../static/images/home/icon_qq.svg', import.meta.url).href,
  yb: new URL('../../static/images/home/icon_yb.svg', import.meta.url).href,
  bj: new URL('../../static/images/home/icon_bj.svg', import.meta.url).href,
};

const homeIconFallback = homeIconMap.db;

export default defineComponent({
  name: 'WorkflowWorkbenchPage',
  components: { wkfCard },
  data() {
    return {
      homeIcons: homeIconMap,
      homeIconFallback,
      create: {
        location: { name: 'WorkflowCreate' },
      },
      girdList: [
        {
          name: '我的待办',
          type: 'db',
          location: { name: 'WorkflowMine', query: { current: '0' } },
        },
        {
          name: '我的请求',
          type: 'qq',
          location: { name: 'WorkflowMine', query: { current: '1' } },
        },
        {
          name: '我的已办',
          type: 'yb',
          location: { name: 'WorkflowMine', query: { current: '2' } },
        },
        {
          name: '办结事宜',
          type: 'bj',
          location: { name: 'WorkflowMine', query: { current: '3' } },
        },
      ],
      page: 1,
      pageSize: 5,
      loading: false,
      finished: false,
      refreshing: false,
      error: false,
    };
  },
  computed: {
    ...mapState(useWorkflowStore, {
      list: (store) => store.todoItems,
      total: (store) => store.todoTotal,
    }),
  },
  mounted() {
    this.onRefresh();
  },
  methods: {
    ...mapActions(useWorkflowStore, ['fetchTodoList']),
    async onRefresh() {
      this.refreshing = true;
      this.loading = false;
      this.finished = false;
      this.error = false;
      this.page = 1;
      try {
        await this.fetchPage(1);
      } catch (error) {
        console.error('[workflow] 下拉刷新待办失败', error);
        this.error = true;
      } finally {
        this.refreshing = false;
        this.loading = false;
      }
    },
    async onLoad() {
      if (this.loading || this.finished) {
        return;
      }
      this.loading = true;
      this.error = false;
      try {
        await this.fetchPage(this.page);
      } catch (error) {
        console.error('[workflow] 加载更多待办失败', error);
        this.error = true;
      } finally {
        this.loading = false;
      }
    },
    async fetchPage(page) {
      const { total = 0 } = await this.fetchTodoList({
        current: page,
        size: this.pageSize,
        append: page > 1,
      });
      this.page = page + 1;
      this.finished = this.list.length >= total;
    },
    refreshTodo() {
      return this.onRefresh();
    },
    handleJump(item) {
      if (!item || !item.location) {
        return;
      }
      const { location } = item;
      const { replace = false, ...locationConfig } = location;
      const navigation = replace ? this.$router.replace : this.$router.push;
      navigation.call(this.$router, locationConfig);
    },
  },
});
</script>
<style>
page {
  background: #f6f6f6;
}
</style>

<style lang="scss" scoped>
.home-container {
  min-height: 100vh;
  background: #f6f6f6;
  box-sizing: border-box;
  padding-bottom: 90px; // 给右下角 + 按钮留空间
  :deep(.wf-card-item:first-child) {
    border-radius: 0 0 8px 8px;
  }
}

.home-scroll {
  min-height: 100%;
}

/* 顶部渐变头部 */
.head-item {
  position: relative;
  padding: 28px 18px 72px;
  background: url('@/views/plugin/workflow/static/images/home/head_bg.png') no-repeat;
  background-size: 100% 100%;
  color: #ffffff;

  .title {
    font-size: 22px;
    font-weight: 600;
    line-height: 1.2;
  }

  .tips {
    margin-top: 14px;
    display: inline-block;
    padding: 4px 16px;
    font-size: 12px;
    line-height: 1.6;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.2); // 接近截图里的蓝色胶囊
    white-space: nowrap;
  }
}

/* 顶部 4 个入口卡片 */
.grid-item {
  position: relative;
  margin: -32px 16px 0; // 往上顶一点，压在头部渐变上
  padding: 16px 8px 10px;
  display: flex;
  justify-content: space-between;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.grid-item .item {
  flex: 1;
  text-align: center;
  padding: 8px 0;
}

.grid-item .icon {
  width: 44px;
  height: 44px;
  margin-bottom: 8px;
}

.grid-item .name {
  font-size: 14px;
  color: #333333;
  font-weight: 600;
}
.card-list {
  margin: 0 16px;
}

/* “我的待办”卡片 */
.card-item {
  margin: 16px 16px 0;
  padding: 12px 16px 0;
  background: #ffffff;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
}

.card-item .title {
  display: flex;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0; // 顶部那条分割线
}

/* 去掉之前左侧那条竖线，更贴近截图 */
.card-item .line {
  display: none;
}

.card-item .section-cell {
  flex: 1;
  padding: 0;
  background: transparent;
  font-size: 14px;
  color: #333333;

  :deep(.van-cell__title) {
    font-size: 18px;
    font-weight: 600; // “我的待办”加粗
  }

  .van-cell__value,
  .van-cell__label {
    display: none;
  }
}

/* 右下角发起流程按钮 */
.create-bubble {
  width: 54px;
  height: 54px;
  z-index: 20;
}
</style>
