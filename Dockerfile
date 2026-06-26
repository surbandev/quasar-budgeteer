# Build the Quasar frontend (requires Node 22+ for @quasar/app-vite)
FROM node:22 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# Run the Express API and serve the built UI
FROM node:22

WORKDIR /app

COPY backend/package*.json ./backend/
RUN npm ci --prefix backend --omit=dev

COPY backend/ ./backend/
COPY --from=builder /app/dist ./dist

ENV PRODUCTION=true
ENV PORT=3000

EXPOSE 3000

CMD ["node", "backend/server.js"]
