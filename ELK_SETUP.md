# ELK Stack (Elasticsearch, Logstash, Kibana) Setup

This document describes the ELK stack integration for centralized logging and APM metrics across all Retailr application components.

## Overview

The ELK stack provides:
- **Elasticsearch** - Distributed search and analytics engine for storing logs and metrics
- **Logstash** - Data processing pipeline for ingesting and parsing logs
- **Kibana** - Visualization platform for exploring logs and metrics
- **Elastic APM** - Application Performance Monitoring for tracing requests across services

## Architecture

```
┌─────────────────────┐
│  Spring Boot Apps   │
│  (Gateway, Auth,    │
│   Catalog, Order)   │
└──────────┬──────────┘
           │ Logs (TCP:5000)
           │ APM Metrics (HTTP:8200)
           ▼
┌─────────────────────┐      ┌──────────────────┐
│    Logstash         │──────▶   Elasticsearch   │
│  (Data Pipeline)    │      │  (Search Engine) │
└─────────────────────┘      └────────┬─────────┘
                                      │
                                      ▼
                            ┌──────────────────┐
                            │    Kibana        │
                            │ (Visualization)  │
                            └──────────────────┘
```

## Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Kibana | http://localhost:5601 | Log and metric visualization |
| Elasticsearch | http://localhost:9200 | REST API for searching logs |
| Logstash | http://localhost:5000 | Log ingestion (TCP) |
| APM Server | http://localhost:8200 | APM metrics ingestion |

## Data Flow

### 1. Application Logs
- Each Spring Boot service sends logs to **Logstash** via TCP (port 5000)
- Configured in `logback-spring.xml` with Logstash appender
- JSON-formatted logs include:
  - Service name
  - Timestamp
  - Log level
  - Logger name
  - Message
  - Thread information

### 2. APM Metrics
- **Elastic APM Agent** automatically captures:
  - HTTP request/response data
  - Database query performance
  - Service-to-service calls
  - Error tracking
  - Response times
- Sent to **APM Server** via HTTP (port 8200)
- Configured via environment variables:
  - `ELASTIC_APM_SERVER_URLS`: APM server location
  - `ELASTIC_APM_SERVICE_NAME`: Service identifier
  - `ELASTIC_APM_ENABLED`: Enable/disable APM

## Logging Configuration

### Logback Configuration (logback-spring.xml)

Each service includes three appenders:

1. **CONSOLE** - Log output to Docker container logs
2. **FILE** - Rolling file logs with ECS encoding
3. **LOGSTASH** - TCP connection to Logstash for centralized storage

Example structure:
```xml
<appender name="LOGSTASH" class="net.logstash.logback.appender.LogstashTcpSocketAppender">
    <destination>${LOGSTASH_HOST}:${LOGSTASH_PORT}</destination>
    <encoder class="net.logstash.logback.encoder.LogstashEncoder">
        <customFields>{"service":"service-name"}</customFields>
    </encoder>
</appender>
```

### Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `LOGSTASH_HOST` | localhost | Logstash server hostname |
| `LOGSTASH_PORT` | 5000 | Logstash listening port |
| `ELASTIC_APM_SERVER_URLS` | http://localhost:8200 | APM server URL |
| `ELASTIC_APM_SERVICE_NAME` | service-name | Service identifier in APM |
| `ELASTIC_APM_ENABLED` | true | Enable/disable APM |

## Usage

### Starting the Stack

```bash
# Start all services including ELK
docker-compose up -d

# Verify services are running
docker-compose ps

# Check Elasticsearch health
curl http://localhost:9200/_cluster/health
```

### Accessing Kibana

1. Open browser: http://localhost:5601
2. Wait for Elasticsearch to initialize (may take 30 seconds on first run)
3. Index patterns are created automatically with prefix `retailr-logs-YYYY.MM.dd`

### Searching Logs in Kibana

1. Navigate to **Discover** in Kibana sidebar
2. Select index pattern `retailr-logs-*`
3. Use Kibana Query Language (KQL) to filter:
   - By service: `service: "retailr-gateway"`
   - By log level: `level: "ERROR"`
   - By timestamp: Use date picker
   - By message content: `message: "keyword"`

### APM Monitoring

1. In Kibana, navigate to **APM** (if available)
2. View:
   - Service overview and health
   - Transaction traces
   - Error rates
   - Response times
   - Database query performance

### Common Queries

```
# All errors
level: "ERROR"

# Gateway service only
service: "retailr-gateway"

# High response times
response_time: > 1000

# Failed requests
status: "500"

# Authentication errors
logger: "*Auth*" AND level: "ERROR"

# Last 15 minutes
@timestamp: > now-15m
```

## Dependencies

### Maven Dependencies Added

```xml
<!-- Logstash appender for structured logging -->
<dependency>
    <groupId>net.logstash.logback</groupId>
    <artifactId>logstash-logback-encoder</artifactId>
    <version>7.4</version>
</dependency>

<!-- Elastic Common Schema encoder -->
<dependency>
    <groupId>co.elastic.logging</groupId>
    <artifactId>logback-ecs-encoder</artifactId>
    <version>1.5.0</version>
</dependency>

<!-- Elastic APM Agent -->
<dependency>
    <groupId>co.elastic.apm</groupId>
    <artifactId>elastic-apm-agent</artifactId>
    <version>1.50.0</version>
</dependency>
```

## File Structure

```
backend/
├── logstash.conf                    # Logstash pipeline configuration
├── gateway/src/main/resources/
│   ├── application.yml              # Gateway configuration with APM settings
│   └── logback-spring.xml          # Gateway logging configuration
├── auth-service/src/main/resources/
│   ├── application.yml              # Auth service configuration
│   └── logback-spring.xml          # Auth service logging configuration
├── catalog-service/src/main/resources/
│   ├── application.yml              # Catalog service configuration
│   └── logback-spring.xml          # Catalog service logging configuration
└── order-service/src/main/resources/
    ├── application.yml              # Order service configuration
    └── logback-spring.xml          # Order service logging configuration
```

## Troubleshooting

### Elasticsearch Won't Start
```bash
# Check Docker logs
docker logs retailr-elasticsearch

# Verify memory allocation
docker stats retailr-elasticsearch

# Ensure port 9200 is available
lsof -i :9200
```

### No Logs Appearing in Kibana

1. Verify Logstash is running:
   ```bash
   docker logs retailr-logstash
   ```

2. Check Elasticsearch is healthy:
   ```bash
   curl http://localhost:9200/_cluster/health
   ```

3. Verify services can reach Logstash:
   ```bash
   docker exec retailr-gateway curl -v telnet://logstash:5000
   ```

4. Check application logs for errors:
   ```bash
   docker logs retailr-gateway | grep -i logstash
   ```

### Logstash Connection Refused

1. Ensure Logstash container is running:
   ```bash
   docker ps | grep logstash
   ```

2. Check Logstash configuration:
   ```bash
   docker logs retailr-logstash | head -50
   ```

3. Verify network connectivity:
   ```bash
   docker exec retailr-gateway ping logstash
   ```

### High Memory Usage

Elasticsearch is memory-intensive. Current configuration:
- Heap size: 512MB
- JVM memory: 512MB

To adjust:
```yaml
# In docker-compose.yml
environment:
  - "ES_JAVA_OPTS=-Xms256m -Xmx256m"  # Reduce for lower resources
```

## Performance Considerations

1. **Log Volume**: Monitor disk usage for elasticsearch_data volume
2. **Retention**: Indices are created daily; consider lifecycle policies
3. **Logstash Processing**: May need tuning for high log volume
4. **Memory**: Elasticsearch requires significant memory allocation

## Production Recommendations

1. **Security**: Enable X-Pack authentication in production
2. **Backup**: Regular Elasticsearch snapshots
3. **Monitoring**: Set up alerting for failed/missing logs
4. **Scaling**: Use Elasticsearch cluster for high-volume environments
5. **Index Lifecycle**: Implement ILM policies for log retention
6. **APM**: Configure sampling for high-traffic services

## References

- [Elasticsearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/8.13/index.html)
- [Kibana User Guide](https://www.elastic.co/guide/en/kibana/8.13/index.html)
- [Logstash Documentation](https://www.elastic.co/guide/en/logstash/8.13/index.html)
- [Elastic APM Overview](https://www.elastic.co/guide/en/apm/guide/8.13/index.html)
- [Logback Documentation](http://logback.qos.ch/)
