import { boot } from 'quasar/wrappers'
import mitt from 'mitt'

const eventBus = mitt()

export default boot(({ app }) => {
  // Make event bus available globally
  app.config.globalProperties.$eventBus = eventBus
})

export { eventBus }
