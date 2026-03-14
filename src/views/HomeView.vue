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
    <div class="bg-circle circle-1"></div>
    <div class="bg-circle circle-2"></div>

    <div class="login-card portfolio-card">
      
      <div class="sidebar-box">
        <div class="profile-header">
          <img src="/xv.jpg" class="avatar" alt="avatar" />
          <h1 class="logo-title">肖 伟</h1>
          <p class="subtitle">Python 核心架构 / 全栈开发</p>
        </div>

        <div class="lottie-wrapper">
          <Vue3Lottie :animationData="heroAnimation" :height="240" :width="240" />
        </div>

        <div class="image-text">
          <p class="motto">" Not all those who wander are lost "</p>
          
          <div class="contact-card">
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
                <p class="bio-text">
                  拥有 7 年实战经验的后端开发者。专注于构建高并发任务调度中台、异构数据聚合系统与自动化运维架构。
                  不仅精通 Django/Flask 企业级开发，更热衷于 <strong class="highlight-text">边缘 AI Agent</strong>、<strong class="highlight-text">Web3 量化交易</strong> 及 <strong>OpenClaw</strong> 等前沿技术的落地实践
                </p>
              </div>

              <div class="section-block" v-if="skills.length > 0">
                <div class="section-header">
                  <Vue3Lottie :animationData="iconTech" :height="48" :width="48" class="section-icon" />
                  <h2 class="section-title">Tech Stack</h2>
                </div>
                <n-space wrap :size="[12, 12]">
                  <n-tag 
                    v-for="skill in skills" 
                    :key="skill.id"
                    :type="getTagType(skill.bg_color)"
                    :color="isHexColor(skill.bg_color) ? { color: skill.bg_color, textColor: skill.text_color } : undefined"
                    :bordered="false" 
                    size="large" 
                    class="tech-tag"
                    :style="isHexColor(skill.bg_color) ? { fontWeight: 'bold' } : {}"
                  >
                    <div class="tag-content">
                      <img :src="skill.icon_url" class="tech-icon" :alt="skill.name" />
                      <span>{{ skill.name }}</span>
                    </div>
                  </n-tag>
                </n-space>
              </div>

              <div class="section-block" v-if="experiences.length > 0">
                <div class="section-header">
                  <Vue3Lottie :animationData="iconExp" :height="48" :width="48" class="section-icon" />
                  <h2 class="section-title">Experience</h2>
                </div>
                <n-timeline size="large" style="margin-top: 25px;">
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
                <n-grid x-gap="20" y-gap="20" cols="1 m:2" responsive="screen">
                  <n-gi v-for="proj in enterpriseProjects" :key="proj.id">
                    <n-card :title="proj.title" size="small" hoverable class="clean-card">
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
                <n-grid x-gap="20" y-gap="20" cols="1 m:2" responsive="screen">
                  <n-gi v-for="proj in explorationProjects" :key="proj.id">
                    <n-card :title="proj.title" size="small" hoverable class="clean-card border-tech">
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

/* ================== 1. 容器与背景 (PC端基准) ================== */
.login-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 70px); 
  padding: 30px 40px; 
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Nunito', -apple-system, sans-serif;
  overflow: hidden; 
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  z-index: 0;
  opacity: 0.4;
}
.circle-1 { width: 550px; height: 550px; background: #a1c4fd; top: -50px; left: -50px; }
.circle-2 { width: 450px; height: 450px; background: #c2e9fb; bottom: -50px; right: -50px; }

/* ================== 2. 核心大卡片 ================== */
.login-card.portfolio-card {
  display: flex;
  flex-direction: row;
  width: 100%;  
  height: 100%; 
  max-width: 1800px; 
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.9);
  overflow: hidden;
  z-index: 1;
}

/* ================== 3. 左侧侧边栏 ================== */
.sidebar-box {
  width: 340px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 50px 30px;
  background: transparent;
  border-right: 1px solid rgba(226, 232, 240, 0.8);
}

.profile-header { text-align: center; }
.avatar {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid #fff;
  box-shadow: 0 10px 25px rgba(37, 99, 235, 0.1);
  margin-bottom: 18px;
}
.logo-title {
  font-size: 30px;
  font-weight: 800;
  background: linear-gradient(to right, #1e293b, #3b82f6);
  -webkit-background-clip: text;
  color: transparent;
  margin: 0 0 6px 0;
  letter-spacing: -0.5px;
}
.subtitle { font-size: 14px; color: #64748b; font-weight: 600; margin: 0;}

.lottie-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.image-text { 
  text-align: center; 
  width: 100%;
}
.motto { 
  font-size: 13.5px; 
  color: #94a3b8; 
  letter-spacing: 0.5px; 
  margin-bottom: 24px;
  font-style: italic;
  font-weight: 600;
}

/* 🌟 全新联系方式卡片样式 */
.contact-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(241, 245, 249, 0.6);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 14px;
  padding: 12px 16px;
  transition: all 0.3s ease;
}
.contact-card:hover {
  background: rgba(241, 245, 249, 0.9);
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}
.contact-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.contact-icon {
  font-size: 16px;
}
.contact-text {
  font-family: 'Fira Code', 'Nunito', monospace;
  font-size: 14px;
  color: #475569;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.3s ease;
}
.contact-text:hover {
  color: #2563eb;
}

/* ================== 4. 右侧可滚动内容区 ================== */
.content-box {
  flex: 1;
  height: 100%;
  background: transparent;
  overflow: hidden;
}

.scroll-container {
  height: 100%;
  padding: 40px 60px; 
  overflow-y: auto;
  box-sizing: border-box;
}
.scroll-container::-webkit-scrollbar { width: 0px; }

/* ================== 右侧排版与动画标题样式 ================== */
.section-block { margin-bottom: 55px; } 

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
  padding-bottom: 8px;
}

.section-header::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 28px;
  height: 4px;
  background: #3b82f6;
  border-radius: 2px;
}

.section-icon {
  margin-right: 12px;
  margin-left: -8px; 
}

.section-title {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.bio-text { 
  font-size: 15px; 
  color: #475569; 
  line-height: 1.9; 
  margin: 0;
}
.highlight-text { color: #2563eb; font-weight: 600; }

.timeline-desc { color: #64748b; font-size: 14px; margin-top: 10px; line-height: 1.7; }

/* 卡片微调 */
.clean-card {
  background: rgba(248, 250, 252, 0.8) !important;
  border: 1px solid rgba(226, 232, 240, 0.8) !important;
  border-radius: 12px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.clean-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.04); }
.border-tech { background: #ffffff !important; border: 1px solid #e0f2fe !important; }
.project-desc { font-size: 13.5px; color: #64748b; line-height: 1.7; margin: 0;}

/* ================== 技能标签 Logo 样式 ================== */
.tech-tag {
  padding: 0 12px;
  transition: all 0.3s ease;
}
.tech-tag:hover {
  transform: translateY(-2px); 
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.tag-content {
  display: flex;
  align-items: center;
  gap: 8px; 
}
.tech-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

@media screen and (max-width: 900px) {
  .login-container { 
    padding: 15px; 
    /* 🌟 核心修复1：固定高度为视口高度，让内部产生滚动 */
    height: 100dvh; 
    min-height: 100vh; /* 兼容老浏览器 */
    overflow-y: auto; 
    /* 🌟 核心修复2：开启 iOS 惯性平滑滚动，解决卡顿感 */
    -webkit-overflow-scrolling: touch; 
    /* 🌟 核心修复3：移除 flex 布局，防止高度计算失效 */
    display: block; 
  }
  
  .login-card.portfolio-card { 
    flex-direction: column; 
    height: auto; 
    min-height: 100%; /* 让卡片至少撑满整屏 */
    overflow: visible; 
  }
  
  .sidebar-box { 
    width: 100%; 
    border-right: none; 
    border-bottom: 1px solid #e2e8f0; 
    padding: 40px 30px 30px;
  }
  
  .lottie-wrapper { 
    display: none; 
  }
  
  .content-box { 
    height: auto; 
    overflow: visible; 
  }
  
  .scroll-container { 
    height: auto;
    padding: 40px 30px; 
    overflow-y: visible; 
  }
}

/* 2. 极致适配纯手机端 (宽 <= 600px) */
@media screen and (max-width: 600px) {
  .login-container { 
    padding: 0; 
    /* height 和 overflow 会自动继承 900px 里的设定，无需重复写 */
  }
  
  .login-card.portfolio-card { 
    border-radius: 0; 
    border: none;
    box-shadow: none;
  }
  
  .sidebar-box { 
    padding: 35px 20px 25px; 
  }
  
  .avatar {
    width: 90px;
    height: 90px;
    margin-bottom: 12px;
  }
  
  .logo-title {
    font-size: 26px;
  }
  
  .scroll-container { 
    padding: 30px 20px; 
  }
  
  .section-block { 
    margin-bottom: 40px; 
  }
  
  .section-title {
    font-size: 20px;
  }
  
  .bio-text {
    font-size: 14px; 
  }
}
</style>
