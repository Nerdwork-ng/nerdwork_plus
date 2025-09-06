# --- Stage 1: Builder ---
FROM node:18-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy only root files for dependency install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/nerdwork-plus/package.json ./apps/web/nerdwork-plus/

# Install dependencies (workspace-aware)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build frontend
WORKDIR /app/apps/web/nerdwork-plus
RUN pnpm build

# --- Stage 2: Production ---
FROM node:18-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Copy only required artifacts
COPY --from=builder /app/apps/web/nerdwork-plus/.next ./.next
COPY --from=builder /app/apps/web/nerdwork-plus/public ./public
COPY --from=builder /app/apps/web/nerdwork-plus/package.json ./package.json

# Install only production deps for web app
RUN npm install -g pnpm \
    && pnpm install --prod --frozen-lockfile

EXPOSE 3000
CMD ["pnpm", "start"]
