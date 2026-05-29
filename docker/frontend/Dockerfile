FROM node:20-alpine AS builder

WORKDIR /app

# Зависимости (кэшируются)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_KEY=$NEXT_PUBLIC_API_KEY
COPY package*.json ./
RUN npm ci

# Исходный код и сборка
COPY . .
RUN npm run build

# --- Production образ ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Только нужные файлы из builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
