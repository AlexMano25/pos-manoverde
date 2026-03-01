# ============================================================
# POS Mano Verde - Backend Dockerfile
# Multi-stage build for minimal production image
# ============================================================

# --- Stage 1: Build native dependencies ---
FROM node:20-alpine AS builder

# Install build tools required by better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /build

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --production

# --- Stage 2: Production image ---
FROM node:20-alpine

# Labels
LABEL maintainer="Mano Verde SA"
LABEL description="POS Mano Verde - Point of Sale backend server"
LABEL version="1.0.0"

# Install wget for healthcheck (curl not available in alpine by default)
RUN apk add --no-cache wget

WORKDIR /app

# Copy built node_modules from builder stage
COPY --from=builder /build/node_modules ./node_modules

# Copy source files
COPY package.json ./
COPY src ./src

# Create data directory for SQLite persistence
RUN mkdir -p /data

# Environment
ENV NODE_ENV=production
ENV PORT=4000
ENV DB_PATH=/data/pos.db

# Expose the server port
EXPOSE 4000

# Volume for persistent database storage
VOLUME ["/data"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

# Start the server
CMD ["node", "src/index.js"]
