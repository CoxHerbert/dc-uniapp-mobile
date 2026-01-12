export default {
  mounted(el, binding) {
    const delay = Number(binding.value) || 800;
    el.addEventListener('click', () => {
      if (el.__ac_lock) return;
      el.__ac_lock = true;
      setTimeout(() => (el.__ac_lock = false), delay);
    }, true);
  }
};
