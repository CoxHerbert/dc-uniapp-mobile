import { validateNull, validData, deepClone, findObject } from './util/index.js';

const prototypes = {
  validateNull,
  validData,
  deepClone,
  findObject,
};

const componentModules = import.meta.glob('./components/**/*.vue', { eager: true });
const components = Object.values(componentModules)
  .map((module) => module?.default)
  .filter((component) => component && (component.name || component.__name));

export default {
  install(app) {
    components.forEach((component) => {
      const name = component.name || component.__name;
      if (name) {
        app.component(name, component);
      }
    });

    const target = app.config?.globalProperties;
    Object.keys(prototypes).forEach((key) => {
      if (target) {
        target[key] = prototypes[key];
      }
      // if (typeof uni !== 'undefined' && uni.$u) {
      //   uni.$u[key] = prototypes[key];
      // }
    });
  },
  author: 'SSC',
  version: '1.4.0',
};
