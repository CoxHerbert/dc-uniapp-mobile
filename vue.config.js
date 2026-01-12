const path = require('path')

module.exports = {
  chainWebpack: config => {
    config.module
      .rule('wot-design-uni-ts')
      .test(/\.ts$/)
      .include.add(path.resolve(__dirname, 'node_modules/wot-design-uni'))
      .end()
      .use('strip-type-exports-loader')
      .loader(path.resolve(__dirname, 'build/loaders/strip-type-exports-loader.js'))
  }
}
