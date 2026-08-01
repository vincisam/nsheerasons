FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY src ./src

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
