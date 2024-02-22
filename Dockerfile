FROM ghcr.io/puppeteer/puppeteer:22.1.0

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /usr/src/app

COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

CMD ["node", "App.js"]
