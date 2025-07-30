# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for Prisma)
RUN npm ci && npm cache clean --force

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S afelu -u 1001

# Copy application code (needed for Prisma schema)
COPY --chown=afelu:nodejs . .

# Generate Prisma client (now that schema is available)
RUN npx prisma generate

# Remove dev dependencies to keep image small
RUN npm prune --production

# Create logs directory
RUN mkdir -p logs && chown afelu:nodejs logs

# Switch to non-root user
USER afelu

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["npm", "start"]
