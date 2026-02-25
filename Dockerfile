FROM node:20 AS web-build
WORKDIR /build/web
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

FROM node:20-bullseye AS app

RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-noto-color-emoji \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/src ./src

# Server expects static assets in /web/dist (see server/src/index.js)
COPY --from=web-build /build/web/dist /web/dist

ENV NODE_ENV=production
ENV PORT=4100
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 4100
CMD ["node", "src/index.js"]
