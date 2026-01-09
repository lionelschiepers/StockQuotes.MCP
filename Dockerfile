# Use Node.js LTS (20.x) as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Labels for container metadata
LABEL maintainer="your-email@example.com"
LABEL description="MCP Server for fetching stock quotes from Yahoo Finance"
LABEL version="1.0.0"

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose ports for HTTP and SSE transports
EXPOSE 3000 3001

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
