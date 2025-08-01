# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Install necessary system dependencies
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies without running postinstall scripts first
RUN npm ci --omit=dev --ignore-scripts

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma client explicitly
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose the port the app runs on
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]