# apps/web/nerdwork-plus/Dockerfile

# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm
RUN corepack enable

# Copy root package manager files for monorepo
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ./

# Install dependencies at root for monorepo
RUN pnpm install --frozen-lockfile

# Copy the frontend app source
COPY /apps/web/nerdwork-plus ./apps/web/nerdwork-plus

# Build the frontend
WORKDIR /app/apps/web/nerdwork-plus
RUN pnpm build

# Stage 2: Production
FROM node:18-alpine AS production

WORKDIR /app

RUN npm install -g pnpm
RUN corepack enable

# Copy only necessary files from builder
COPY --from=builder /app/apps/web/nerdwork-plus/.next ./.next
COPY --from=builder /app/apps/web/nerdwork-plus/public ./public
COPY --from=builder /app/apps/web/nerdwork-plus/package.json ./package.json
COPY --from=builder /app/apps/web/nerdwork-plus/node_modules ./node_modules

EXPOSE 3000

CMD ["pnpm", "start"]