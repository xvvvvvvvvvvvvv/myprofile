<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { NModal, NInput, NSelect } from 'naive-ui'

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
watch(currentAgentId, (newAgent, oldAgent) => {
  if (newAgent !== oldAgent) {
    messageList.value = [] // 🌟 身份变了，清空本地记录防串戏
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
    const response = await fetch('/api/send_to_openclaw/', { // 🌟 确保路由与 Django 对应
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        command: userText, 
        messages: historyPayload, 
        sessionId: sessionId.value,
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
            {{ msg.content }}
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
/* 原有的所有样式保持不变... */

/* 🌟 新增：下拉选择器的样式微调，使其融入现有的 UI 风格 */
.agent-selector {
  width: 180px;
  font-weight: 800;
}
:deep(.n-base-selection) {
  border-radius: 8px;
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
}
:deep(.n-base-selection:hover), :deep(.n-base-selection--active) {
  background-color: rgba(241, 245, 249, 0.8) !important;
}
:deep(.n-base-selection .n-base-selection-label) {
  color: #1e293b;
}

@media (max-width: 768px) {
  .agent-selector {
    width: 150px;
  }
}
</style>
