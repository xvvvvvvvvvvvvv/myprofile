<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { marked } from 'marked'  
import { 
  NSpace, NTag, NTimeline, NTimelineItem, NGrid, NGi, NCard, NSpin
} from 'naive-ui'
import { Vue3Lottie } from 'vue3-lottie'

// ================= 引入本地 Lottie JSON 动画文件 =================
import heroAnimation from '@/assets/lottie/hero.json'
import iconAbout from '@/assets/lottie/about.json'
import iconTech from '@/assets/lottie/tech.json'
import iconExp from '@/assets/lottie/experience.json'
import iconProject from '@/assets/lottie/project.json'
import iconExplore from '@/assets/lottie/explore.json'

// ================= 类型定义 =================
interface Skill {
  id: number; name: string; icon_url: string; bg_color: string; text_color: string;
}
interface Experience {
  id: number; company: string; duration: string; description: string; timeline_type: 'default' | 'info' | 'success' | 'warning' | 'error';
}
interface Project {
  id: number; title: string; description: string; category: string;
}
// 🌟 新增：将 Markdown 文本安全转换为 HTML 格式
const renderMarkdown = (text: string) => {
  return marked.parse(text || '')
}
// ================= 响应式状态 =================
const loading = ref(true)
const skills = ref<Skill[]>([])
const experiences = ref<Experience[]>([])
const projects = ref<Project[]>([])

// 计算属性：自动对项目进行分类归属
const enterpriseProjects = computed(() => projects.value.filter(p => p.category === 'enterprise'))
const explorationProjects = computed(() => projects.value.filter(p => p.category === 'exploration'))

// 辅助函数：判断颜色是预设主题(如 info)还是十六进制(如 #e0f2fe)
const isHexColor = (color: string) => color && color.startsWith('#')

// 🌟 新增：把普通的 string 强转为 Naive UI 允许的严格类型
const getTagType = (color: string) => {
  if (!isHexColor(color) && color) {
    return color as 'default' | 'error' | 'info' | 'success' | 'warning' | 'primary'
  }
  return undefined
}

// ================= 数据拉取逻辑 =================
const fetchPortfolioData = async () => {
  try {
    // 请求 Nginx 代理的 Django 聚合接口
    const response = await fetch('/api/portfolio/')
    const data = await response.json()
    
    skills.value = data.skills || []
    experiences.value = data.experiences || []
    projects.value = data.projects || []
  } catch (error) {
    console.error('获取简历数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPortfolioData()
})
</script>

<template>
  <div class="login-container">
    <div class="portfolio-card neumorphic-panel">
      
      <div class="sidebar-box">
        <div class="profile-header">
          <div class="avatar-well">
            <img src="/xv.jpg" class="avatar" alt="avatar" />
          </div>
          <h1 class="logo-title">肖 伟</h1>
          <p class="subtitle">Python 核心架构 / 全栈开发</p>
        </div>

        <div class="lottie-wrapper">
          <Vue3Lottie :animationData="heroAnimation" :height="240" :width="240" />
        </div>

        <div class="image-text">
          <p class="motto">" Not all those who wander are lost "</p>
          
          <div class="contact-card neu-btn">
            <div class="contact-item">
              <span class="contact-icon">📧</span>
              <a href="mailto:xv1172091477@gmail.com" class="contact-text">xv1172091477@gmail.com</a>
            </div>
          </div>
          
        </div>
      </div>

      <div class="content-box">
        <div class="scroll-container">
          
          <n-spin :show="loading" size="large" :style="loading ? 'min-height: 400px; display: flex; align-items: center; justify-content: center;' : ''">
            
            <div v-if="!loading">
              
              <div class="section-block">
                <div class="section-header">
                  <Vue3Lottie :animationData="iconAbout" :height="48" :width="48" class="section-icon" />
                  <h2 class="section-title">About Me</h2>
                </div>
                <div class="neu-text-well">
                  <p class="bio-text">
                    拥有 7 年实战经验的后端开发者。专注于构建高并发任务调度中台、异构数据聚合系统与自动化运维架构。
                    不仅精通 Django/Flask 企业级开发，更热衷于 <strong class="highlight-text">边缘 AI Agent</strong>、<strong class="highlight-text">Web3 量化交易</strong> 及 <strong>OpenClaw</strong> 等前沿技术的落地实践
                  </p>
                </div>
              </div>

              <div class="section-block" v-if="skills.length > 0">
                <div class="section-header">
                  <Vue3Lottie :animationData="iconTech" :height="48" :width="48" class="section-icon" />
                  <h2 class="section-title">Tech Stack</h2>
                </div>
                <n-space wrap :size="[16, 16]">
                  <n-tag 
                    v-for="skill in skills" 
                    :key="skill.id"
                    :bordered="false" 
                    size="large" 
                    class="tech-tag neu-btn"
                  >
                    <div class="tag-content" :style="isHexColor(skill.bg_color) ? { color: skill.bg_color } : {}">
                      <img :src="skill.icon_url" class="tech-icon" :alt="skill.name" />
                      <span style="font-weight: 800;">{{ skill.name }}</span>
                    </div>
                  </n-tag>
                </n-space>
              </div>

              <div class="section-block" v-if="experiences.length > 0">
                <div class="section-header">
                  <Vue3Lottie :animationData="iconExp" :height="48" :width="48" class="section-icon" />
                  <h2 class="section-title">Experience</h2>
                </div>
                <n-timeline size="large" style="margin-top: 25px; padding-left: 10px;">
                  <n-timeline-item 
                    v-for="exp in experiences" 
                    :key="exp.id"
                    :type="exp.timeline_type" 
                    :title="exp.company" 
                    :time="exp.duration"
                  >
                    <div class="timeline-desc" v-html="renderMarkdown(exp.description)"></div>
                  </n-timeline-item>
                </n-timeline>
              </div>

              <div class="section-block" v-if="enterpriseProjects.length > 0">
                <div class="section-header">
                  <Vue3Lottie :animationData="iconProject" :height="48" :width="48" class="section-icon" />
                  <h2 class="section-title">Projects</h2>
                </div>
                <n-grid x-gap="24" y-gap="24" cols="1 m:2" responsive="screen">
                  <n-gi v-for="proj in enterpriseProjects" :key="proj.id">
                    <n-card :title="proj.title" size="small" class="neu-card">
                      <div class="project-desc" v-html="renderMarkdown(proj.description)"></div>
                    </n-card>
                  </n-gi>
                </n-grid>
              </div>

              <div class="section-block" style="margin-bottom: 0;" v-if="explorationProjects.length > 0">
                <div class="section-header">
                  <Vue3Lottie :animationData="iconExplore" :height="48" :width="48" class="section-icon" />
                  <h2 class="section-title">Explorations</h2>
                </div>
                <n-grid x-gap="24" y-gap="24" cols="1 m:2" responsive="screen">
                  <n-gi v-for="proj in explorationProjects" :key="proj.id">
                    <n-card :title="proj.title" size="small" class="neu-card">
                       <div class="project-desc" v-html="renderMarkdown(proj.description)"></div>
                    </n-card>
                  </n-gi>
                </n-grid>
              </div>
              
              <div style="height: 60px;"></div>
              
            </div>
            
          </n-spin>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 引入谷歌现代字体 */
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Fira+Code:wght@500&display=swap');

/* 🌟 核心：定义拟态设计的全局变量 🌟 */
:root {
  --nm-bg: #e0e5ec;        /* 主机面板底色（科技冷灰） */
  --nm-light: #ffffff;     /* 高光色 */
  --nm-dark: #a3b1c6;      /* 阴影色 */
  --text-main: #2d3748;
  --text-muted: #718096;
  --accent-blue: #3b82f6;
}

/* 覆盖 Naive UI 的全局变量以适应拟态主题 */
:deep(.n-tag) { background-color: transparent !important; }
:deep(.n-card) { background-color: transparent !important; border: none !important; }
:deep(.n-card-header__main) { color: var(--text-main) !important; font-weight: 700 !important; }

/* ================== 1. 容器与背景 ================== */
.login-container {
  width: 100%;
  height: calc(100vh - 70px); 
  padding: 30px 40px; 
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Nunito', -apple-system, sans-serif;
  overflow: hidden; 
  background-color: var(--nm-bg); /* 统一底色 */
}

/* ================== 2. 核心大卡片 (主机外壳) ================== */
.portfolio-card {
  display: flex;
  flex-direction: row;
  width: 100%;  
  height: 100%; 
  max-width: 1800px; 
  background-color: var(--nm-bg);
  border-radius: 30px;
  /* 巨型凸起阴影，奠定主机质感 */
  box-shadow: 
    20px 20px 60px var(--nm-dark),
    -20px -20px 60px var(--nm-light);
  overflow: hidden;
  z-index: 1;
}

/* ================== 3. 左侧控制面板 ================== */
.sidebar-box {
  width: 360px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 50px 30px;
  background: var(--nm-bg);
  /* 用阴影替代边框进行软分割 */
  box-shadow: 6px 0 15px -10px var(--nm-dark);
  z-index: 2;
}

.profile-header { text-align: center; }

/* 头像凹槽设计 */
.avatar-well {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  margin: 0 auto 24px auto;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--nm-bg);
  /* 内凹阴影 */
  box-shadow: 
    inset 6px 6px 12px var(--nm-dark),
    inset -6px -6px 12px var(--nm-light);
}

.avatar {
  width: 104px;
  height: 104px;
  border-radius: 50%;
  object-fit: cover;
  /* 头像本身再次凸起 */
  box-shadow: 
    4px 4px 8px var(--nm-dark),
    -4px -4px 8px var(--nm-light);
}

.logo-title {
  font-size: 32px;
  font-weight: 800;
  color: var(--text-main);
  margin: 0 0 8px 0;
  letter-spacing: 1px;
}
.subtitle { font-size: 14px; color: var(--text-muted); font-weight: 700; margin: 0;}

.lottie-wrapper { width: 100%; display: flex; justify-content: center; }

.image-text { text-align: center; width: 100%; }
.motto { 
  font-size: 13.5px; 
  color: var(--text-muted); 
  letter-spacing: 0.5px; 
  margin-bottom: 24px;
  font-style: italic;
  font-weight: 600;
}

/* ================== 拟态交互组件 (按钮/标签通用) ================== */
.neu-btn {
  background-color: var(--nm-bg);
  border-radius: 16px;
  /* 默认凸起状态 */
  box-shadow: 
    6px 6px 12px var(--nm-dark),
    -6px -6px 12px var(--nm-light);
  transition: all 0.2s ease-in-out;
  cursor: pointer;
}

/* 悬停/点击时的物理凹陷反馈 */
.neu-btn:hover, .neu-btn:active {
  box-shadow: 
    inset 4px 4px 8px var(--nm-dark),
    inset -4px -4px 8px var(--nm-light);
}

.contact-card {
  padding: 14px 20px;
  display: inline-flex;
}
.contact-item { display: flex; align-items: center; gap: 12px; }
.contact-icon { font-size: 18px; }
.contact-text {
  font-family: 'Fira Code', monospace;
  font-size: 14px;
  color: var(--text-main);
  font-weight: 700;
  text-decoration: none;
}

/* ================== 4. 右侧内嵌屏幕区 ================== */
.content-box {
  flex: 1;
  height: 100%;
  background: var(--nm-bg);
  /* 整个右侧内容区向内凹陷，像是一块被保护的显示屏幕 */
  box-shadow: 
    inset 12px 12px 24px var(--nm-dark),
    inset -12px -12px 24px var(--nm-light);
  border-radius: 40px 0 0 40px; /* 内部圆角让边缘更平滑 */
  margin: 15px 15px 15px 0;
  overflow: hidden;
}

.scroll-container {
  height: 100%;
  padding: 50px 70px; 
  overflow-y: auto;
  box-sizing: border-box;
}
.scroll-container::-webkit-scrollbar { width: 0px; }

/* ================== 内部排版与排版凹槽 ================== */
.section-block { margin-bottom: 65px; } 

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.section-icon { margin-right: 12px; margin-left: -8px; filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.1)); }

.section-title {
  font-size: 26px;
  font-weight: 800;
  color: var(--text-main);
  margin: 0;
  /* 文字也可以有微拟态的凸印感 */
  text-shadow: 1px 1px 1px var(--nm-light), -1px -1px 1px rgba(163, 177, 198, 0.3);
}

/* 文本阅读区凹槽 */
.neu-text-well {
  background: var(--nm-bg);
  padding: 24px 30px;
  border-radius: 20px;
  box-shadow: 
    inset 5px 5px 10px var(--nm-dark),
    inset -5px -5px 10px var(--nm-light);
}

.bio-text { 
  font-size: 15.5px; 
  color: var(--text-main); 
  line-height: 1.9; 
  margin: 0;
}
.highlight-text { color: var(--accent-blue); font-weight: 700; }

/* ================== 技能标签 & 项目卡片 ================== */
.tech-tag {
  padding: 6px 16px;
  height: auto !important;
}
.tag-content {
  display: flex;
  align-items: center;
  gap: 10px; 
  color: var(--text-main);
}
.tech-icon { width: 18px; height: 18px; object-fit: contain; }

/* 项目卡片 */
.neu-card {
  background-color: var(--nm-bg) !important;
  border-radius: 20px !important;
  padding: 10px;
  /* 默认凸起 */
  box-shadow: 
    8px 8px 16px var(--nm-dark),
    -8px -8px 16px var(--nm-light) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
/* 卡片悬停呈现物理按压感 */
.neu-card:hover { 
  transform: scale(0.98); /* 稍微缩小模拟按压 */
  box-shadow: 
    inset 6px 6px 12px var(--nm-dark),
    inset -6px -6px 12px var(--nm-light) !important;
}

.project-desc { font-size: 14px; color: var(--text-muted); line-height: 1.8; margin: 0;}
.timeline-desc { color: var(--text-muted); font-size: 14.5px; margin-top: 10px; line-height: 1.8; }

/* ================== 移动端适配 ================== */
@media screen and (max-width: 900px) {
  .login-container { 
    padding: 0; 
    height: 100dvh; 
    overflow-y: auto; 
    display: block; 
  }
  
  .portfolio-card { 
    flex-direction: column; 
    height: auto; 
    min-height: 100%; 
    border-radius: 0; /* 手机端取消外层大圆角 */
    box-shadow: none;
  }
  
  .sidebar-box { 
    width: 100%; 
    box-shadow: 0 10px 15px -10px var(--nm-dark);
    padding: 40px 30px 30px;
  }
  
  .lottie-wrapper { display: none; }
  
  .content-box { 
    height: auto; 
    margin: 0;
    border-radius: 0;
    /* 手机端取消内凹大屏幕感，改为平面铺展 */
    box-shadow: none;
  }
  
  .scroll-container { 
    height: auto;
    padding: 40px 30px; 
    overflow-y: visible; 
  }
}

@media screen and (max-width: 600px) {
  .avatar-well { width: 100px; height: 100px; }
  .avatar { width: 86px; height: 86px; }
  .logo-title { font-size: 26px; }
  .scroll-container { padding: 30px 20px; }
  .section-block { margin-bottom: 45px; }
  .neu-text-well { padding: 20px; }
}
</style>
