import { boot } from 'quasar/wrappers'
import { createI18n } from 'vue-i18n'
import messages from 'src/i18n'

import { storeToRefs } from 'pinia'

import { useConfigStore } from '../stores/config-store.js'

export default boot(({ app }) => {
  const configStore = useConfigStore()
  const config = storeToRefs(configStore)

  const i18n = createI18n({
    locale: config.locale.value,
    globalInjection: true,
    legacy: false,
    messages
  })

  // Set i18n instance on app
  app.use(i18n)
})
