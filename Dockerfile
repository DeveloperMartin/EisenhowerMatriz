# Etapa de construcción
FROM node:18-alpine AS builder
WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar archivos de dependencias
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Instalar dependencias
RUN pnpm install

# Copiar el resto del código
COPY . .

# Construir la aplicación
RUN pnpm build

# Etapa de producción
FROM node:18-alpine AS runner
WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar archivos necesarios desde la etapa de construcción
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./

# Instalar solo las dependencias de producción
RUN pnpm install --prod

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["pnpm", "start"] 