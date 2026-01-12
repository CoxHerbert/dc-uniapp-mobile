class Schema {
  constructor(rules = {}) {
    this.rules = rules;
  }

  async validate(source = {}, options = {}) {
    const firstFields = options.firstFields === true;
    const errors = [];
    const fields = {};

    Object.keys(this.rules || {}).forEach((field) => {
      const rawRules = this.rules[field];
      const ruleList = Array.isArray(rawRules) ? rawRules : rawRules ? [rawRules] : [];
      ruleList.forEach((rule) => {
        if (!rule) return;
        const value = source[field];
        const isEmpty = value === undefined || value === null || value === '';
        if (rule.required && isEmpty) {
          const message = rule.message || `${field} is required`;
          const error = { field, message, rule };
          errors.push(error);
          if (!fields[field]) {
            fields[field] = [];
          }
          fields[field].push(error);
        }
      });
    });

    if (errors.length) {
      if (firstFields) {
        const firstError = errors[0];
        return Promise.reject({ errors: [firstError], fields: { [firstError.field]: [firstError] } });
      }
      return Promise.reject({ errors, fields });
    }

    return Promise.resolve(source);
  }
}

export default Schema;
