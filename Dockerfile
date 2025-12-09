# Production multi-stage build: build static assets and serve with nginx
FROM node:20-alpine AS builder
WORKDIR /app

# install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --silent

# copy source and build
COPY . .
# Allow `VITE_API_URL` to be set at build time.
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# --- FINAL STAGE ---
FROM nginx:stable-alpine AS runner

# 🛡️ SECURITY FIX: Update Alpine packages to patch vulnerabilities
RUN apk update && apk upgrade

# Remove default nginx content and copy build
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html

# Ensure nginx runtime directories exist and are writable by an arbitrary UID.
# OpenShift runs containers with an arbitrary non-root UID.
RUN mkdir -p /var/cache/nginx/client_temp /var/cache/nginx /var/run && \
    chmod -R 0777 /var/cache/nginx /var/run /usr/share/nginx/html

# Add a simple nginx config to support SPA routing (fallback to index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
STOPSIGNAL SIGTERM

CMD ["nginx", "-g", "daemon off;"]