# --- Builder Stage ---
FROM node:18-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy only root package.json + lockfile first for caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy everything else
COPY . .

# Install dependencies for backend only
RUN pnpm install --filter backend...

# Build backend
RUN pnpm build --filter backend...

# --- Runtime Stage ---
FROM node:18-alpine
WORKDIR /app

# Copy built backend only
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package.json ./
COPY --from=builder /app/node_modules ./node_modules

CMD ["node", "dist/index.js"]
