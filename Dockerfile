# ============================================
# Stage 1: Build React/Next.js Application
# ============================================
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Sử dụng npm ci để cài đặt dependencies từ package-lock.json (nhanh và deterministic)
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build application
# Output sẽ ở thư mục /app/dist hoặc /app/build tùy thuộc vào framework
RUN npm run build

# ============================================
# Stage 2: Nginx Production Server
# ============================================
FROM nginx:alpine

# Copy built assets từ builder stage
# React/Vite thường build vào /app/dist
# Create React App thường build vào /app/build
# Next.js build vào /app/.next và /app/out (nếu export static)
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
# Cấu hình này handle React Router, Next.js routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (nginx default)
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]