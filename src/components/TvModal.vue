<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { NModal, NInput, NSelect } from 'naive-ui'
import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight' // 引入新插件
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'

// 1. 使用官方推荐的 use() 语法注入高亮插件，并加上 TS 类型注解
marked.use(markedHighlight({
  langPrefix: 'hljs language-',
  highlight(code: string, lang: string) { // 👈 加上了 :string，解决 TS 报错
    const language = hljs.getLanguage(lang) ? lang : 'plaintext'
    return hljs.highlight(code, { language }).value
  }
}))

// 2. 单独配置开启回车换行
marked.use({
  breaks: true
})

// 3. 渲染函数（强转为 string 满足 Vue v-html 的类型要求）
const renderMarkdown = (text: string) => {
  if (!text) return ''
  return marked.parse(text) as string // 👈 加上 as string，让 TS 安心
}
const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ (e: 'update:show', val: boolean): void }>()

const searchQuery = ref('')
const isSearching = ref(false)
const chatContainerRef = ref<HTMLElement | null>(null)

// 获取输入框 DOM，用于结束时自动聚焦
const inputRef = ref<InstanceType<typeof NInput> | null>(null)

// ================== 🌟 新增：多重身份配置 ==================
const currentAgentId = ref('guest-bot') // 默认身份

// 下拉菜单的选项配置，必须与 Django 后端的 ALLOWED_AGENTS 白名单对齐
const agentOptions = [
  { label: '🦞 虾小毛 (默认接待)', value: 'guest-bot' },
  { label: '💻 高级前端专家', value: 'engineering-frontend-developer' },
  { label: '🔥 全栈技术布道师', value: 'specialized-developer-advocate' },
  { label: '🎨 趣味交互设计', value: 'design-whimsy-injector' }
]

// 监听身份切换：清空对话历史，给用户重新开始的感觉
// 🌟 核心：监听身份切换，实现记忆的“存”与“取”
watch(currentAgentId, (newAgent, oldAgent) => {
  if (newAgent !== oldAgent) {
    // 1. 切走前，把当前屏幕上的聊天记录存进旧专家的“记忆字典”里
    if (oldAgent) {
      chatHistories.value[oldAgent] = [...messageList.value]
    }
    
    // 2. 切过来时，从新专家的“记忆字典”里把历史记录读出来
    messageList.value = chatHistories.value[newAgent] || []
    
    scrollToBottom()
  }
})
// =========================================================

// 生成或获取当前访客的专属 Session ID
const getOrCreateSessionId = () => {
  let sid = sessionStorage.getItem('guest_session_id')
  if (!sid) {
    sid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    sessionStorage.setItem('guest_session_id', sid)
  }
  return sid
}
const sessionId = ref(getOrCreateSessionId())

// 预设快捷消息 (可以根据选中的身份动态变化，这里先做个简单的计算属性演示)
import { computed } from 'vue'
const quickMessages = computed(() => {
  if (currentAgentId.value === 'engineering-frontend-developer') {
    return ['👋 Vue3 怎么学？', '💻 帮我写个轮播图', '🏗️ 评估一下这套架构']
  } else if (currentAgentId.value === 'design-whimsy-injector') {
    return ['🎉 给我个彩蛋建议', '✨ 这个按钮太无聊了', '🤣 讲个极客笑话']
  }
  return ['👋 你是谁？', '💻 介绍下你的主人', '🏗️ 网站架构是怎么做的？']
})

// 数据结构
interface Message {
  id: number
  role: 'user' | 'ai'
  content: string
  isError?: boolean
}
// 🌟 新增：创建一个“记忆字典”，用来单独保存每个 Agent 的聊天记录
const chatHistories = ref<Record<string, Message[]>>({
  'guest-bot': [],
  'engineering-frontend-developer': [],
  'specialized-developer-advocate': [],
  'design-whimsy-injector': []
})

// 当前正在显示的聊天窗口列表
const messageList = ref<Message[]>([])

// 🌟 核心：监听身份切换，实现记忆的“存”与“取”
watch(currentAgentId, (newAgent, oldAgent) => {
  if (newAgent !== oldAgent) {
    // 1. 切走前，把当前屏幕上的聊天记录存进旧专家的“记忆字典”里
    if (oldAgent) {
      chatHistories.value[oldAgent] = [...messageList.value]
    }
    
    // 2. 切过来时，从新专家的“记忆字典”里把历史记录读出来
    // 如果还没聊过天，就会读到一个空数组 []
    messageList.value = chatHistories.value[newAgent] || []
    
    scrollToBottom()
  }
})

// 自动滚动到最底部
const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
    }
  })
}

// 点击快捷指令直接发送
const sendQuickMessage = (text: string) => {
  searchQuery.value = text
  handleCallOpenClaw()
}

// 解决拼音输入法下敲回车直接发送的 Bug
const handleEnter = (e: KeyboardEvent) => {
  if (e.isComposing || e.keyCode === 229) {
    return
  }
  e.preventDefault() 
  handleCallOpenClaw()
}

// 核心发送逻辑
const handleCallOpenClaw = async () => {
  if (!searchQuery.value.trim() || isSearching.value) return
  
  const userText = searchQuery.value
  searchQuery.value = '' 
  isSearching.value = true

  const historyPayload = messageList.value
    .filter(m => !m.isError && m.content) 
    .map(m => ({
      role: m.role === 'ai' ? 'assistant' : 'user', 
      content: m.content
    }))
  
  historyPayload.push({ role: 'user', content: userText })

  messageList.value.push({
    id: Date.now(),
    role: 'user',
    content: userText
  })
  scrollToBottom()

  const aiMessageId = Date.now() + 1
  messageList.value.push({
    id: aiMessageId,
    role: 'ai',
    content: ''
  })
  scrollToBottom()

  try {
    const response = await fetch('/api/portfolio/openclaw/send/', { // 🌟 确保路由与 Django 对应
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        command: userText, 
        messages: historyPayload, 
        sessionId: `${sessionId.value}_${currentAgentId.value}`,
        agentId: currentAgentId.value // 🌟 核心：把当前选中的专家 ID 传给后端！
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
              const currentAiMsg = messageList.value.find(m => m.id === aiMessageId)
              
              if (currentAiMsg) {
                if (data.error) {
                  currentAiMsg.content += `\n[系统提示]: ${data.error}`
                  currentAiMsg.isError = true
                } else if (data.choices && data.choices[0].delta) {
                  currentAiMsg.content += data.choices[0].delta.content || ''
                }
                scrollToBottom()
              }
            } catch (e) {
              console.warn('JSON 解析分块跳过:', dataStr)
            }
          }
        }
      }
    }
  } catch (error: any) {
    const currentAiMsg = messageList.value.find(m => m.id === aiMessageId)
    if (currentAiMsg) {
      currentAiMsg.content = `通信中断: ${error.message}`
      currentAiMsg.isError = true
    }
  } finally {
    isSearching.value = false
    nextTick(() => {
      if (window.innerWidth > 768) {
        inputRef.value?.focus()
      }
    })
  }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    scrollToBottom()
    setTimeout(() => {
      if (window.innerWidth > 768) {
        inputRef.value?.focus()
      }
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
      
      <div class="chat-header">
        <div class="header-left">
          <div class="status-dot"></div>
          <n-select
            v-model:value="currentAgentId"
            :options="agentOptions"
            size="small"
            class="agent-selector"
            :disabled="isSearching"
          />
        </div>
        <div class="header-right">
          <div class="tech-badge hide-on-mobile">
            <span class="fw-bold">OpenClaw</span> 驱动
          </div>
          <div class="close-btn" @click="emit('update:show', false)">✕</div>
        </div>
      </div>

      <div class="chat-body" ref="chatContainerRef">
        <div v-if="messageList.length === 0" class="empty-state">
          <div class="empty-lobster">
            {{ currentAgentId === 'guest-bot' ? '🦞' : '🤖' }}
          </div>
          <div class="empty-text">
            {{ currentAgentId === 'guest-bot' ? '“找本龙虾有何贵干？”' : '“专家已就位，请描述您的问题。”' }}
          </div>
        </div>

        <div 
          v-for="msg in messageList" 
          :key="msg.id"
          class="message-wrapper"
          :class="msg.role === 'user' ? 'is-user' : 'is-ai'"
        >
          <div class="avatar" :class="msg.role === 'user' ? 'avatar-user' : 'avatar-ai'">
            <img v-if="msg.role === 'user'" src="/user.png" class="avatar-img" alt="我" />
            <img v-else src="/lobster.png" class="avatar-img" alt="AI" />
          </div>
          
          <div class="bubble" :class="{ 'error-bubble': msg.isError }">
            <div v-if="msg.role === 'user'">{{ msg.content }}</div>
            
            <div 
              v-else 
              class="markdown-body" 
              v-html="renderMarkdown(msg.content)"
            ></div>

            <span v-if="msg.role === 'ai' && isSearching && msg === messageList[messageList.length - 1]" class="cursor"></span>
          </div>
        </div>
      </div>

      <div class="chat-footer-wrapper">
        <div class="quick-messages" v-if="!isSearching">
          <span 
            v-for="(msg, idx) in quickMessages" 
            :key="idx"
            class="quick-tag"
            @click="sendQuickMessage(msg)"
          >
            <div class="markdown-body" v-html="renderMarkdown(msg)"></div>
          </span>
        </div>

        <div class="chat-footer">
          <n-input 
            ref="inputRef"
            v-model:value="searchQuery" 
            type="textarea" 
            placeholder="输入指令..." 
            class="chat-input"
            @keydown.enter="handleEnter"
            :disabled="isSearching"
            :autosize="{ minRows: 1, maxRows: 4 }"
          >
            <template #suffix>
              <div 
                class="send-btn-icon" 
                :class="{ 'is-active': searchQuery.trim().length > 0 && !isSearching }"
                @click="handleCallOpenClaw"
              >
                ↑
              </div>
            </template>
          </n-input>
        </div>
      </div>
      
    </div>
  </n-modal>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&family=Fira+Code:wght@400;500&display=swap');

/* ================== 外壳：纯白专业风 ================== */
.chat-casing {
  width: calc(100vw - 32px);
  max-width: 820px;
  height: 85vh; 
  max-height: 850px;
  background: #ffffff; /* 移除毛玻璃，使用纯白 */
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px -8px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.2);
  overflow: hidden;
  font-family: 'Nunito', -apple-system, sans-serif;
}

/* ================== 头部 ================== */
.chat-header {
  height: 60px;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
}
.header-left, .header-right { display: flex; align-items: center; gap: 12px; }

.status-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.tech-badge {
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  color: #64748b;
  padding: 4px 10px;
  border-radius: 6px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}
.tech-badge .fw-bold { color: #334155; font-weight: 700; }

.close-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: #94a3b8;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}
.close-btn:hover { background: #f1f5f9; color: #0f172a; }

/* 下拉选择器 */
.agent-selector { width: 190px; }
:deep(.n-base-selection) {
  border-radius: 6px;
  background-color: transparent !important;
  border: 1px solid transparent !important;
  box-shadow: none !important;
}
:deep(.n-base-selection:hover), :deep(.n-base-selection--active) { 
  background-color: #f8fafc !important; 
  border-color: #e2e8f0 !important; 
}
:deep(.n-base-selection .n-base-selection-label) { font-weight: 700; color: #1e293b; }

/* ================== 对话区域 ================== */
.chat-body {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 28px; /* 增加消息间距，显得更专业不拥挤 */
  background-color: #ffffff;
}
.chat-body::-webkit-scrollbar { width: 6px; }
.chat-body::-webkit-scrollbar-track { background: transparent; }
.chat-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }

.empty-state {
  margin: auto;
  text-align: center;
  transform: translateY(-20px);
}
.empty-lobster {
  font-size: 50px;
  margin-bottom: 12px;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.05));
  animation: float 3s ease-in-out infinite;
}
.empty-text { color: #64748b; font-size: 15px; font-weight: 600; }
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

/* 消息包裹层 */
.message-wrapper {
  display: flex;
  gap: 16px;
  max-width: 90%;
}
.is-user { align-self: flex-end; flex-direction: row-reverse; }
.is-ai { align-self: flex-start; }

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px; /* 克制的小圆角 */
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}
.avatar-img { width: 100%; height: 100%; object-fit: contain; }

/* 气泡风格优化：扁平、高级灰与深色 */
.bubble {
  padding: 12px 16px;
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  border-radius: 8px; /* 统一小圆角 */
}
.is-user .bubble {
  background: #0f172a; /* 高级极客黑 */
  color: #f8fafc;
  border-bottom-right-radius: 2px;
}
.is-ai .bubble {
  background: #f8fafc; /* 清爽浅灰 */
  color: #334155;
  border: 1px solid #f1f5f9;
  border-bottom-left-radius: 2px;
}
.error-bubble {
  color: #b91c1c !important;
  background: #fef2f2 !important;
  border: 1px solid #fecaca !important;
}

.cursor {
  display: inline-block;
  width: 6px;
  height: 15px;
  background: #0f172a;
  margin-left: 4px;
  vertical-align: middle;
  animation: blink 1s step-end infinite;
}
@keyframes blink { 50% { opacity: 0; } }

/* ================== 底部输入区 ================== */
.chat-footer-wrapper {
  background: #ffffff;
  border-top: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
}

.quick-messages {
  display: flex;
  gap: 8px;
  padding: 16px 24px 0 24px;
  overflow-x: auto;
  scrollbar-width: none;
}
.quick-messages::-webkit-scrollbar { display: none; }
.quick-tag {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #475569;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}
.quick-tag:hover { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
.quick-tag .markdown-body p { margin: 0; font-size: 13px; }

.chat-footer {
  padding: 16px 24px 24px 24px;
}

/* 输入框定制：解决之前的奇怪外观 */
:deep(.chat-input.n-input) {
  border-radius: 12px;
  background-color: #f8fafc;
  border: 1px solid transparent;
  transition: all 0.2s;
  align-items: flex-end; /* 让发送按钮沉在底部 */
}
:deep(.chat-input.n-input:hover), :deep(.chat-input.n-input:focus-within) {
  background-color: #ffffff;
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}
:deep(.chat-input.n-input .n-input__textarea-el) {
  font-size: 15px;
  padding: 12px 0 12px 14px; /* 舒适的内边距 */
  color: #1e293b;
}

/* 按钮放在 #suffix 里 */
.send-btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #e2e8f0;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  cursor: not-allowed;
  transition: all 0.2s ease;
  margin-bottom: 6px; /* 贴合底部 */
  margin-right: 6px;
}
.send-btn-icon.is-active {
  background: #0f172a; /* 与用户气泡呼应 */
  color: #ffffff;
  cursor: pointer;
}
.send-btn-icon.is-active:hover { background: #334155; }

/* ================== 🚀 Markdown 与代码块 (极客终端风) ================== */
:deep(.markdown-body) {
  font-size: 15px;
  line-height: 1.7;
  color: #1e293b;
}
:deep(.markdown-body p) { margin-top: 0; margin-bottom: 12px; }
:deep(.markdown-body p:last-child) { margin-bottom: 0; }
:deep(.markdown-body strong) { font-weight: 700; color: #0f172a; }

:deep(.markdown-body code:not(pre code)) {
  background-color: #e2e8f0;
  color: #334155;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Fira Code', monospace;
  font-size: 0.85em;
}

:deep(.markdown-body pre) {
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 38px 16px 16px 16px;
  margin: 16px 0;
  overflow-x: auto;
  position: relative;
  border: 1px solid #334155;
}

:deep(.markdown-body pre::before) {
  content: " ";
  position: absolute;
  top: 14px;
  left: 14px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 16px 0 #eab308, 32px 0 #22c55e;
}

:deep(.markdown-body pre code) {
  font-family: 'Fira Code', Consolas, Monaco, monospace;
  font-size: 13.5px;
  line-height: 1.6;
  color: #abb2bf;
}
:deep(.markdown-body pre::-webkit-scrollbar) { height: 8px; }
:deep(.markdown-body pre::-webkit-scrollbar-thumb) { background-color: rgba(255, 255, 255, 0.2); border-radius: 4px; }
:deep(.markdown-body pre::-webkit-scrollbar-track) { background: transparent; }

/* ================== 📱 移动端适配 ================== */
@media (max-width: 768px) {
  .chat-casing {
    width: 100vw;
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
  }
  .chat-header { padding: 0 16px; height: 56px; }
  .hide-on-mobile { display: none; }
  .agent-selector { width: 140px; }
  .chat-body { padding: 16px; gap: 24px; }
  .message-wrapper { max-width: 95%; gap: 10px; }
  .avatar { width: 28px; height: 28px; }
  .bubble { padding: 10px 14px; font-size: 14px; }
  .quick-messages { padding: 12px 16px 0 16px; }
  .chat-footer { padding: 12px 16px calc(16px + env(safe-area-inset-bottom)) 16px; }
}
</style>
