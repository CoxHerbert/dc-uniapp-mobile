<template>
  <van-nav-bar title="东创知识库" left-arrow @click-left="onClickLeft" />
  <div class="page-sop-doc dc-sop-doc">
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="contents" v-html="contentHtml"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance } from 'vue';
import { useRoute } from 'vue-router';
import { useRouter } from 'vue-router';
import gql from 'graphql-tag';
import MarkdownIt from 'markdown-it';
import { SOP_DOCS } from '@/constants/sop-docs';

const IMAGE_PREFIX = 'https://wiki.eastwinbip.com';

const apolloClient_ = ref(null);
const md = ref(null);
const contentHtml = ref('');

const route = useRoute();
const router = useRouter();

/** 方法：为 <img> 的相对 src 加前缀（名称与逻辑保持不变） */
function addPrefixToImgSrc(html, prefix) {
  return html.replace(/<img([^>]*)src="([^"]*)"([^>]*)>/gi, (match, before, src, after) => {
    // 跳过已包含前缀或绝对路径的 src
    if (src.startsWith('http') || src.startsWith('data:')) {
      return match;
    }
    return `<img${before}src="${prefix}${src}"${after}>`;
  });
}

/** 方法：查询 SOP 文档（名称与逻辑保持不变） */
async function getSopDoc(id) {
  const idNum = Number.parseInt(String(id ?? ''), 10);
  if (!Number.isFinite(idNum)) {
    contentHtml.value = '未查询到相关文档数据';
    return;
  }

  const result = await apolloClient_.value.query({
    query: gql`
      query ($id: Int!) {
        pages {
          single(id: $id) {
            id
            title
            path
            content
          }
        }
      }
    `,
    variables: { id: idNum },
  });

  const doc = result.data?.pages?.single;
  contentHtml.value = doc?.content
    ? addPrefixToImgSrc(md.value.render(doc.content), IMAGE_PREFIX)
    : '未查询到相关文档数据';
}

/** 方法：初始化 MarkdownIt 并拉取数据（名称与逻辑保持不变） */
function init() {
  const mdInstance = new MarkdownIt({
    html: true, // 允许 HTML 标签
    linkify: true, // 自动转换链接
    typographer: true, // 优化排版（如引号转换）
  });
  md.value = mdInstance;

  const params = route.params;
  getSopDoc(SOP_DOCS[params?.docKey]?.id);
}

/**
 * 返回上一页或首页
 * - 如果浏览历史中有上一页，则后退
 * - 否则跳转到首页（'/'）
 */
function onClickLeft() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
}

/** onMounted：先通过 proxy.apolloClient() 获取客户端，再按原顺序调用 init */
onMounted(async () => {
  const { proxy } = getCurrentInstance();
  apolloClient_.value = await proxy.apolloClient();
  init();
});
</script>

<style lang="scss">
@import url('./doc.css');
.page-sop-doc {
  width: 100%;
  height: auto;
  box-sizing: border-box;
  .title-main {
    display: flex;
    align-items: center;
    align-content: center;
    width: 100%;
    position: fixed;
    z-index: 100;
    left: 0;
    top: 0;
    height: 48px;
    background-color: #fff;
    margin: 0 0 20px 0;
    background-color: #000;
    padding: 0 10px;
    .title {
      display: block;
      color: #fff;
      font-size: 16px;
      font-weight: bold;
      line-height: 16px;
    }
    .icon {
      display: block;
      width: 40px;
      height: 40px;
      margin-right: 8px;
      background-image: url('https://wiki.eastwinbip.com/logo.png');
      background-position: center center;
      background-size: 32px 32px;
      background-repeat: no-repeat;
    }
  }

  .contents {
    display: block;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
  }
}
</style>
