# exposed on port 30401 on personal network

# Stage 1: Build stage
FROM node:24-alpine AS builder

# Set working directory
WORKDIR /app

# Labels for container metadata
LABEL maintainer="lionel_schiepers@hotmail.com"
LABEL description="MCP Server for fetching stock quotes from Yahoo Finance"
LABEL version="1.0.0"

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with security flags
RUN if [ -f package-lock.json ]; then npm ci --no-optional --ignore-scripts; else npm install --no-optional --ignore-scripts; fi && \
    npm cache clean --force

# Copy source code (excluding files in .dockerignore)
COPY . .

# Build TypeScript
RUN npm run build

# Stage 2: Production stage
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Labels for container metadata
LABEL maintainer="lionel_schiepers@hotmail.com"
LABEL description="MCP Server for fetching stock quotes from Yahoo Finance"
LABEL version="1.0.0"

# Copy only necessary files from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist/

# Install only production dependencies
RUN if [ -f package-lock.json ]; then npm ci --only=production --no-optional --ignore-scripts; else npm install --only=production --no-optional --ignore-scripts; fi && \
    npm cache clean --force && \
    npm r -g npm

# Switch to non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose ports for HTTP and SSE transports
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Default command - start with HTTP transport
CMD ["node", "dist/index.js", "--transport", "http"]

# Alternative commands (can be overridden at runtime)
# For stdio transport: CMD ["node", "dist/index.js", "--transport", "stdio"]
# For SSE transport: CMD ["node", "dist/index.js", "--transport", "sse"]
