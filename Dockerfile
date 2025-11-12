FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package.json
COPY package-lock.json package-lock.json

# Install dependencies
RUN npm ci

# Copy application
COPY . .

# Expose port
EXPOSE 8080

# Start application
CMD ["npm", "start"]
