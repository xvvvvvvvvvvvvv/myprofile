# ================= 第一阶段：构建打包 =================
FROM node:22-alpine AS builder

WORKDIR /app

# 复制依赖描述文件
COPY package.json package-lock.json* ./

# 🌟 优化点：使用 npm ci 保证依赖版本绝对一致，提升打包速度
RUN npm ci

# 复制所有源代码并打包 (记得在前端目录下建一个 .dockerignore 忽略 node_modules)
COPY . .
RUN npm run build

# ================= 第二阶段：Nginx 部署 =================
FROM nginx:alpine

# 🌟 优化点：替换 Nginx 默认配置，解决 Vue Router 刷新 404 的问题
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 将第一阶段打包好的 dist 目录复制到 Nginx 的默认静态文件目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露 80 端口
EXPOSE 80

# 启动 Nginx (其实 nginx:alpine 默认就是这个 CMD，不写也可以，写了更清晰)
CMD ["nginx", "-g", "daemon off;"]