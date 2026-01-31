# Multi-stage build для оптимизации
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package files
COPY package.json pnpm-lock.yaml ./

# Устанавливаем pnpm и зависимости
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Копируем исходники
COPY . .

# Генерируем Prisma Client
RUN pnpm prisma generate

# Собираем приложение (клиент + сервер)
RUN pnpm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Копируем только необходимые файлы из builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# Устанавливаем переменные окружения по умолчанию
ENV NODE_ENV=production
ENV PORT=5000

# Открываем порт
EXPOSE 5000

# Запускаем приложение
CMD ["node", "dist/server.js"]
