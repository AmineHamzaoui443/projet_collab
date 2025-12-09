# Production multi-stage build: build static assets and serve with nginx
FROM node:20-alpine AS builder
WORKDIR /app

# install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --silent

# copy source and build
COPY . .
# Allow `VITE_API_URL` to be set at build time. Do NOT bake a default
# development host into the production image. If no build-arg is provided
# the value will be an empty string which the client treats as unset and
# falls back to the safer relative `/api` path (so the static server can
# proxy requests to the backend in-cluster).
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

FROM nginx:stable-alpine AS runner

# Remove default nginx content and copy build
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html

# Ensure nginx runtime directories exist and are writable by an arbitrary UID.
# OpenShift runs containers with an arbitrary non-root UID, so directories that
# Nginx needs to write (client_temp, run) must be world-writable or owned by
# that UID. We set permissive permissions at build time so the container can
# start without requiring root at runtime.
RUN mkdir -p /var/cache/nginx/client_temp /var/cache/nginx /var/run && \
	chmod -R 0777 /var/cache/nginx /var/run /usr/share/nginx/html

# Add a simple nginx config to support SPA routing (fallback to index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
STOPSIGNAL SIGTERM

CMD ["nginx", "-g", "daemon off;"]
