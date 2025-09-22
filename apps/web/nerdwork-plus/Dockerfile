# Stage 1: Builder
FROM node:22-alpine AS builder

# Install pnpm directly
RUN npm install -g pnpm@10.15.1

# Set working directory
WORKDIR /app

# Copy only root files needed for dependency installation
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Install dependencies at the root (monorepo level)
RUN pnpm install --frozen-lockfile

# Copy the frontend app source (excluding pre-existing node_modules)
COPY apps/web/nerdwork-plus ./apps/web/nerdwork-plus

# Reinstall to ensure workspace links are correct
RUN pnpm install --frozen-lockfile

# Build the frontend app
WORKDIR /app/apps/web/nerdwork-plus
RUN pnpm build

# Stage 2: Runner
FROM node:22-alpine AS runner

# Install pnpm directly
RUN npm install -g pnpm@10.15.1

WORKDIR /app

# Copy workspace configuration files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy the app's package.json
COPY --from=builder /app/apps/web/nerdwork-plus/package.json ./apps/web/nerdwork-plus/package.json

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built assets
COPY --from=builder /app/apps/web/nerdwork-plus/.next ./apps/web/nerdwork-plus/.next
COPY --from=builder /app/apps/web/nerdwork-plus/public ./apps/web/nerdwork-plus/public

WORKDIR /app/apps/web/nerdwork-plus

EXPOSE 3000

CMD ["pnpm", "start"]
