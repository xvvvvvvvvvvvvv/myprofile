<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { NConfigProvider, NGlobalStyle, NLayout, NLayoutHeader, NLayoutContent } from 'naive-ui'
import { Vue3Lottie } from 'vue3-lottie'
import TvModal from '@/components/TvModal.vue' 

const isTvOpen = ref(false) 
const isToolboxOpen = ref(false)

// 替换为你实际的本地路径或 URL
import tvAnimation from '@/assets/lottie/tv.json'
import mainBtn from '@/assets/lottie/mainBtn.json'

const handleTVClick = () => {
  isToolboxOpen.value = false 
  isTvOpen.value = true       
}

// ================== 🦞 虾小毛持续话痨引擎 ==================
const currentQuote = ref('')
let speechTimerId: ReturnType<typeof setInterval>

const quotes = [
  "虾扯蛋！又想骗我删库？",
  "本宠物的物理网线早被拔了~",
  "偷偷告诉你，主人又在跑回测了。",
  "别拿鼠标戳我，我只是个对话框！",
  "投机是一门艺术，而不是科学，懂吗",
  "OpenClaw 引擎运转良好，退下吧。",
  "警告！检测到野生访客一枚！",
  "再不点我，我要回沙箱睡觉了 💤",
  "有事找肖伟!别找我"
]

// 随机换一句话（防止连续两次说一样的话）
// 随机换一句话（防止连续两次说一样的话，并解决 TS 类型报错）
const changeQuote = () => {
  // 🌟 在末尾加上 || '' 兜底，告诉 TS 这绝对是个字符串
  let newQuote = quotes[Math.floor(Math.random() * quotes.length)] || ''
  
  while (newQuote === currentQuote.value && quotes.length > 1) {
    newQuote = quotes[Math.floor(Math.random() * quotes.length)] || ''
  }
  
  currentQuote.value = newQuote
}

const startSpeechEngine = () => {
  changeQuote() // 页面一加载，立马开口说话

  // 每隔 5 秒换下一句语录
  speechTimerId = setInterval(() => {
    // 只要电视机没打开，就一直换着花样说话
    if (!isTvOpen.value) { 
      changeQuote()
    }
  }, 5000) 
}

onMounted(() => {
  startSpeechEngine()
})

onUnmounted(() => {
  clearInterval(speechTimerId)
})
</script>

<template>
  <n-config-provider>
    <n-global-style /> 
    <n-layout class="app-layout">
      
      <n-layout-header bordered class="premium-nav-header">
        <div class="header-left">
          <div class="logo">
            <span class="logo-name">Xiao Wei</span><span class="logo-dot">.</span>
          </div>
          <div class="divider"></div>
          <span class="logo-tagline">Architecture & AI Agent</span>
        </div>
        
        <div class="system-status-board">
          <div class="status-indicator">
            <span class="pulse-dot"></span>
            <span class="status-text">OpenClaw: <span class="fw-bold">Online</span></span>
          </div>
          
          <div class="status-divider"></div>
          
          <div class="lobster-trigger" @click="isTvOpen = true" title="唤醒虾小毛">
            <span class="lobster-icon">🦞</span>
            
            <transition name="fade-text" mode="out-in">
              <span class="status-text speech-text" :key="currentQuote">
                {{ currentQuote }}
              </span>
            </transition>
          </div>
        </div>
      </n-layout-header>

      <n-layout-content class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </n-layout-content>

      <div class="floating-toolbox">
        <transition name="pop-up">
          <div v-show="isToolboxOpen" class="tools-list">
            <div class="tool-item" @click="handleTVClick">
              <Vue3Lottie :animationData="tvAnimation" :height="40" :width="40" />
              <span class="tool-tooltip">Openclaw</span>
            </div>
          </div>
        </transition>

        <div 
          class="main-fab" 
          :class="{ 'is-active': isToolboxOpen }"
          @click="isToolboxOpen = !isToolboxOpen"
        >
          <Vue3Lottie :animationData="mainBtn" :height="50" :width="50" />
        </div>
      </div>

    </n-layout>
    <TvModal v-model:show="isTvOpen" />
  </n-config-provider>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;800&family=Fira+Code:wght@500&display=swap');

/* 🌟 饱满感的核心：点阵背景覆盖 */
.app-layout {
  min-height: 100vh;
  background-color: #f8fafc;
  background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
  background-size: 24px 24px;
  font-family: 'Nunito', -apple-system, sans-serif;
  position: relative; 
}

/* ================== 头部全新样式 ================== */
.premium-nav-header {
  padding: 0 5%; 
  height: 70px; 
  display: flex; 
  justify-content: space-between; 
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.logo { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.5px; }
.logo-name { background: linear-gradient(to right, #0f172a, #334155); -webkit-background-clip: text; color: transparent; }
.logo-dot { color: #10b981; }

.divider {
  width: 2px;
  height: 18px;
  background-color: #e2e8f0;
  border-radius: 2px;
}

.logo-tagline {
  font-family: 'Fira Code', monospace; 
  font-size: 13px;
  color: #64748b;
  letter-spacing: 0.5px;
}

/* 🌟 右侧系统状态区 */
.system-status-board {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f1f5f9;
  padding: 6px 16px;
  border-radius: 30px;
  border: 1px solid #e2e8f0;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-text {
  font-family: 'Fira Code', monospace;
  font-size: 12px;
  color: #475569;
  white-space: nowrap; 
}
.status-text .fw-bold {
  color: #0f172a;
  font-weight: 700;
}

/* 🦞 说话时的专属文字样式 */
.speech-text {
  color: #059669; 
  font-weight: 600;
  font-style: italic; 
}

/* 🌟 文字替换的平滑动画 */
.fade-text-enter-active, .fade-text-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.fade-text-enter-from { opacity: 0; transform: translateY(4px); }
.fade-text-leave-to { opacity: 0; transform: translateY(-4px); }

/* 分割线 */
.status-divider {
  width: 1px;
  height: 14px;
  background-color: #cbd5e1;
  margin: 0 4px;
}

/* 小龙虾召唤按钮交互 */
.lobster-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.lobster-trigger:hover {
  background-color: rgba(16, 185, 129, 0.1); 
  transform: translateY(-1px);
}

.lobster-icon {
  font-size: 16px;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.lobster-trigger:hover .lobster-icon {
  transform: scale(1.3) rotate(-15deg);
}

/* 呼吸灯动画 */
.pulse-dot {
  width: 8px;
  height: 8px;
  background-color: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
  animation: pulse-green 2s infinite;
}

@keyframes pulse-green {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.main-content { background: transparent !important; }

/* 页面切换动画 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.fade-enter-from { opacity: 0; transform: translateY(15px); }
.fade-leave-to { opacity: 0; transform: translateY(-15px); }

/* ================== 悬浮工具箱样式 ================== */
.floating-toolbox {
  position: fixed;
  right: 40px;
  bottom: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 999;
}

.tools-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.tool-item {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 24px rgba(31, 38, 135, 0.05);
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tool-item:hover {
  transform: scale(1.1) translateY(-2px);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 12px 32px rgba(37, 99, 235, 0.12);
}

.tool-tooltip {
  position: absolute;
  right: 70px;
  background: #1e293b;
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s ease;
  transform: translateX(10px) scale(0.95);
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.tool-item:hover .tool-tooltip {
  opacity: 1;
  transform: translateX(0) scale(1);
}

.main-fab {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 10px 25px rgba(37, 99, 235, 0.15);
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}
.main-fab:hover {
  box-shadow: 0 15px 35px rgba(37, 99, 235, 0.25);
  transform: scale(1.05);
}
.main-fab.is-active {
  transform: scale(0.95) rotate(15deg);
  box-shadow: 0 5px 15px rgba(37, 99, 235, 0.1);
}

.pop-up-enter-active, .pop-up-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: bottom center;
}
.pop-up-enter-from, .pop-up-leave-to {
  opacity: 0;
  transform: translateY(30px) scale(0.8);
}
</style>