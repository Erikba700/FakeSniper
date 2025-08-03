FROM python:3.12-slim


WORKDIR /fakesniper

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget curl unzip gnupg fonts-liberation libnss3 libasound2 \
    libx11-xcb1 libxcomposite1 libxdamage1 libgbm1 libgtk-3-0 libu2f-udev \
    xdg-utils ca-certificates jq && \
    rm -rf /var/lib/apt/lists/*

# Download and install Google Chrome and Chromedriver
RUN CHROME_URL=$(curl -s https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json \
      | jq -r '.channels.Stable.downloads.chrome[] | select(.platform=="linux64") | .url') && \
    CHROMEDRIVER_URL=$(curl -s https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json \
      | jq -r '.channels.Stable.downloads.chromedriver[] | select(.platform=="linux64") | .url') && \
    echo "Chrome: $CHROME_URL" && echo "Driver: $CHROMEDRIVER_URL" && \
    wget -qO chrome.zip "$CHROME_URL" && unzip chrome.zip -d /opt && rm chrome.zip && \
    mv /opt/chrome-linux64/chrome /usr/local/bin/google-chrome && chmod +x /usr/local/bin/google-chrome && \
    wget -qO driver.zip "$CHROMEDRIVER_URL" && unzip driver.zip && \
    mv chromedriver-linux64/chromedriver /usr/local/bin/chromedriver && chmod +x /usr/local/bin/chromedriver && \
    ln -s /usr/local/bin/chromedriver /usr/bin/chromedriver && \
    ln -s /usr/local/bin/google-chrome /usr/bin/google-chrome

# Verify installed versions
RUN google-chrome --version && chromedriver --version

# Install Poetry
RUN pip install poetry

# Copy dependency files and install project dependencies
COPY pyproject.toml poetry.lock* ./
RUN poetry install --no-root

# Copy source code
COPY . .

EXPOSE 80

CMD ["poetry", "run", "python", "service/db_job.py"]
