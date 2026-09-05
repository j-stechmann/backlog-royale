# Build stage
FROM node:26.8.1-alpine3.23 AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Final stage (Nginx to serve static files, unprivileged)
FROM nginxinc/nginx-unprivileged:1.31.4-alpine3.24

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose unprivileged port 8080 (default LISTEN port of nginx-unprivileged)
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
