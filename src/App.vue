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
      
      <n-layout-header class="premium-nav-header neu-panel-raised">
        <div class="header-left">
          <div class="logo">
            <span class="logo-name">Xiao Wei</span><span class="logo-dot">.</span>
          </div>
          <span class="logo-tagline">Architecture & AI Agent</span>
        </div>
        
        <div class="system-status-board">
          
          <div class="status-indicator-socket neu-socket">
            <span class="status-indicator">
              <span class="pulse-dot"></span>
              <span class="status-text">OpenClaw: <span class="fw-bold">Online</span></span>
            </span>
          </div>
          
          <div class="lobster-trigger neu-btn-pill" @click="isTvOpen = true" title="唤醒虾小毛">
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
              <span class="tool-tooltip neu-panel-raised-sm">Openclaw</span>
            </div>
          </div>
        </transition>

        <div 
          class="main-fab neu-btn-round-lg" 
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
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Fira+Code:wght@500&display=swap');

/* ================== 🌟 核心拟态 CSS 变量 (基于图片的哑光冷灰) 🌟 ================== */
:root {
  /* 使用完美的冷灰底色，确保和按钮阴影混合自然 */
  --nm-bg: #e6e6e6;        
  --nm-light: #ffffff;     /* 左上角高光色 */
  --nm-dark: #bebebe;      /* 右下角深部阴影色 */
  
  --text-main: #333333;    /* 复制图片的硬朗文字颜色 */
  --text-muted: #666666;
  --accent-green-soft: #059669; /* 软化原先的刺眼绿色 */
}

/* ================== 布局基板 ================== */
.app-layout {
  min-height: 100vh;
  background-color: var(--nm-bg);
  font-family: 'Nunito', -apple-system, sans-serif;
  position: relative; 
}
.main-content { background: transparent !important; }

/* ================== 🌟 拟态核心原子类 (关键阴影控制) ================== */

/* 原子类1：外凸实体质感 (Raised Neumorphism) - 用于头部、按键 */
.neu-panel-raised {
  background-color: var(--nm-bg);
  box-shadow: 
    6px 6px 12px var(--nm-dark),
    -6px -6px 12px var(--nm-light);
}
.neu-panel-raised-sm {
  background-color: var(--nm-bg);
  box-shadow: 
    3px 3px 6px var(--nm-dark),
    -3px -3px 6px var(--nm-light);
}

/* 原子类2：内凸陷质感 (Socket Neumorphism) - 用于显示插槽 */
.neu-socket {
  background-color: var(--nm-bg);
  box-shadow: 
    inset 4px 4px 8px var(--nm-dark),
    inset -4px -4px 8px var(--nm-light);
}

/* 原子类3：物理交互按键基础 - 复制图片的扎实物理错觉 */
.neu-btn-pill, .neu-btn-round, .neu-btn-round-lg {
  background-color: var(--nm-bg);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  /* 复制图片的 heavy but soft 阴影 */
  box-shadow: 
    6px 6px 16px var(--nm-dark),
    -6px -6px 16px var(--nm-light);
}

/* 原子类4：物理按压反馈 - 瞬间凹陷，给予强烈的物理确认感 */
.neu-btn-pill:hover, .neu-btn-round:hover,
.neu-btn-pill:active, .neu-btn-round:active {
  box-shadow: 
    inset 4px 4px 8px var(--nm-dark),
    inset -4px -4px 8px var(--nm-light);
}


/* ================== 1. 头部导航栏设计 ================== */
.premium-nav-header {
  padding: 0 5%; 
  height: 70px; 
  display: flex; 
  justify-content: space-between; 
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  border: none !important; /* 移除 naive UI 默认描边 */
  border-radius: 0 0 20px 20px; /* 底部稍微圆角，更有实体感 */
}

.header-left { display: flex; align-items: center; gap: 16px; }
.logo { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.5px; }
.logo-name { color: var(--text-main); }
.logo-dot { color: var(--accent-green-soft); }

.logo-tagline {
  font-family: 'Fira Code', monospace; 
  font-size: 13px;
  color: var(--text-muted);
  letter-spacing: 0.5px;
}

/* ================== 2. 遥控器仪表盘区域设计 ================== */
.system-status-board {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 拟态显示插槽 (socket) */
.status-indicator-socket {
  padding: 8px 16px;
  border-radius: 20px;
}
.status-indicator { display: flex; align-items: center; gap: 8px; }

/* 拟态 LED 指示灯：嵌在孔里的发光二极管 */
.pulse-dot {
  width: 10px;
  height: 10px;
  background-color: var(--accent-green-soft);
  border-radius: 50%;
  /* 塑造嵌孔质感 */
  box-shadow: 
    inset 1px 1px 2px rgba(0,0,0,0.2),
    0 0 8px rgba(16, 185, 129, 0.4);
  animation: pulse-neu 2.5s infinite;
}
@keyframes pulse-neu {
  0% { box-shadow: inset 1px 1px 2px rgba(0,0,0,0.2), 0 0 2px rgba(16, 185, 129, 0.2); }
  50% { box-shadow: inset 1px 1px 2px rgba(0,0,0,0.2), 0 0 10px rgba(16, 185, 129, 0.6); }
  100% { box-shadow: inset 1px 1px 2px rgba(0,0,0,0.2), 0 0 2px rgba(16, 185, 129, 0.2); }
}

.status-text {
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  color: var(--text-muted);
  white-space: nowrap; 
}
.status-text .fw-bold { color: var(--text-main); font-weight: 700; }

/* 🦞 虾小毛呼唤按键 (核心拟态) */
.lobster-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  border-radius: 40px; /* 完美的物理胶囊 */
}

.lobster-icon { font-size: 18px; transition: transform 0.3s ease; }
/* monochrome 质感： emoji 稍微柔和化处理 */
.lobster-trigger:hover .lobster-icon { transform: scale(1.1) rotate(-8deg); }

.speech-text {
  color: var(--accent-green-soft); 
  font-weight: 700;
  font-style: italic; 
}


/* ================== 3. 悬浮工具箱设计 ================== */
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

/* 子工具按键 */
.tool-item {
  width: 50px;
  height: 50px;
  border-radius: 16px;
}

/* 主主控悬浮球 */
.main-fab {
  width: 68px;
  height: 68px;
  border-radius: 50%;
}
.main-fab.is-active {
  /* 开启时深深陷进去 */
  box-shadow: 
    inset 6px 6px 12px var(--nm-dark),
    inset -6px -6px 12px var(--nm-light);
  transform: scale(0.95);
}

/* 子工具提示框 */
.neu-popup {
  position: absolute;
  right: 75px;
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
}
.tool-item:hover .neu-popup {
  opacity: 1;
  transform: translateX(0);
}


/* ================== 动画定义 ================== */
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
  .premium-nav-header { padding: 0 16px; height: 60px; border-radius: 0 0 15px 15px; }
  .logo-tagline { display: none; }
  
  .system-status-board { padding: 4px; gap: 8px; }
  .status-text:not(.speech-text), .status-indicator-socket { display: none; }
  
  .lobster-trigger { padding: 8px 14px; }
  .speech-text { max-width: 120px; overflow: hidden; text-overflow: ellipsis; font-size: 12px; }
  
  .floating-toolbox { right: 20px; bottom: max(20px, env(safe-area-inset-bottom)); }
  .neu-popup { display: none !important; }
  
  .main-fab { width: 56px; height: 56px; }
  .tool-item { width: 46px; height: 46px; }
}

@media screen and (max-width: 400px) {
  .speech-text { display: none; }
  .lobster-trigger { padding: 10px; border-radius: 50%; }
}
</style>
