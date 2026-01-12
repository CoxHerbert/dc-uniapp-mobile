const components = import.meta.glob('./**/*.vue', { eager: true });

export default {
  install(app) {
    if (this.installed) return;
    this.installed = true;
    Object.values(components).forEach((config) => {
      const component = config.default || config;
      const componentName = component?.name;
      if (componentName) {
        app.component('wf-' + componentName, component);
      } else if (import.meta.env.DEV) {
        console.warn(`Component ${componentName} is missing name property`);
      }
    });
  },
};
