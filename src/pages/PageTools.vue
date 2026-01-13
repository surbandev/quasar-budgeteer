<template>
  <q-page class="tools-page">
    <!-- Background animations -->
    <div class="background-scene">
      <div class="stars"></div>

      <div class="math-equations">
        <div class="equation equation-1">∫ f(x)dx = F(x) + C</div>
        <div class="equation equation-2">e^(iπ) + 1 = 0</div>
        <div class="equation equation-3">∇ × E = -∂B/∂t</div>
        <div class="equation equation-4">∑(n=1→∞) 1/n² = π²/6</div>
      </div>
    </div>

    <div class="tools-container">
      <h2 class="tools-title">Tools</h2>

      <div class="tools-layout">
        <!-- Tools row: Profile Settings, User Settings, Feedback, Slice -->
        <div class="tools-top-row">
          <div class="tool-bubble" @click="goToProfileSettings">
            <q-icon name="person" class="tool-icon" />
            <span class="tool-name">Profile Settings</span>
          </div>

          <div class="tool-bubble" @click="goToUserSettings">
            <q-icon name="settings" class="tool-icon" />
            <span class="tool-name">User Settings</span>
          </div>

          <div class="tool-bubble" @click="goToFeedback">
            <q-icon name="chat_bubble" class="tool-icon" />
            <span class="tool-name">Feedback</span>
          </div>

          <div class="tool-bubble" @click="goToSlice">
            <q-icon name="pie_chart" class="tool-icon" />
            <span class="tool-name">Slice</span>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goToFeedback() {
  router.push('/feedback')
}

function goToProfileSettings() {
  router.push('/profile-settings')
}

function goToUserSettings() {
  router.push('/user-settings')
}

function goToSlice() {
  router.push('/slice')
}
</script>

<style scoped lang="scss">
.tools-page {
  padding: 2rem 1rem;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.background-scene {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);
}

.stars {
  display: none;
}

.math-equations {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.equation {
  position: absolute;
  font-family: 'Times New Roman', serif;
  font-size: 1.2rem;
  font-weight: 300;
  background: linear-gradient(
    135deg,
    #667eea 0%,
    #764ba2 25%,
    #f093fb 50%,
    #f5576c 75%,
    #4facfe 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  opacity: 0;
  transform: scale(0.8);
  white-space: nowrap;
  text-shadow:
    0 0 30px rgba(102, 126, 234, 0.6),
    0 0 40px rgba(118, 75, 162, 0.4),
    0 0 50px rgba(240, 147, 251, 0.3);
}

.equation-1 {
  top: 15%;
  left: 10%;
  animation: equationFade 8s ease-in-out infinite 0s;
}
.equation-2 {
  top: 25%;
  right: 15%;
  animation: equationFade 8s ease-in-out infinite 1s;
}
.equation-3 {
  top: 65%;
  left: 15%;
  animation: equationFade 8s ease-in-out infinite 2s;
}
.equation-4 {
  top: 85%;
  right: 15%;
  animation: equationFade 8s ease-in-out infinite 3s;
}

@keyframes equationFade {
  0% {
    opacity: 0;
    transform: scale(0.8) rotate(-2deg);
  }
  25% {
    opacity: 0.4;
    transform: scale(1) rotate(0deg);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1) rotate(1deg);
  }
  75% {
    opacity: 0.4;
    transform: scale(1) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: scale(0.8) rotate(-2deg);
  }
}

.tools-container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.tools-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin: 0 0 3rem 0;
  text-align: center;
  letter-spacing: -0.5px;
}

.tools-layout {
  display: flex;
  flex-direction: column;
  gap: 4rem;
  align-items: center;
  padding: 2rem 1rem;
  max-width: 1000px;
  margin: 0 auto;
}

.tools-top-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4rem;
  width: 100%;
  flex-wrap: wrap;
}

.tool-bubble {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 1rem;

  &:hover {
    transform: translateY(-8px);

    .tool-icon {
      transform: scale(1.15);
    }

    .tool-name {
      color: rgba(255, 255, 255, 1);
    }
  }

  &:active {
    transform: translateY(-4px);
  }
}

.tool-icon {
  font-size: 96px !important;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
  color: white;
}

.tool-name {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  font-weight: 500;
  text-align: center;
  transition: color 0.3s ease;
  white-space: nowrap;
}

// Desktop optimizations
@media (min-width: 1024px) {
  .tools-layout {
    gap: 5rem;
    padding: 2rem;
  }

  .tools-top-row {
    gap: 6rem;
  }
}

@media (max-width: 768px) {
  .tools-page {
    padding: 1.5rem 0.5rem;
  }

  .tools-title {
    font-size: 2rem;
    margin: 0 0 2rem 0;
  }

  .tools-layout {
    gap: 3rem;
    padding: 1rem 0.5rem;
  }

  .tools-top-row {
    gap: 2rem;
    flex-wrap: wrap;
  }

  .tool-icon {
    font-size: 72px !important;
  }

  .tool-name {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .tools-top-row {
    gap: 1.5rem;
  }

  .tool-icon {
    font-size: 64px !important;
  }

  .tool-name {
    font-size: 0.85rem;
  }
}
</style>
