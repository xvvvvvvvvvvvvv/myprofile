import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
// 🌟 1. 引入压缩插件
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    // 🌟 2. 启用 Gzip 压缩插件
    viteCompression({
      verbose: true,     // 打包时在终端输出压缩结果
      disable: false,
      threshold: 10240,  // 只处理体积大于 10KB 的文件
      algorithm: 'gzip', // 使用 gzip 压缩
      ext: '.gz',        // 生成 .gz 文件
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})