<!-- src/views/login/LoginLayout.vue -->
<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();

/**
 * 进入 /login* 时，如果路由 meta.userType 有值而 URL 没带 type，就补齐一次。
 * 这里只做一次性逻辑，不做任何 UI。
 */
onMounted(() => {
  const metaType = route.meta?.userType;
  if (!route.query?.type && metaType) {
    router.replace({
      name: route.name,
      path: route.name ? undefined : route.path,
      query: { ...route.query, type: String(metaType) },
    });
  }
});
</script>
