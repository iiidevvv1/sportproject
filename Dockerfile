# Build client
FROM node:22-alpine AS client-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm ci
COPY tsconfig.base.json ./
COPY version.json ./
COPY client/ ./client/
RUN npm run build -w client

# Build server
FROM node:22-alpine AS server-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm ci
COPY tsconfig.base.json ./
COPY server/ ./server/
RUN npm run build -w server

# Production
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm ci --omit=dev
COPY --from=client-build /app/client/dist ./client/dist
COPY --from=server-build /app/server/dist ./server/dist
COPY version.json ./client/dist/

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "server/dist/index.js"]
