# Use Node.js
FROM node:18

# Create app directory
WORKDIR /app

# Copy files
COPY server/package*.json ./server/
WORKDIR /app/server

# Install dependencies
RUN npm install

# Copy rest of the code
COPY server .

# Expose port
EXPOSE 4000

# Start server
CMD ["npm", "start"]