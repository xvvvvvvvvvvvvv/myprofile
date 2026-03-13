<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { NModal, NInput, NButton } from 'naive-ui'

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ (e: 'update:show', val: boolean): void }>()

const searchQuery = ref('')
const isSearching = ref(false)
const chatContainerRef = ref<HTMLElement | null>(null)

// 获取输入框 DOM，用于结束时自动聚焦
const inputRef = ref<InstanceType<typeof NInput> | null>(null)

// 🌟 新增：生成或获取当前访客的专属 Session ID (缓存在浏览器，刷新不丢失)
const getOrCreateSessionId = () => {
  let sid = sessionStorage.getItem('guest_session_id')
  if (!sid) {
    sid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    sessionStorage.setItem('guest_session_id', sid)
  }
  return sid
}
const sessionId = ref(getOrCreateSessionId())

// 预设快捷消息
const quickMessages = [
  '👋 你是谁？',
  '💻 介绍下你的主人',
  '🏗️ 网站架构是怎么做的？'
]

// 数据结构
interface Message {
  id: number
  role: 'user' | 'ai'
  content: string
  isError?: boolean
}
const messageList = ref<Message[]>([])

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

// 🌟 核心修复：解决拼音输入法下敲回车直接发送的逆天 Bug
const handleEnter = (e: KeyboardEvent) => {
  // 如果输入法正在拼写汉字，或者 keyCode 是 229 (中文输入法特征)，直接拦截，不发送！
  if (e.isComposing || e.keyCode === 229) {
    return
  }
  e.preventDefault() // 阻止默认换行
  handleCallOpenClaw()
}

// 核心发送逻辑
const handleCallOpenClaw = async () => {
  if (!searchQuery.value.trim() || isSearching.value) return
  
  const userText = searchQuery.value
  searchQuery.value = '' // 清空输入框
  isSearching.value = true

  // 在修改 UI 之前，先把历史对话提取并格式化成大模型认识的数组
  const historyPayload = messageList.value
    .filter(m => !m.isError && m.content) // 过滤掉报错信息和空消息
    .map(m => ({
      role: m.role === 'ai' ? 'assistant' : 'user', // 把 'ai' 映射为标准的 'assistant'
      content: m.content
    }))
  
  // 把当前用户的新问题也塞进历史数组准备发送
  historyPayload.push({ role: 'user', content: userText })

  // 1. UI 层面：把用户的话推入页面消息列表
  messageList.value.push({
    id: Date.now(),
    role: 'user',
    content: userText
  })
  scrollToBottom()

  // 2. UI 层面：预先推入一个空的 AI 消息，准备接水管
  const aiMessageId = Date.now() + 1
  messageList.value.push({
    id: aiMessageId,
    role: 'ai',
    content: ''
  })
  scrollToBottom()

  try {
    // 发送增强版的 Payload（带上历史记录和 Session ID）
    const response = await fetch('/api/portfolio/openclaw/send/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        command: userText, 
        messages: historyPayload, // 全量历史上下文
        sessionId: sessionId.value // 访客专属 ID
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
              // 找到刚才占位的 AI 消息体
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
    // 消息返回完毕后，自动让输入框重新获得焦点
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
}

// 弹窗关闭时可以不清空，保留历史记录，体验更好
watch(() => props.show, (newVal) => {
  if (newVal) {
    scrollToBottom()
    // 弹窗打开时也自动聚焦
    setTimeout(() => inputRef.value?.focus(), 300)
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
          <span class="header-title">Guest-Bot 终端</span>
        </div>
        <div class="tech-badge">
          <span class="fw-bold">OpenClaw</span> 驱动
        </div>
      </div>

      <div class="chat-body" ref="chatContainerRef">
        <div v-if="messageList.length === 0" class="empty-state">
          <div class="empty-lobster">🦞</div>
          <div class="empty-text">“找本龙虾有何贵干？”</div>
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
            {{ msg.content }}
            <span v-if="msg.role === 'ai' && isSearching && msg === messageList[messageList.length - 1]" class="cursor"></span>
          </div>
        </div>
      </div>

      <div class="chat-footer-wrapper">
        <div class="quick-messages" v-if="!isSearching && messageList.length === 0">
          <span 
            v-for="(msg, idx) in quickMessages" 
            :key="idx"
            class="quick-tag"
            @click="sendQuickMessage(msg)"
          >
            {{ msg }}
          </span>
        </div>

        <div class="chat-footer">
          <n-input 
            ref="inputRef"
            v-model:value="searchQuery" 
            type="text" 
            placeholder="输入指令..." 
            class="chat-input"
            @keydown.enter="handleEnter"
            :disabled="isSearching"
            size="large"
          >
            <template #suffix>
              <div 
                class="send-btn-icon" 
                :class="{ 'is-active': searchQuery.trim().length > 0 }"
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
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;800&display=swap');

/* ================== 外壳与毛玻璃布局 ================== */
.chat-casing {
  width: 800px;
  height: 85vh; 
  max-height: 850px;
  /* macOS 毛玻璃质感 */
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.6) inset;
  overflow: hidden;
  font-family: 'Nunito', -apple-system, sans-serif;
}

/* 头部 */
.chat-header {
  height: 64px;
  background: transparent;
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.status-dot {
  width: 10px;
  height: 10px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}
.header-title {
  font-weight: 800;
  color: #1e293b;
  font-size: 17px;
}
.tech-badge {
  font-size: 12px;
  color: #64748b;
  background: rgba(241, 245, 249, 0.8);
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid rgba(226, 232, 240, 0.8);
}
.tech-badge .fw-bold { color: #0f172a; font-weight: 800; }

/* ================== 对话区域 ================== */
.chat-body {
  flex: 1;
  padding: 24px 30px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  /* 极简网格背景 */
  background-color: rgba(248, 250, 252, 0.4);
  background-image: radial-gradient(rgba(203, 213, 225, 0.4) 1px, transparent 1px);
  background-size: 20px 20px;
}

/* 优雅的细体滚动条 */
.chat-body::-webkit-scrollbar { width: 6px; }
.chat-body::-webkit-scrollbar-track { background: transparent; }
.chat-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
.chat-body::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

.empty-state {
  margin: auto;
  text-align: center;
  transform: translateY(-20px);
}
.empty-lobster {
  font-size: 50px;
  margin-bottom: 12px;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
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
  gap: 14px;
  max-width: 88%;
}
.is-user { align-self: flex-end; flex-direction: row-reverse; }
.is-ai { align-self: flex-start; }

/* 头像微调 */
.avatar {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(0,0,0,0.06);
  background: white;
  border: 1px solid rgba(226, 232, 240, 0.6);
  padding: 2px;
}
.avatar-img { width: 100%; height: 100%; object-fit: contain; border-radius: 9px; }

/* 气泡深度优化 */
.bubble {
  padding: 14px 18px;
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
}
.is-user .bubble {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-radius: 18px 18px 4px 18px;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
}
.is-ai .bubble {
  background: rgba(255, 255, 255, 0.95);
  color: #334155;
  border-radius: 18px 18px 18px 4px;
  border: 1px solid rgba(226, 232, 240, 0.8);
}
.error-bubble {
  color: #ef4444 !important;
  background: #fee2e2 !important;
  border: 1px solid #fecaca !important;
}

/* 光标 */
.cursor {
  display: inline-block;
  width: 6px;
  height: 15px;
  background: #94a3b8;
  margin-left: 4px;
  vertical-align: middle;
  animation: blink 1s step-end infinite;
}
@keyframes blink { 50% { opacity: 0; } }

/* ================== 底部输入区 ================== */
.chat-footer-wrapper {
  background: rgba(255, 255, 255, 0.6);
  border-top: 1px solid rgba(226, 232, 240, 0.6);
  display: flex;
  flex-direction: column;
}

/* 快捷回复胶囊 */
.quick-messages {
  display: flex;
  gap: 10px;
  padding: 16px 24px 0 24px;
  overflow-x: auto;
  scrollbar-width: none;
}
.quick-messages::-webkit-scrollbar { display: none; }
.quick-tag {
  background: rgba(248, 250, 252, 0.8);
  border: 1px solid rgba(226, 232, 240, 0.8);
  color: #475569;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  box-shadow: 0 2px 5px rgba(0,0,0,0.02);
}
.quick-tag:hover {
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #059669;
  transform: translateY(-1px);
}

/* 输入框区域改进 */
.chat-footer {
  padding: 16px 24px 24px 24px;
}

:deep(.n-input) {
  border-radius: 16px;
  background-color: rgba(248, 250, 252, 0.6);
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
}
:deep(.n-input:hover), :deep(.n-input:focus-within) {
  background-color: #fff;
}
:deep(.n-input .n-input__input-el) {
  font-size: 15px;
  padding: 6px 0;
}

/* 🌟 Apple 风格的内嵌发送按钮 */
.send-btn-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e2e8f0;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  cursor: not-allowed;
  transition: all 0.3s;
}
.send-btn-icon.is-active {
  background: #10b981;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
}
.send-btn-icon.is-active:hover {
  background: #059669;
  transform: translateY(-1px);
}
</style>