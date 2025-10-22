# Use an official Node image that allows apt installs
FROM node:20-bullseye

# Install Chromium system dependencies for Remotion/Puppeteer
RUN apt-get update && apt-get install -y \
  libnss3 \
  libatk-bridge2.0-0 \
  libx11-xcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxfixes3 \
  libxi6 \
  libxtst6 \
  libxrandr2 \
  libasound2 \
  libatk1.0-0 \
  libpangocairo-1.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libpango-1.0-0 \
  libcairo2 \
  libgbm1 && \
  rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Install dependencies
RUN npm install && \
    cd remotion_templates/TemplateHolder && npm install && cd ../.. && npm run build

# Start your backend server
CMD ["npm", "start"]
