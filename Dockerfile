FROM  ghcr.io/puppeteer/puppeteer:22.1.0

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEE_EXECUTABLE_PATH=/user/bin/google-chrome-stable

WORKDIR /user/src/app

COPY package*.json ./

RUN npm ci
COPY  . .

CMD ["node", "App.js"]
