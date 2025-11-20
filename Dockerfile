FROM node:22-slim

WORKDIR /app

# Install dependencies for Chrome headless shell
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libexpat1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxshmfence1 \
    xdg-utils \
  && rm -rf /var/lib/apt/lists/*

# Install chrome-headless-shell (old headless mode)
RUN wget -O /tmp/chrome.zip \
      "https://storage.googleapis.com/chrome-for-testing-public/129.0.6668.100/linux64/chrome-headless-shell-linux64.zip" \
    && unzip /tmp/chrome.zip -d /opt/chrome \
    && mv /opt/chrome/chrome-headless-shell-linux64/chrome-headless-shell /usr/local/bin/chrome-headless-shell \
    && chmod +x /usr/local/bin/chrome-headless-shell \
    && rm -rf /tmp/chrome.zip /opt/chrome

# Debug: ensure browser exists
RUN ls -l /usr/local/bin/chrome-headless-shell

COPY package*.json ./
RUN npm install

COPY . .

RUN cd remotion_templates/TemplateHolder && npm install && cd ../.. && npm run build

EXPOSE 10000

CMD ["npm", "start"]
