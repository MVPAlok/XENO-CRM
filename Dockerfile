FROM node:22-alpine AS base
WORKDIR /app

# Copy the package files from the backend directory to run clean install
COPY frontend-project-XENO/backend/package*.json ./
RUN npm ci

# Copy the prisma schema and generate client
COPY frontend-project-XENO/backend/prisma ./prisma
RUN npx prisma generate

# Copy the backend source files
COPY frontend-project-XENO/backend/src ./src
EXPOSE 5000

CMD ["npm", "start"]
