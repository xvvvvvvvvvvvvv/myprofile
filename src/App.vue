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
      
      <n-layout-header class="premium-nav-header neu-flat">
        <div class="header-left">
          <div class="logo">
            <span class="logo-name">Xiao Wei</span><span class="logo-dot">.</span>
          </div>
          <div class="divider neu-groove"></div>
          <span class="logo-tagline">Architecture & AI Agent</span>
        </div>
        
        <div class="system-status-board neu-inset-panel">
          
          <div class="status-indicator">
            <span class="pulse-dot"></span>
            <span class="status-text">OpenClaw: <span class="fw-bold">Online</span></span>
          </div>
          
          <div class="status-divider neu-groove"></div>
          
          <div class="lobster-trigger neu-btn" @click="isTvOpen = true" title="唤醒虾小毛">
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
            <div class="tool-item neu-btn-round" @click="handleTVClick">
              <Vue3Lottie :animationData="tvAnimation" :height="36" :width="36" />
              <span class="tool-tooltip neu-popup">Openclaw</span>
            </div>
          </div>
        </transition>

        <div 
          class="main-fab neu-btn-round" 
          :class="{ 'is-active': isToolboxOpen }"
          @click="isToolboxOpen = !isToolboxOpen"
        >
          <Vue3Lottie :animationData="mainBtn" :height="46" :width="46" />
        </div>
      </div>

    </n-layout>
    <TvModal v-model:show="isTvOpen" />
  </n-config-provider>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;800&family=Fira+Code:wght@500&display=swap');

/* ================== 全局拟态变量 ================== */
:root {
  --nm-bg: #e0e5ec;        /* 主机面板底色（科技冷灰） */
  --nm-light: #ffffff;     /* 高光色 */
  --nm-dark: #a3b1c6;      /* 阴影色 */
  
  --text-main: #2d3748;
  --text-muted: #718096;
  --accent-green: #10b981;
  --accent-green-dark: #059669;
}

/* ================== 基础布局 ================== */
.app-layout {
  min-height: 100vh;
  background-color: var(--nm-bg);
  font-family: 'Nunito', -apple-system, sans-serif;
  position: relative; 
}
.main-content { background: transparent !important; }

/* ================== 1. 头部导航栏 (底板) ================== */
.premium-nav-header {
  padding: 0 5%; 
  height: 70px; 
  display: flex; 
  justify-content: space-between; 
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: var(--nm-bg) !important;
  /* 头部底部增加一条微凸起的光影，区别于下方内容区 */
  box-shadow: 0 6px 10px -6px var(--nm-dark);
}

.header-left { display: flex; align-items: center; gap: 16px; }
.logo { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.5px; }
.logo-name { color: var(--text-main); text-shadow: 1px 1px 1px var(--nm-light); }
.logo-dot { color: var(--accent-green); }

.logo-tagline {
  font-family: 'Fira Code', monospace; 
  font-size: 13px;
  color: var(--text-muted);
  letter-spacing: 0.5px;
}

/* ================== 2. 遥控器核心仪表盘 ================== */
.system-status-board {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 6px 6px 16px;
  border-radius: 40px;
}

/* 内凹的仪表盘凹槽 */
.neu-inset-panel {
  background: var(--nm-bg);
  box-shadow: 
    inset 6px 6px 12px var(--nm-dark),
    inset -6px -6px 12px var(--nm-light);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 拟态 LED 指示灯：嵌在孔里的发光二极管 */
.pulse-dot {
  width: 10px;
  height: 10px;
  background-color: var(--accent-green);
  border-radius: 50%;
  /* 内阴影塑造玻璃灯泡感，外阴影塑造底座孔洞感 */
  box-shadow: 
    inset 2px 2px 4px rgba(255,255,255,0.6),
    inset -2px -2px 4px rgba(0,0,0,0.2),
    0 0 8px rgba(16, 185, 129, 0.6);
  animation: pulse-neu 2.5s infinite;
}

@keyframes pulse-neu {
  0% { box-shadow: inset 2px 2px 4px rgba(255,255,255,0.6), inset -2px -2px 4px rgba(0,0,0,0.2), 0 0 2px rgba(16, 185, 129, 0.4); }
  50% { box-shadow: inset 2px 2px 4px rgba(255,255,255,0.8), inset -2px -2px 4px rgba(0,0,0,0.2), 0 0 12px rgba(16, 185, 129, 0.8); }
  100% { box-shadow: inset 2px 2px 4px rgba(255,255,255,0.6), inset -2px -2px 4px rgba(0,0,0,0.2), 0 0 2px rgba(16, 185, 129, 0.4); }
}

.status-text {
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  color: var(--text-muted);
  white-space: nowrap; 
}
.status-text .fw-bold { color: var(--text-main); font-weight: 700; }

/* 小龙虾呼唤物理按键 */
.lobster-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 30px;
}

/* 凸起的物理胶囊按钮 */
.neu-btn {
  background: var(--nm-bg);
  box-shadow: 
    4px 4px 8px var(--nm-dark),
    -4px -4px 8px var(--nm-light);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

/* 按下遥控器按钮的物理反馈 */
.neu-btn:hover, .neu-btn:active {
  box-shadow: 
    inset 3px 3px 6px var(--nm-dark),
    inset -3px -3px 6px var(--nm-light);
  color: var(--accent-green-dark);
}

.lobster-icon { font-size: 16px; transition: transform 0.3s ease; }
.neu-btn:hover .lobster-icon { transform: scale(1.15) rotate(-10deg); }

.speech-text {
  color: var(--accent-green-dark); 
  font-weight: 700;
  font-style: italic; 
}

/* 拟态刻线（用于分割线） */
.neu-groove {
  width: 2px;
  height: 18px;
  background: transparent;
  box-shadow: 
    inset 1px 1px 2px var(--nm-dark),
    inset -1px -1px 2px var(--nm-light);
  border-radius: 2px;
}
.status-divider { margin: 0 4px; height: 16px; }


/* ================== 3. 悬浮工具箱 ================== */
.floating-toolbox {
  position: fixed;
  right: 40px;
  bottom: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 999;
}

.tools-list { display: flex; flex-direction: column; gap: 20px; margin-bottom: 25px; }

/* 圆形/方圆形通用悬浮物理按钮 */
.neu-btn-round {
  background: var(--nm-bg);
  box-shadow: 
    6px 6px 12px var(--nm-dark),
    -6px -6px 12px var(--nm-light);
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.neu-btn-round:active {
  box-shadow: 
    inset 4px 4px 8px var(--nm-dark),
    inset -4px -4px 8px var(--nm-light);
}

.tool-item {
  width: 50px;
  height: 50px;
  border-radius: 16px;
}

/* 主控悬浮按钮 */
.main-fab {
  width: 64px;
  height: 64px;
  border-radius: 50%;
}

.main-fab.is-active {
  /* 开启时深深陷进去 */
  box-shadow: 
    inset 6px 6px 12px var(--nm-dark),
    inset -6px -6px 12px var(--nm-light);
  transform: scale(0.95);
}

/* 拟态提示框 */
.neu-popup {
  position: absolute;
  right: 70px;
  background: var(--nm-bg);
  color: var(--text-main);
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s ease;
  transform: translateX(10px);
  white-space: nowrap;
  box-shadow: 
    4px 4px 10px var(--nm-dark),
    -4px -4px 10px var(--nm-light);
}

.tool-item:hover .neu-popup {
  opacity: 1;
  transform: translateX(0);
}


/* ================== 动画 ================== */
.fade-text-enter-active, .fade-text-leave-active { transition: opacity 0.4s ease, transform 0.4s ease; }
.fade-text-enter-from { opacity: 0; transform: translateY(4px); }
.fade-text-leave-to { opacity: 0; transform: translateY(-4px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.fade-enter-from { opacity: 0; transform: translateY(15px); }
.fade-leave-to { opacity: 0; transform: translateY(-15px); }

.pop-up-enter-active, .pop-up-leave-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); transform-origin: bottom center; }
.pop-up-enter-from, .pop-up-leave-to { opacity: 0; transform: translateY(30px) scale(0.8); }


/* ================== 4. 移动端适配 ================== */
@media screen and (max-width: 768px) {
  .premium-nav-header { padding: 0 16px; height: 60px; }
  .logo-tagline, .header-left .divider { display: none; }
  
  .system-status-board { padding: 4px 6px 4px 12px; gap: 8px; }
  .status-text:not(.speech-text), .status-divider { display: none; }
  
  .lobster-trigger { padding: 6px 12px; }
  .speech-text { max-width: 120px; overflow: hidden; text-overflow: ellipsis; font-size: 12px; }
  
  .floating-toolbox { right: 20px; bottom: max(20px, env(safe-area-inset-bottom)); }
  .neu-popup { display: none !important; }
  
  .main-fab { width: 56px; height: 56px; }
  .tool-item { width: 46px; height: 46px; }
}

@media screen and (max-width: 400px) {
  .speech-text { display: none; }
  .system-status-board { padding: 6px; }
  .lobster-trigger { padding: 8px; border-radius: 50%; }
}
</style>
