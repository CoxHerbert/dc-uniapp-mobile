import { dateFormat } from '../utils/date.js';

export default {
  created() {},
  methods: {
    dateFormat,
    // 获取字段默认值
    getDefaultValues(value) {
      let defaultValue = '';
      if (value.includes('${') && value.includes('}')) {
        try {
          //value = value.replace(/this.\$store.getters.userInfo/g, 'this.userInfo');

          // js解释器已被微信小程序官方禁止，无法解决

          // const interpreter = new Interpreter({
          // 	userInfo: this.userInfo,
          // 	dateFormat
          // })
          // defaultValue = interpreter.evaluate('`' + value + '`')
          defaultValue = '';
          if (value.includes('this.dateFormat')) {
            value = value.replaceAll('Y', 'y').replaceAll('H', 'h').replace('DD', 'dd');
          }

          defaultValue = eval('`' + value.replace(/this|proxy/g, 'this') + '`');
        } catch (err) {
          console.log(err);
          defaultValue = value;
        }
      } else defaultValue = value;

      return defaultValue;
    },
  },
};
