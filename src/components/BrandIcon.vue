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

// Import all brand icons dynamically (SVG, PNG, JPEG, and JPG)
const brandIconsSvg = import.meta.glob('../assets/icons/brands/*.svg', { eager: true, as: 'url' })
const brandIconsPng = import.meta.glob('../assets/*.png', { eager: true, as: 'url' })
const brandIconsJpeg = import.meta.glob('../assets/*.{jpeg,jpg,JPG}', { eager: true, as: 'url' })

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
          if (brandIconsPng[key]) {
            return brandIconsPng[key]
          }
        }

        // If exact match doesn't work, try to find by filename
        const iconFileName = iconFile.toLowerCase().replace('.png', '')
        for (const [key, value] of Object.entries(brandIconsPng)) {
          if (key.toLowerCase().includes(iconFileName)) {
            return value
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
          if (brandIconsJpeg[key]) {
            return brandIconsJpeg[key]
          }
        }

        // If exact match doesn't work, try to find by filename
        const iconFileName = iconFile.toLowerCase().replace('.jpeg', '').replace('.jpg', '')
        for (const [key, value] of Object.entries(brandIconsJpeg)) {
          if (key.toLowerCase().includes(iconFileName)) {
            return value
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
          if (brandIconsSvg[key]) {
            return brandIconsSvg[key]
          }
        }

        // If exact match doesn't work, try to find by filename
        const iconFileName = iconFile.toLowerCase().replace('.svg', '')
        for (const [key, value] of Object.entries(brandIconsSvg)) {
          if (key.toLowerCase().includes(iconFileName)) {
            return value
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
          if (brandIconsPng[key]) {
            return brandIconsPng[key]
          }
        }

        // Fallback: search by filename
        const iconFileName = iconFile.toLowerCase().replace('.png', '')
        for (const [key, value] of Object.entries(brandIconsPng)) {
          if (key.toLowerCase().includes(iconFileName)) {
            return value
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
          if (brandIconsJpeg[key]) {
            return brandIconsJpeg[key]
          }
        }

        const iconFileName = iconFile
          .toLowerCase()
          .replace('.jpeg', '')
          .replace('.jpg', '')
          .replace('.jpg', '')
        for (const [key, value] of Object.entries(brandIconsJpeg)) {
          if (key.toLowerCase().includes(iconFileName)) {
            return value
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
          if (brandIconsSvg[key]) {
            return brandIconsSvg[key]
          }
        }

        const iconFileName = iconFile.toLowerCase().replace('.svg', '')
        for (const [key, value] of Object.entries(brandIconsSvg)) {
          if (key.toLowerCase().includes(iconFileName)) {
            return value
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
