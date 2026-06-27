import { boot } from 'quasar/wrappers'

// Apply the persisted theme to <html> as early as possible so there is no
// flash of the default theme before the app mounts. The theme store keeps this
// in sync afterwards.
export default boot(() => {
  let theme = 'default'
  try {
    theme = localStorage.getItem('app-theme') || 'default'
  } catch {
    theme = 'default'
  }
  document.documentElement.setAttribute('data-theme', theme)
})
