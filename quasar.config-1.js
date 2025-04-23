/* eslint-env node */

/*
 * This file runs in a Node context (it's NOT transpiled by Babel), so use only
 * the ES6 features that are supported by your Node version. https://node.green/
 */

// Configuration for your app
// https://v2.quasar.dev/quasar-cli-webpack/quasar-config-js

import ESLintPlugin from 'eslint-webpack-plugin'
import path from 'path'

import { defineConfig } from '#q-app/wrappers'
import { fileURLToPath } from 'node:url'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig((ctx) => {
  return {
    // https://v2.quasar.dev/quasar-cli-webpack/supporting-ts
    supportTS: false,

    // https://v2.quasar.dev/quasar-cli-webpack/prefetch-feature
    // preFetch: true,

    // app boot file (/src/boot)
    // --> boot files are part of "main.js"
    // https://v2.quasar.dev/quasar-cli-webpack/boot-files
    boot: ['axios', 'appconfig', 'i18n'],

    // https://v2.quasar.dev/quasar-cli-webpack/quasar-config-js#Property%3A-css
    css: [
      'app.sass'
    ],

    // https://github.com/quasarframework/quasar/tree/dev/extras
    extras: [
      // 'ionicons-v4',
      // 'mdi-v5',
      // 'fontawesome-v6',
      // 'eva-icons',
      // 'themify',
      // 'line-awesome',
      // 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!

      'roboto-font', // optional, you are not bound to it
      'material-icons', // optional, you are not bound to it
    ],

    // Full list of options: https://v2.quasar.dev/quasar-cli-webpack/quasar-config-js#Property%3A-build
    build: {
      // this is a configuration passed on
      // to the underlying Webpack
      devtool: 'source-map',

      vueRouterMode: 'hash', // available values: 'hash', 'history'

      // transpile: false,
      // publicPath: '/',

      // Add dependencies for transpiling with Babel (Array of string/regex)
      // (from node_modules, which are by default not transpiled).
      // Applies only if "transpile" is set to true.
      // transpileDependencies: [],

      // rtl: true, // https://quasar.dev/options/rtl-support
      // preloadChunks: true,
      // showProgress: false,
      // gzip: true,
      // analyze: true,

      // Options below are automatically set depending on the env, set them if you want to override
      // extractCSS: false,

      // https://v2.quasar.dev/quasar-cli-webpack/handling-webpack
      // "chain" is a webpack-chain object https://github.com/neutrinojs/webpack-chain
      watchOptions: {
        ignored: '**/node_modules',
      },
      extendWebpack (cfg) {
        cfg.module.rules.push({ test: /\.md$/i, type: 'asset/source' })
        cfg.module.rules.push({ test: /\.txt$/i, type: 'asset/source' })
        /*
        cfg.module.rules.push({
          test: /\.svg$/i,
          type: 'asset/inline',
          generator: {
            dataUrl(content) {
              // élimination de 'module export = "' en tête du contenu
              const x = content.toString()
              return x.substring(x.indexOf('data:image'), x.length - 1)
            }
          }
        })
        */
        cfg.module.rules.push({ test: /\.bin$/i, type: 'asset/inline' })
      },
      chainWebpack: chain => {
        chain.module
          .rule('i18n-resource')
          .test(/\.(json5?|ya?ml)$/)
          .include.add(path.resolve(__dirname, './src/i18n'))
          .end()
          .type('javascript/auto')
          .use('i18n-resource')
          .loader('@intlify/vue-i18n-loader')
        chain.module
          .rule('i18n')
          .resourceQuery(/blockType=i18n/)
          .type('javascript/auto')
          .use('i18n')
          .loader('@intlify/vue-i18n-loader')
      }
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-webpack/quasar-config-js#Property%3A-devServer
    devServer: {
      // https: true,
      port: 8081,
      host: 'localhost',
      open: false, // opens browser window automatically
      server: {
        type: 'http',
      }
    },

    // https://v2.quasar.dev/quasar-cli-webpack/quasar-config-js#Property%3A-framework
    framework: {
      config: {
        brand: {
          msgbg: '#010101',
          msgtc: '#FFFF08',
          tbptc: '#82C8E8',
          tbstc: '#82C8E8',
          btnbg: '#1976D2',
          btntc: '#000000',
          btwbg: '#E65100',
          btwtc: '#000000',
          mdtitre: '#64B5F6'
        }
      },

      // iconSet: 'material-icons', // Quasar icon set
      // lang: 'en-US', // Quasar language pack

      // For special cases outside of where the auto-import strategy can have an impact
      // (like functional components as one of the examples),
      // you can manually specify Quasar components/directives to be available everywhere:
      //
      // components: [],
      // directives: [],

      // Quasar plugins
      plugins: ['Dialog']
    },

    // animations: 'all', // --- includes all animations
    // https://quasar.dev/options/animations
    animations: 'all',

    // https://v2.quasar.dev/quasar-cli-webpack/developing-ssr/configuring-ssr

    // https://v2.quasar.dev/quasar-cli-webpack/developing-pwa/configuring-pwa
    pwa: {
      workboxPluginMode: 'InjectManifest', // 'GenerateSW' or 'InjectManifest'
      workboxOptions: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
      }, // only for GenerateSW

      // for the custom service worker ONLY (/src-pwa/custom-service-worker.[js|ts])
      // if using workbox in InjectManifest mode

      chainWebpackCustomSW (chain) {
        chain.plugin('eslint-webpack-plugin')
          .use(ESLintPlugin, [{ extensions: [ 'js' ] }])
      }
    }
  }

})
