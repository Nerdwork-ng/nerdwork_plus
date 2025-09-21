# Stage 1: Builder
FROM node:18-alpine AS builder

# Enable corepack (so pnpm works)
RUN corepack enable

WORKDIR /app

# Copy only package manager files first
COPY package.json pnpm-lock.yaml ./

# Install deps at root
RUN pnpm install --frozen-lockfile

# Copy the full project (after deps)
COPY . .

# Move into your app folder and build
WORKDIR /app/apps/web/nerdwork-plus
RUN pnpm build


# Stage 2: Runner
FROM node:18-alpine AS runner

WORKDIR /app

# Copy only what we need from builder
COPY --from=builder /app/apps/web/nerdwork-plus/.next ./.next
COPY --from=builder /app/apps/web/nerdwork-plus/public ./public
COPY --from=builder /app/apps/web/nerdwork-plus/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["pnpm", "start"]
