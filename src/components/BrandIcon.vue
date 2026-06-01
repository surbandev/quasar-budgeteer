<template>
  <div v-if="iconPath" class="brand-icon-wrapper">
    <img :src="iconPath" :width="size" :height="size" class="brand-icon" alt="" />
  </div>
  <q-icon v-else :name="fallbackIcon" :size="size" :color="color" />
</template>

<script setup>
import { computed } from 'vue'
import { useConstantsStore } from '../stores/constants'

const props = defineProps({
  transactionName: {
    type: String,
    default: null,
  },
  category: {
    type: String,
    default: null,
  },
  size: {
    type: [String, Number],
    default: '20px',
  },
  color: {
    type: String,
    default: 'white',
  },
})

const constantsStore = useConstantsStore()

/** Normalize Vite glob entries to a URL string (dev vs production differ). */
function resolveGlobAsset(entry) {
  if (!entry) return null
  if (typeof entry === 'string') return entry
  let value = entry.default ?? entry
  if (typeof value === 'function') value = value()
  return typeof value === 'string' ? value : null
}

function resolveGlobMap(globResult) {
  return Object.fromEntries(
    Object.entries(globResult).map(([key, value]) => [key, resolveGlobAsset(value)]),
  )
}

// Import all brand icons dynamically (SVG, PNG, JPEG, and JPG)
const brandIconsSvg = resolveGlobMap(
  import.meta.glob('../assets/icons/brands/*.svg', { eager: true, query: '?url', import: 'default' }),
)
const brandIconsPng = resolveGlobMap(
  import.meta.glob('../assets/*.png', { eager: true, query: '?url', import: 'default' }),
)
const brandIconsJpeg = resolveGlobMap(
  import.meta.glob('../assets/*.{jpeg,jpg,JPG}', { eager: true, query: '?url', import: 'default' }),
)

const iconPath = computed(() => {
  // First try to get icon by transaction name
  if (props.transactionName) {
    const iconFile = constantsStore.getBrandIcon(props.transactionName)
    if (iconFile) {
      // Check if it's a PNG file (like Experian.png)
      if (iconFile.endsWith('.png')) {
        // Try different path formats for PNG files
        const possibleKeys = [
          `../assets/${iconFile}`,
          `./assets/${iconFile}`,
          `/src/assets/${iconFile}`,
        ]

        for (const key of possibleKeys) {
          const url = brandIconsPng[key]
          if (url) return url
        }

        // If exact match doesn't work, try to find by filename
        const iconFileName = iconFile.toLowerCase().replace('.png', '')
        for (const [key, url] of Object.entries(brandIconsPng)) {
          if (url && key.toLowerCase().includes(iconFileName)) {
            return url
          }
        }
      } else if (iconFile.endsWith('.jpeg') || iconFile.endsWith('.jpg')) {
        // Try different path formats for JPEG files
        const possibleKeys = [
          `../assets/${iconFile}`,
          `./assets/${iconFile}`,
          `/src/assets/${iconFile}`,
        ]

        for (const key of possibleKeys) {
          const url = brandIconsJpeg[key]
          if (url) return url
        }

        // If exact match doesn't work, try to find by filename
        const iconFileName = iconFile.toLowerCase().replace('.jpeg', '').replace('.jpg', '')
        for (const [key, url] of Object.entries(brandIconsJpeg)) {
          if (url && key.toLowerCase().includes(iconFileName)) {
            return url
          }
        }
      } else {
        // Handle SVG files
        const possibleKeys = [
          `../assets/icons/brands/${iconFile}`,
          `./assets/icons/brands/${iconFile}`,
          `/src/assets/icons/brands/${iconFile}`,
        ]

        for (const key of possibleKeys) {
          const url = brandIconsSvg[key]
          if (url) return url
        }

        // If exact match doesn't work, try to find by filename
        const iconFileName = iconFile.toLowerCase().replace('.svg', '')
        for (const [key, url] of Object.entries(brandIconsSvg)) {
          if (url && key.toLowerCase().includes(iconFileName)) {
            return url
          }
        }
      }

      console.warn(`Brand icon not found: ${iconFile}`)
    }
  }

  // If no icon found by transaction name, try category
  if (props.category) {
    const iconFile = constantsStore.getBrandIconByCategory(props.category)
    if (iconFile) {
      // Check if it's a PNG file
      if (iconFile.endsWith('.png') || iconFile.endsWith('.PNG')) {
        // Try assets directory first
        const possibleKeys = [
          `../assets/${iconFile}`,
          `./assets/${iconFile}`,
          `/src/assets/${iconFile}`,
        ]

        for (const key of possibleKeys) {
          const url = brandIconsPng[key]
          if (url) return url
        }

        // Fallback: search by filename
        const iconFileName = iconFile.toLowerCase().replace('.png', '')
        for (const [key, url] of Object.entries(brandIconsPng)) {
          if (url && key.toLowerCase().includes(iconFileName)) {
            return url
          }
        }
      } else if (
        iconFile.endsWith('.jpeg') ||
        iconFile.endsWith('.jpg') ||
        iconFile.endsWith('.JPG') ||
        iconFile.endsWith('.JPEG')
      ) {
        const possibleKeys = [
          `../assets/${iconFile}`,
          `./assets/${iconFile}`,
          `/src/assets/${iconFile}`,
        ]

        for (const key of possibleKeys) {
          const url = brandIconsJpeg[key]
          if (url) return url
        }

        const iconFileName = iconFile
          .toLowerCase()
          .replace('.jpeg', '')
          .replace('.jpg', '')
          .replace('.jpg', '')
        for (const [key, url] of Object.entries(brandIconsJpeg)) {
          if (url && key.toLowerCase().includes(iconFileName)) {
            return url
          }
        }
      } else if (iconFile.endsWith('.svg')) {
        // Handle SVG files from brands directory
        const possibleKeys = [
          `../assets/icons/brands/${iconFile}`,
          `./assets/icons/brands/${iconFile}`,
          `/src/assets/icons/brands/${iconFile}`,
        ]

        for (const key of possibleKeys) {
          const url = brandIconsSvg[key]
          if (url) return url
        }

        const iconFileName = iconFile.toLowerCase().replace('.svg', '')
        for (const [key, url] of Object.entries(brandIconsSvg)) {
          if (url && key.toLowerCase().includes(iconFileName)) {
            return url
          }
        }
      }
    }
  }

  return null
})

const fallbackIcon = computed(() => {
  if (props.category) {
    return constantsStore.getCategoryIcon(props.category)
  }
  return 'receipt'
})

// Expose whether a brand icon exists
defineExpose({
  hasBrandIcon: computed(() => iconPath.value !== null),
})
</script>

<style scoped lang="scss">
.brand-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
}

.brand-icon {
  display: block;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(1.15);
  width: 100%;
  height: 100%;
  flex-shrink: 0;
  object-fit: cover;
  object-position: center;
  border-radius: 50%;
}
</style>
