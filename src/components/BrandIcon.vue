<template>
  <div v-if="iconPath" class="brand-icon-wrapper">
    <img
      :src="iconPath"
      :width="size"
      :height="size"
      class="brand-icon"
      :style="{ filter: color === 'white' ? 'brightness(0) invert(1)' : 'none' }"
      alt=""
    />
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

// Import all brand icons dynamically
const brandIcons = import.meta.glob('../assets/icons/brands/*.svg', { eager: true, as: 'url' })

const iconPath = computed(() => {
  if (props.transactionName) {
    const iconFile = constantsStore.getBrandIcon(props.transactionName)
    if (iconFile) {
      // Get the icon path from the glob import
      const iconKey = `../assets/icons/brands/${iconFile}`
      if (brandIcons[iconKey]) {
        return brandIcons[iconKey]
      }
      console.warn(`Brand icon not found: ${iconFile}`)
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
</script>

<style scoped lang="scss">
.brand-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  flex-shrink: 0;
}

.brand-icon {
  display: block;
  width: 100%;
  height: 100%;
  flex-shrink: 0;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>
