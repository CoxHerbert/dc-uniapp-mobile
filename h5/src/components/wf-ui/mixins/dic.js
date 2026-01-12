import { DIC_PROPS } from '../util/variable.js';
export default {
  methods: {
    async handleDic(column) {
      let { dicData, dicUrl, prop, props, cascader, dataType } = column;
      props = { ...DIC_PROPS, ...props };
      let remoteDic = [];
      let localeDic = dicData || [];
      if (!this.validateNull(cascader)) {
        this.$watch(`form.${prop}`, (val) => {
          if (!val) return;
          cascader.forEach(async (c) => {
            let col = this.deepClone(this.findObject(this.option.column, c));
            if (col != -1) {
              let url = col.dicUrl;
              let cascaderKey = url.match(/[^\{\}]+(?=\})/g);
              if (url && cascaderKey) {
                cascaderKey.forEach((key) => {
                  if (key === 'key') {
                    url = url.replace('{{key}}', val);
                  } else {
                    url = url.replace(`{{${key}}}`, this.form[key]);
                  }
                });
                col.dicUrl = url;
              }

              let query = col.dicQuery;
              if (query) {
                for (let key in query) {
                  cascaderKey = query[key].match(/[^\{\}]+(?=\})/g);
                  if (cascaderKey) {
                    cascaderKey.forEach((key) => {
                      if (key === 'key') {
                        query[key] = query[key].replace('{{key}}', val);
                      } else {
                        query[key] = query[key].replace(`{{${key}}}`, this.form[key]);
                      }
                    });
                  }
                }
                col.dicQuery = query;
              }
              const res = await this.handleDictHttp(col);
              if (res) {
                this.dic[col.prop] = res;
                if (!this.validateNull(res) && !this.validateNull(col.cascaderIndex)) {
                  try {
                    this.form[col.prop] = res[col.cascaderIndex][props.value];
                  } catch (e) {
                    this.form[col.prop] = '';
                  }
                } else this.form[col.prop] = '';
              }
            }
          });
        });
      }
      if (dicUrl) {
        const cascaderKey = dicUrl.match(/[^\{\}]+(?=\})/g);
        if (cascaderKey) return localeDic;
        remoteDic = await this.handleDictHttp(column);
      }
      let dic = Object.assign(remoteDic, localeDic);
      if (dataType == 'string') {
        let valueKey = props && props.value ? props.value : 'value';
        let childrenKey = props && props.children ? props.children : 'children';
        this._handleDic(dic, valueKey, childrenKey);
      }
      return dic;
    },
    async handleDictHttp(column) {
      let remoteDic = [];
      let { dicUrl, dicMethod, dicQuery, dicFormatter } = column;
      if (!dicMethod) dicMethod = 'get';
      const method = dicMethod.toLowerCase() === 'post' ? 'POST' : 'GET';
      const param = {
        url: dicUrl,
        method,
      };
      if (method == 'POST') param.data = dicQuery;
      else param.params = dicQuery;
      const res = await this.$http.request(param);
      remoteDic =
        typeof dicFormatter == 'function'
          ? res.data.records || dicFormatter(res)
          : res.data || res.data.records || res.data.data.records;

      return remoteDic;
    },
    _handleDic(list, valueKey, childrenKey) {
      if (!list) return;
      list.forEach((item) => {
        item[valueKey] = item[valueKey] + '';
        if (!this.validateNull(item[childrenKey])) {
          this._handleDic(item[childrenKey], valueKey, childrenKey);
        }
      });
    },
  },
};
