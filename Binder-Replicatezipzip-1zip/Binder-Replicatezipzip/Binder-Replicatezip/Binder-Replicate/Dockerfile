# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Install dumb-init for signal handling
RUN apk update && apk add --no-cache dumb-init

# Copy package files for production dependencies
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the server
CMD ["node", "dist/index.cjs"]
