FROM node:20-alpine
WORKDIR /app

# install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# copy source
COPY . .

# ensure file watchers work in containers
ENV CHOKIDAR_USEPOLLING=true

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
