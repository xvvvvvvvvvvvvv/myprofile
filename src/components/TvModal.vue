<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { NModal, NInput, NSelect } from 'naive-ui'
import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight' 
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'

// 1. Markdown 配置
marked.use(markedHighlight({
  langPrefix: 'hljs language-',
  highlight(code: string, lang: string) { 
    const language = hljs.getLanguage(lang) ? lang : 'plaintext'
    return hljs.highlight(code, { language }).value
  }
}))

marked.use({ breaks: true })

const renderMarkdown = (text: string) => {
  if (!text) return ''
  return marked.parse(text) as string 
}

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ (e: 'update:show', val: boolean): void }>()

const searchQuery = ref('')
const chatContainerRef = ref<HTMLElement | null>(null)
const inputRef = ref<InstanceType<typeof NInput> | null>(null)

// 🌟 核心改造 1：将全局布尔值替换为对象，记录每个 Agent 的请求状态
const searchingStates = ref<Record<string, boolean>>({})

// 🌟 核心改造 2：动态计算当前所在的 Agent 是否正在请求
const isCurrentAgentSearching = computed(() => {
  return !!searchingStates.value[currentAgentId.value]
})

// 🌟 纯净版 SVG 图标
const agentOptions = [
  { 
    label: 'xiaxia (默认)', 
    value: 'guest-bot',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16.01"/><line x1="16" y1="16" x2="16" y2="16.01"/></svg>`
  },
  { 
    label: '高级前端专家', 
    value: 'engineering-frontend-developer',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`
  },
  { 
    label: '全栈技术布道师', 
    value: 'specialized-developer-advocate',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>`
  },
  { 
    label: '趣味交互设计', 
    value: 'design-whimsy-injector',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.836-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`
  },
  { 
    label: '爬虫助手', 
    value: 'scrapling',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="14" x="8" y="6" rx="4"/><path d="m19 7-3 2"/><path d="m5 7 3 2"/><path d="m19 19-3-2"/><path d="m5 19 3-2"/><path d="M20 13h-4"/><path d="M4 13h4"/><path d="m10 4 1 2"/><path d="m14 4-1 2"/></svg>`
  }
]

const currentAgentId = ref('guest-bot') 
const currentAgentName = computed(() => {
  const agent = agentOptions.find(a => a.value === currentAgentId.value)
  return agent ? agent.label : 'AI Agent'
})

// Session ID
const getOrCreateSessionId = () => {
  let sid = sessionStorage.getItem('guest_session_id')
  if (!sid) {
    sid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    sessionStorage.setItem('guest_session_id', sid)
  }
  return sid
}
const sessionId = ref(getOrCreateSessionId())

const quickMessages = computed(() => {
  if (currentAgentId.value === 'engineering-frontend-developer') {
    return ['Vue3 怎么学？', '帮我写个轮播图', '评估一下这套架构']
  } else if (currentAgentId.value === 'specialized-developer-advocate') {
    return ['如何设计高可用架构？', '讲讲微服务最佳实践', '数据库性能怎么优化？']
  } else if (currentAgentId.value === 'design-whimsy-injector') {
    return ['给我个彩蛋建议', '这个按钮太无聊了', '讲个极客笑话']
  } else if (currentAgentId.value === 'scrapling') {
    return ['介绍下你的功能']
  } 
  return ['你是谁？', '介绍下你的主人', '网站架构是怎么做的？']
})

const sendQuickMessage = (text: string) => {
  searchQuery.value = text
  handleCallOpenClaw()
}

interface Message {
  id: number
  role: 'user' | 'ai'
  content: string
  isError?: boolean
}

const chatHistories = ref<Record<string, Message[]>>(
  Object.fromEntries(agentOptions.map(opt => {
    if (opt.value === 'scrapling') {
      return [opt.value, [{
        id: Date.now(),
        role: 'ai',
        content: '您好！我是您的专属**数据爬虫助手**，专注于网页内容的智能解析与结构化提取。\n\n请向我发送**目标网页链接（URL）**，并附上您的具体提取规则。例如：\n- *“提取当前页面的所有文章标题和发布时间”*\n- *“解析页面中的表格，并以 JSON 格式输出”*\n\n请发送目标链接，我们随时开始。'
      }]]
    }
    return [opt.value, []]
  }))
)

const messageList = computed(() => chatHistories.value[currentAgentId.value] as Message[])

watch(currentAgentId, () => {
  scrollToBottom()
})

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
    }
  })
}

const handleEnter = (e: KeyboardEvent) => {
  if (e.isComposing || e.keyCode === 229) return
  if (!e.shiftKey) {
    e.preventDefault() 
    handleCallOpenClaw()
  }
}

const handleCallOpenClaw = async () => {
  // 🌟 修改：防抖检查现在针对的是当前特定的 Agent
  if (!searchQuery.value.trim() || isCurrentAgentSearching.value) return
  
  const userText = searchQuery.value
  searchQuery.value = '' 
  
  // 🌟 核心改造 3：锁定此次请求对应的专属 Agent ID
  const requestAgentId = currentAgentId.value
  searchingStates.value[requestAgentId] = true

  const currentList = chatHistories.value[requestAgentId] as Message[]

  const historyPayload = currentList
    .filter(m => !m.isError && m.content) 
    .map(m => ({
      role: m.role === 'ai' ? 'assistant' : 'user', 
      content: m.content
    }))
  
  historyPayload.push({ role: 'user', content: userText })

  currentList.push({
    id: Date.now(),
    role: 'user',
    content: userText
  })
  scrollToBottom()

  const aiMessageId = Date.now() + 1
  currentList.push({
    id: aiMessageId,
    role: 'ai',
    content: ''
  })
  scrollToBottom()
  
  const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
  try {
    const response = await fetch(`${baseUrl}/api/portfolio/openclaw/send/`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        command: userText, 
        messages: historyPayload, 
        sessionId: `${sessionId.value}_${requestAgentId}`, // 确保传给后端的是发出请求时的 AgentId
        agentId: requestAgentId 
      }) 
    })

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`)
    const reader = response.body?.getReader()
    if (!reader) throw new Error('浏览器不支持 ReadableStream')

    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const blocks = buffer.split('\n\n')
      buffer = blocks.pop() || ''

      for (const block of blocks) {
        const lines = block.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim()
            if (dataStr === '[DONE]') continue
            try {
              const data = JSON.parse(dataStr)
              const currentAiMsg = currentList.find(m => m.id === aiMessageId)
              if (currentAiMsg) {
                if (data.error) {
                  currentAiMsg.content += `\n[系统提示]: ${data.error}`
                  currentAiMsg.isError = true
                } else if (data.choices && data.choices[0].delta) {
                  currentAiMsg.content += data.choices[0].delta.content || ''
                }
                // 只有当前正在看着这个请求的 Agent 时，才滚动到底部
                if (currentAgentId.value === requestAgentId) {
                  scrollToBottom()
                }
              }
            } catch (e) {
              console.warn('JSON 解析分块跳过:', dataStr)
            }
          }
        }
      }
    }
  } catch (error: any) {
    const currentAiMsg = currentList.find(m => m.id === aiMessageId)
    if (currentAiMsg) {
      currentAiMsg.content = `通信中断: ${error.message}`
      currentAiMsg.isError = true
    }
  } finally {
    // 🌟 核心改造 4：请求结束，只释放对应的 Agent
    searchingStates.value[requestAgentId] = false
    nextTick(() => {
      // 只有用户没有切走，依然停留在发请求的那个页面时，才自动聚焦输入框
      if (window.innerWidth > 768 && currentAgentId.value === requestAgentId) {
        inputRef.value?.focus()
      }
    })
  }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    scrollToBottom()
    setTimeout(() => {
      if (window.innerWidth > 768) inputRef.value?.focus()
    }, 300)
  }
})
</script>

<template>
  <n-modal 
    :show="show" 
    @update:show="emit('update:show', $event)"
    class="modern-chat-modal"
  >
    <div class="chat-casing">
      
      <div class="sidebar hide-on-mobile">
        <div class="sidebar-logo">
          <strong>CHAT</strong> A.I+
        </div>
        
        <div class="openclaw-banner">
          <span class="banner-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          </span> 
          <span>Powered by <strong>OpenClaw</strong></span>
        </div>

        <div class="sidebar-section">
          <div class="section-header">
            <span>Your Agents</span>
          </div>
          <div class="agent-list">
            <div 
              v-for="agent in agentOptions" 
              :key="agent.value"
              class="agent-item"
              :class="{ 'is-active': currentAgentId === agent.value }"
              @click="currentAgentId = agent.value"
            >
              <div class="agent-item-left">
                <span class="agent-icon" v-html="agent.icon"></span>
                <span class="agent-item-text">{{ agent.label }}</span>
              </div>
              
              <span v-if="searchingStates[agent.value]" class="agent-loading">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin-icon"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              </span>
            </div>
          </div>
        </div>

        <div class="sidebar-footer">
          <div class="sidebar-footer-item user-profile">
            <img src="/user.png" alt="Visitor" class="sm-avatar" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=visitor'" />
            <span class="username">访客 (Visitor)</span>
          </div>
        </div>
      </div>

      <div class="main-content">
        
        <div class="mobile-header show-on-mobile">
          <n-select v-model:value="currentAgentId" :options="agentOptions" size="small" class="mobile-select"/>
          <div class="close-btn" @click="emit('update:show', false)">✕</div>
        </div>
        
        <div class="desktop-close-btn hide-on-mobile" @click="emit('update:show', false)">✕</div>

        <div class="chat-body" ref="chatContainerRef">
          <div v-if="messageList.length === 0" class="empty-state">
            <div class="empty-icon-svg" v-html="agentOptions.find(a => a.value === currentAgentId)?.icon"></div>
            <div class="empty-text">Hi，欢迎来到我的数字领地！</div>
          </div>

          <div 
            v-for="msg in messageList" 
            :key="msg.id"
            class="message-row"
            :class="msg.role === 'user' ? 'row-user' : 'row-ai'"
          >
            <div class="msg-avatar">
              <img v-if="msg.role === 'user'" src="/user.png" alt="Visitor" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=visitor'" />
              <img v-else src="/lobster.png" alt="AI" onerror="this.src='https://api.dicebear.com/7.x/bottts/svg?seed=AI'" />
            </div>
            
            <div class="msg-content-wrapper">
              <div class="msg-author-bar">
                <span class="author-name">{{ msg.role === 'user' ? '访客' : currentAgentName }}</span>
              </div>
              
              <div class="msg-payload" :class="{ 'error-text': msg.isError }">
                <div v-if="msg.role === 'user'" class="user-bubble">{{ msg.content }}</div>
                
                <div 
                  v-else 
                  class="markdown-body" 
                  v-html="renderMarkdown(msg.content)"
                ></div>

                <span 
                  v-if="msg.role === 'ai' && isCurrentAgentSearching && msg === messageList[messageList.length - 1]" 
                  class="ai-cursor"
                ></span>
              </div>
              
              <div class="msg-actions" v-if="msg.role === 'ai' && !isCurrentAgentSearching && msg === messageList[messageList.length - 1]">
                <div class="action-btn" title="赞同">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                </div>
                <div class="action-btn" title="不赞同">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
                </div>
                <div class="action-btn" title="复制内容">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </div>
              </div>
            </div>
          </div>
          <div class="chat-bottom-spacer"></div>
        </div>

        <div class="floating-input-area">
          
          <div class="quick-messages-wrapper" v-if="!isCurrentAgentSearching">
            <span 
              v-for="(msg, idx) in quickMessages" 
              :key="idx"
              class="quick-tag"
              @click="sendQuickMessage(msg)"
            >
              <svg style="margin-right: 4px" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z"/></svg>
              <span>{{ msg }}</span>
            </span>
          </div>

          <div class="pill-input-box">
            <div class="pill-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <n-input 
              ref="inputRef"
              v-model:value="searchQuery" 
              type="textarea" 
              placeholder="What's in your mind?..." 
              class="seamless-input"
              @keydown.enter="handleEnter"
              :disabled="isCurrentAgentSearching"
              :autosize="{ minRows: 1, maxRows: 4 }"
            />
            <button 
              class="pill-send-btn" 
              :class="{ 'is-active': searchQuery.trim().length > 0 && !isCurrentAgentSearching }"
              @click="handleCallOpenClaw"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/></svg>
            </button>
          </div>
        </div>

        </div>
    </div>
  </n-modal>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* ================== 基础框架 ================== */
.chat-casing {
  width: calc(100vw - 40px);
  max-width: 1100px;
  height: 85vh; 
  max-height: 850px;
  background: #ffffff;
  border-radius: 20px;
  display: flex;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  font-family: 'Inter', sans-serif;
  position: relative;
}

/* ================== 左侧边栏 ================== */
.sidebar {
  width: 260px;
  background: #ffffff;
  border-right: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
  padding: 24px 20px;
  flex-shrink: 0;
}

.sidebar-logo {
  font-size: 20px;
  letter-spacing: 0.5px;
  margin-bottom: 24px;
  padding-left: 8px;
}
.sidebar-logo strong { font-weight: 800; color: #111827; }

.openclaw-banner {
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  color: #4338ca;
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 13.5px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 32px;
  border: 1px solid #c7d2fe;
}
.banner-icon { display: flex; align-items: center; }

.sidebar-section { flex: 1; overflow-y: auto; }
.section-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #9ca3af;
  font-weight: 600;
  padding: 0 8px;
  margin-bottom: 12px;
}

.agent-list { display: flex; flex-direction: column; gap: 4px; }
.agent-item {
  padding: 10px 12px;
  border-radius: 8px;
  color: #4b5563;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
}
.agent-item:hover { background: #f9fafb; color: #111827;}
.agent-item.is-active {
  background: #eef2ff;
  color: #4f46e5;
  font-weight: 600;
}
.agent-item-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.agent-icon {
  display: flex;
  align-items: center;
  color: inherit;
  opacity: 0.8;
}
.agent-item.is-active .agent-icon { opacity: 1; }

.agent-item-text {
  font-size: 13.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 小小的 Loading 动画 CSS */
.agent-loading {
  display: flex;
  align-items: center;
}
.spin-icon {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  100% { transform: rotate(360deg); }
}

.sidebar-footer {
  margin-top: auto;
  border-top: 1px solid #f3f4f6;
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.sidebar-footer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  font-size: 14px;
  color: #4b5563;
  font-weight: 500;
  border-radius: 8px;
}
.sm-avatar { width: 26px; height: 26px; border-radius: 50%; border: 1px solid #e5e7eb; object-fit: cover; }
.username { font-weight: 600; color: #111827; }

/* ================== 右侧主区域 ================== */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  position: relative;
}

.desktop-close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 8px;
  z-index: 10;
}
.desktop-close-btn:hover { background: #f3f4f6; color: #111827; }

/* 对话流 */
.chat-body {
  flex: 1;
  padding: 40px 60px 0 60px;
  overflow-y: auto;
  scroll-behavior: smooth;
}
.chat-body::-webkit-scrollbar { width: 6px; }
.chat-body::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 3px; }

.empty-state {
  height: 60%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}
.empty-icon-svg { 
  display: flex;
  justify-content: center;
  margin-bottom: 16px; 
  color: #9ca3af;
}
.empty-icon-svg :deep(svg) { width: 48px; height: 48px; stroke-width: 1.5; }

.message-row {
  display: flex;
  gap: 16px;
  margin-bottom: 32px; 
  max-width: 850px;
  margin-left: auto;
  margin-right: auto;
}

.row-ai { flex-direction: row; }
.row-user { flex-direction: row-reverse; }

.msg-avatar { width: 36px; height: 36px; flex-shrink: 0; }
.msg-avatar img { width: 100%; height: 100%; border-radius: 50%; border: 1px solid #e5e7eb; background-color: #f9fafb; object-fit: cover;}

.msg-content-wrapper { 
  flex: 1; 
  min-width: 0; 
  display: flex;
  flex-direction: column;
}
.row-ai .msg-content-wrapper { align-items: flex-start; }
.row-user .msg-content-wrapper { align-items: flex-end; }

.msg-author-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.row-user .msg-author-bar { flex-direction: row-reverse; }

.author-name { font-size: 13px; font-weight: 600; color: #4b5563; }
.row-ai .author-name { color: #4f46e5; }

.msg-payload {
  font-size: 15px;
  line-height: 1.7;
  color: #1f2937;
  max-width: 90%; 
}
.error-text { color: #dc2626; }

.user-bubble {
  background: #f3f4f6;
  color: #111827;
  padding: 12px 18px;
  border-radius: 14px 4px 14px 14px;
  display: inline-block;
  white-space: pre-wrap;
  word-break: break-all;
  text-align: left;
}

.msg-actions {
  display: flex;
  gap: 12px;
  margin-top: 10px;
}
.action-btn { display: flex; align-items: center; color: #9ca3af; cursor: pointer; transition: color 0.2s;}
.action-btn:hover { color: #4b5563; }

/* 🌟 NEW: 光标样式和动画 */
.ai-cursor {
  display: inline-block;
  width: 8px;
  height: 1.2em;
  background-color: #4f46e5; /* 使用主题紫色 */
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}

.chat-bottom-spacer { height: 140px; }

/* ================== 悬浮胶囊输入框与快捷语 ================== */
.floating-input-area {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0 40px 32px 40px;
  background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 20%, rgba(255,255,255,1) 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.quick-messages-wrapper {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  width: 100%;
  max-width: 760px;
  overflow-x: auto;
  scrollbar-width: none;
}
.quick-messages-wrapper::-webkit-scrollbar { display: none; }

.quick-tag {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  color: #4b5563;
  padding: 6px 14px;
  border-radius: 999px; 
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  display: flex;
  align-items: center;
}
.quick-tag:hover { 
  background: #f9fafb; 
  border-color: #d1d5db; 
  color: #111827; 
  transform: translateY(-1px); 
}

/* 悬浮输入框 */
.pill-input-box {
  width: 100%;
  max-width: 760px;
  background: #ffffff;
  border-radius: 999px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  padding: 8px 12px 8px 24px;
  gap: 12px;
}

.pill-icon { display: flex; align-items: center; }

:deep(.seamless-input.n-input) {
  background-color: transparent;
  border: none !important;
  box-shadow: none !important;
}
:deep(.seamless-input.n-input .n-input__textarea-el) {
  padding: 10px 0;
  font-size: 15px;
  color: #1f2937;
}

.pill-send-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: #e5e7eb;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: not-allowed;
  transition: all 0.3s;
}
.pill-send-btn.is-active {
  background: #4f46e5;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
}
.pill-send-btn.is-active:hover { background: #4338ca; transform: scale(1.05); }

/* ================== 🌟 修复 Markdown 内容溢出与样式穿透 ================== */
.markdown-body {
  width: 100%;
  max-width: 100%;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word; /* 强制长英文或链接换行 */
}

/* 必须使用 :deep() 才能对 v-html 生成的元素生效 */
.markdown-body :deep(p) {
  margin-top: 0;
  margin-bottom: 0.8em;
  line-height: 1.6;
}

.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}

/* 核心修复：代码块横向滚动，绝对不撑爆父容器 */
.markdown-body :deep(pre) {
  max-width: 100%;
  overflow-x: auto; /* 超出宽度出现滚动条 */
  background-color: #282c34; /* 匹配你引入的 atom-one-dark 主题底色 */
  padding: 12px;
  border-radius: 8px;
  margin: 12px 0;
}

.markdown-body :deep(code) {
  font-family: Consolas, Monaco, "Courier New", monospace;
  font-size: 13.5px;
}

/* 让内联代码也有背景色 */
.markdown-body :deep(:not(pre) > code) {
  background-color: #f3f4f6;
  color: #eb5757;
  padding: 2px 4px;
  border-radius: 4px;
  word-break: break-word;
  white-space: pre-wrap;
}

/* 确保图片和表格也不会溢出 */
.markdown-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
}

.markdown-body :deep(table) {
  display: block;
  width: 100%;
  overflow-x: auto; /* 表格太宽也允许内部滑动 */
  border-collapse: collapse;
}

.markdown-body :deep(table th),
.markdown-body :deep(table td) {
  border: 1px solid #e5e7eb;
  padding: 6px 12px;
}

/* ================== 📱 移动端适配 ================== */
.show-on-mobile { display: none; }
@media (max-width: 768px) {
  .chat-casing { width: 100vw; height: 100dvh; max-height: 100dvh; border-radius: 0; }
  .hide-on-mobile { display: none; }
  .show-on-mobile { display: flex; }
  
  .mobile-header {
    height: 60px; border-bottom: 1px solid #e5e7eb;
    display: flex; align-items: center; justify-content: space-between; padding: 0 16px;
  }
  .mobile-select { width: 160px; }
  
  .chat-body { padding: 24px 16px 0 16px; }
  .message-row { gap: 12px; margin-bottom: 24px; }
  .msg-avatar { width: 28px; height: 28px; }
  
  .floating-input-area { padding: 0 16px 20px 16px; }
  .pill-input-box { border-radius: 20px; padding: 6px 8px 6px 16px; }
  .pill-send-btn { width: 36px; height: 36px; }
  .pill-send-btn svg { width: 16px; height: 16px; }
}
</style>
