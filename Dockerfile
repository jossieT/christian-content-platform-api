# Single-stage Dockerfile for NestJS API + Prisma
# Build context: backend/ directory (repo root)
FROM node:20-alpine
WORKDIR /app

# Install all dependencies (including devDeps for TypeScript & Nest CLI)
COPY api/package*.json ./
RUN npm ci

# Copy API source code and Prisma configuration
COPY api/ ./
COPY prisma/ ./prisma/
COPY prisma.config.ts ./

# Generate Prisma Client
RUN npx prisma generate --schema=./prisma/schema.prisma

# Compile TypeScript to dist/
RUN npm run build

# Remove devDependencies to slim the image
RUN npm prune --omit=dev

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/src/main.js"]
