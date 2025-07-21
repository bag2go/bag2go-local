FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci                    # includes dev dependencies (e.g., tsc, prisma)

COPY . .
RUN npx prisma generate       # regenerate Prisma client (inside Docker)
RUN npm run build             # compile TypeScript

ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "dist/index.js"]
