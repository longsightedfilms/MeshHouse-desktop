module.exports = {
  configureWebpack: {
    resolve: {
      mainFields: ['module', 'main'],
    },
  },
  pluginOptions: {
    i18n: {
      locale: 'en',
      fallbackLocale: 'en',
      localeDir: 'locales',
      enableInSFC: true
    },
    electronBuilder: {
      externals: ['node-notifier', 'electron-store', 'lokijs', 'lokijs-promise', 'jimp', 'axios'],
      nodeModulesPath: ['../../node_modules', './node_modules'],
      builderOptions: {
        appId: 'com.longsightedfilms.meshhouse',
        productName: 'MeshHouse',
        compression: 'maximum',
        asar: true,
        mac: {
          category: 'public.app-category.graphics-design',
          target: 'dmg'
        },
        nsis: {
          oneClick: false,
          installerIcon: './build/icons/icon.ico',
          license: './build/license.txt',
          allowToChangeInstallationDirectory: true
        }
      }
    }
  },

  productionSourceMap: false
}
