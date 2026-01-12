import { useAuthStore } from '../store/auth';

export default {
  mounted(el, binding) {
    const need = binding.value;
    if (!need) return;
    // 在挂载时检测权限，未授权则移除元素
    const auth = useAuthStore();
    if (!auth.hasPerm(need)) {
      el.parentNode && el.parentNode.removeChild(el);
    }
  }
};
