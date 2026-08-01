# Multi-stage Dockerfile for NestJS API + Prisma
# Build context: backend/ directory

# --- Stage 1: Build ---
FROM node:20-alpine AS builder
WORKDIR /app

# Install all dependencies (including devDependencies for Nest CLI & TypeScript)
COPY api/package*.json ./
RUN npm ci

# Copy API source code and Prisma configuration
COPY api ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

# Generate Prisma Client and compile NestJS app to dist/
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build

# --- Stage 2: Runner ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production-only dependencies
COPY api/package*.json ./
RUN npm ci --omit=dev

# Copy compiled dist and Prisma artifacts from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

EXPOSE 3000

# Apply pending database migrations and launch NestJS production server
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/main.js"]
