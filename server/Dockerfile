FROM node:20-bullseye

# Install Chromium for Puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-noto-color-emoji \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY src ./src

ENV NODE_ENV=production
ENV PORT=4100
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 4100

CMD ["node", "src/index.js"]
