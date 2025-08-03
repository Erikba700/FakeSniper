# Use the official Python image as a parent image
FROM python:3.12-slim

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install system dependencies for Playwright
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxcomposite1 \
    libxrandr2 \
    libxdamage1 \
    libxkbcommon0 \
    libgbm1 \
    libpango-1.0-0 \
    libxshmfence1 \
    libglu1-mesa \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir poetry

# Install project dependencies
RUN poetry install --no-root

# Install Playwright browsers
RUN poetry run playwright install

# Install Playwright system dependencies
RUN poetry run playwright install-deps

# Set PATH for poetry
ENV PATH="/root/.local/bin:$PATH"

# Expose port 80
EXPOSE 80

# Run your script
ENTRYPOINT ["poetry", "run", "python", "service/screenshot_job.py"]
