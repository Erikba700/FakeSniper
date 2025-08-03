# FakeSniper Project

FakeSniper is an innovative project designed to analyze news articles for authenticity. The project receives a news URL and performs a comprehensive analysis to determine the credibility of the news. Here's how it works:

1. **News Collection**: FakeSniper uses SerpAPI to search for similar news articles. These articles are collected and stored in a database for further analysis.

2. **Summary Generation**: The project utilizes an API to generate concise summaries of the news articles. These summaries capture the essence of the articles and are also stored in the database.

3. **Credibility Analysis**: FakeSniper analyzes the collected news articles and their summaries to assess the truthfulness of the news. It assigns a score indicating the reliability of the news article.

The project is designed to create an extension for Google, providing a robust platform for news analysis. It is highly extensible, allowing for the integration of various AI models and services such as OpenAI and Ollama. This flexibility enables the project to adapt to different analytical needs and expand its capabilities over time.

The project is orchestrated using Docker Compose, allowing for seamless deployment and management of its microservices.


This project consists of several microservices, each serving a specific purpose. The services are orchestrated using Docker Compose.

## Microservices Overview

1. **sd_parser**: Parses and processes data.
   - **Context**: `./Microservice/SC_PARSE`
   - **Environment Variables**:
     - `DB_HOST`: Hostname for the database
     - `DB_NAME`: Database name
     - `DB_USER`: Database user
     - `DB_PASSWORD`: Database password
     - `OPENAI_API_KEY`: API key for OpenAI

2. **screenserv**: Provides screen-related services.
   - **Context**: `./Microservice/SCREENSERV`
   - **Ports**: `8210:8210`
   - **Environment Variables**:
     - `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
     - `SCREEN_WIDTH`, `SCREEN_HEIGHT`: Screen dimensions

3. **news_microservice**: Handles news data.
   - **Context**: `./Microservice/SE_SCRAP`
   - **Environment Variables**:
     - `API_KEY`: API key for news service
     - `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

4. **mariadb**: Database service.
   - **Image**: `mariadb:latest`
   - **Ports**: `3306:3306`
   - **Environment Variables**:
     - `MYSQL_ROOT_PASSWORD`, `MYSQL_USER`, `MYSQL_PASSWORD`
   - **Volumes**: `./DB:/var/lib/mysql`

5. **parser**: Parses target data.
   - **Context**: `./Microservice/TARGET_SCRAPER`
   - **Environment Variables**:
     - `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
     - `OPENAI_API_KEY`
   - **Volumes**: `./service:/app`, `./media:/media`

6. **open_ai_rate**: Handles OpenAI rate data.
   - **Context**: `./Microservice/OPEN_AI_RATE`
   - **Environment Variables**:
     - `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
     - `OPENAI_API_KEY`

7. **main_gate**: Main gateway service.
   - **Context**: `./Microservice/MAIN_GATE`
   - **Ports**: `127.0.0.1:8080:8080`
   - **Environment Variables**:
     - `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

8. **interface**: User interface service.
   - **Image**: `interface-service:latest`
   - **Context**: `./Microservice/INTERFACE`
   - **Ports**: `8200:8200`
   - **Environment Variables**:
     - `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

## Running the Project

To run the project, ensure Docker and Docker Compose are installed on your system. Then, execute the following command in the directory containing the `docker-compose.yml` file:

```bash
docker-compose up --build
```

This command will build and start all the services defined in the `docker-compose.yml` file.

## Notes

- Ensure all environment variables are correctly set in the `docker-compose.yml` file.
- The database service (`mariadb`) must be running for other services to connect to it.
- Adjust port mappings as needed to avoid conflicts with other services running on your system.
