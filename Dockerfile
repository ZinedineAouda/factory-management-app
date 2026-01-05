# Dockerfile for Railway deployment (root level - builds backend)
# NOTE: It's better to set Root Directory to 'backend' in Railway UI
# This is a fallback if root directory isn't set

FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm ci

# Copy backend source code
COPY backend/ ./

# Build TypeScript
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

