import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'app-theme'
const DEFAULT_THEME = 'default'

// The single source of truth for which themes exist. Adding a new look is as
// simple as adding an entry here and a matching `[data-theme='...']` block in
// src/css/app.scss.
export const AVAILABLE_THEMES = [
  {
    id: 'default',
    name: 'Midnight',
    description: 'The classic dark interface with a purple-to-pink glow.',
    swatch: ['#a855f7', '#ec4899', '#1a1a1a'],
  },
  {
    id: 'holographic',
    name: 'Holographic',
    description: 'A futuristic, neon-cyan holographic command center.',
    swatch: ['#22d3ee', '#38bdf8', '#061a33'],
  },
]

function isValidTheme(id) {
  return AVAILABLE_THEMES.some((theme) => theme.id === id)
}

function readSavedTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return isValidTheme(saved) ? saved : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref(readSavedTheme())
  const availableThemes = ref(AVAILABLE_THEMES)

  // Themes are driven entirely by a `data-theme` attribute on <html>, which CSS
  // variable blocks in app.scss key off of.
  function applyTheme(id) {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', id)
    }
  }

  function setTheme(id) {
    const next = isValidTheme(id) ? id : DEFAULT_THEME
    currentTheme.value = next
    applyTheme(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Persistence is best-effort; the in-memory theme still applies.
    }
  }

  // Re-sync from storage and (re)apply the attribute. Safe to call on app boot
  // or when the settings page mounts.
  function initTheme() {
    setTheme(readSavedTheme())
  }

  return {
    currentTheme,
    availableThemes,
    setTheme,
    initTheme,
  }
})
