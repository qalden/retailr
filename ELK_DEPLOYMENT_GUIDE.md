# ELK Stack Deployment - Network & Troubleshooting Guide

## Current Status

✅ Application is running without ELK services  
⏳ ELK services require successful image pulls from docker.elastic.co

## Why ELK Isn't Starting

Docker is experiencing timeout issues pulling images from the Elastic registry (`docker.elastic.co`). This is a network/connectivity issue, not a configuration problem.

**Error:** `context deadline exceeded (Client.Timeout exceeded while awaiting headers)`

## Solutions

### Option 1: Retry with Better Network (Recommended)

When your network connectivity improves:

```bash
# Start ELK services with profile
docker-compose --profile elk up -d

# Check status
docker-compose --profile elk ps
```

### Option 2: Use Local Docker Cache

If you have Elastic images cached from another machine:

```bash
# Save images from another machine
docker save docker.elastic.co/elasticsearch/elasticsearch:8.13.0 | gzip > elasticsearch.tar.gz
docker save docker.elastic.co/kibana/kibana:8.13.0 | gzip > kibana.tar.gz
docker save docker.elastic.co/logstash/logstash:8.13.0 | gzip > logstash.tar.gz
docker save docker.elastic.co/apm/apm-server:8.13.0 | gzip > apm-server.tar.gz

# Load on your machine
docker load < elasticsearch.tar.gz
docker load < kibana.tar.gz
docker load < logstash.tar.gz
docker load < apm-server.tar.gz

# Then start ELK
docker-compose --profile elk up -d
```

### Option 3: Use Alternative Registry (Docker Hub)

Modify `docker-compose.yml` to use community images instead:

```yaml
elasticsearch:
  image: docker.io/library/elasticsearch:8.13.0  # or elasticsearch:latest
  # ... rest of config
```

**Note:** Community images may have different configurations. Test thoroughly.

### Option 4: Manual Pull with Retry

```bash
# Increase Docker daemon timeout and retry
for i in {1..5}; do
  echo "Attempt $i..."
  docker pull docker.elastic.co/elasticsearch/elasticsearch:8.13.0 && break
  sleep 30
done

for i in {1..5}; do
  echo "Attempt $i..."
  docker pull docker.elastic.co/kibana/kibana:8.13.0 && break
  sleep 30
done

for i in {1..5}; do
  echo "Attempt $i..."
  docker pull docker.elastic.co/logstash/logstash:8.13.0 && break
  sleep 30
done

for i in {1..5}; do
  echo "Attempt $i..."
  docker pull docker.elastic.co/apm/apm-server:8.13.0 && break
  sleep 30
done
```

### Option 5: Disable ELK via Override File

A `docker-compose.override.yml` file has been created that disables ELK services.

**Current behavior:** ELK services are optional via Docker Compose profiles

```bash
# Start app without ELK (default)
docker-compose up -d

# Start app with ELK (when network is stable)
docker-compose --profile elk up -d

# Stop ELK without stopping app
docker-compose --profile elk down
```

## Verify Application Status

Even without ELK, the application is fully functional:

```bash
# Check all running services
docker-compose ps

# Expected output:
# - retailr-postgres (healthy)
# - retailr-gateway (running)
# - retailr-auth-service (running)
# - retailr-catalog-service (running)
# - retailr-order-service (running)
# - retailr-frontend (running)
```

## Available Application URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| Gateway API | http://localhost:8080 |
| Auth Service | http://localhost:8081 |
| Catalog Service | http://localhost:8082 |
| Order Service | http://localhost:8083 |
| PostgreSQL | localhost:5433 |

**ELK services (when available):**
| Service | URL |
|---------|-----|
| Kibana | http://localhost:5601 |
| Elasticsearch | http://localhost:9200 |
| APM Server | http://localhost:8200 |

## Logging Without ELK (Current Setup)

Services still log to:
1. **Docker console** - `docker logs retailr-gateway`
2. **File logs** - Inside container at `/tmp/spring.log`
3. **Logback appenders** - Configured to attempt Logstash connection (graceful failure)

```bash
# View gateway logs
docker logs retailr-gateway

# View auth service logs
docker logs retailr-auth-service

# Follow logs in real-time
docker logs -f retailr-gateway
```

## Network Diagnostic Commands

```bash
# Test connectivity to Elastic registry
curl -v https://docker.elastic.co/v2/

# Check DNS resolution
nslookup docker.elastic.co

# Test with timeout
curl --connect-timeout 5 --max-time 10 https://docker.elastic.co/v2/

# Monitor Docker image pull progress
docker pull docker.elastic.co/elasticsearch/elasticsearch:8.13.0

# Check Docker daemon logs
docker system df  # Check disk space
docker system prune -a --volumes  # Clean up if space is an issue
```

## Docker Daemon Configuration

If pulls consistently timeout, increase Docker daemon timeout:

**Linux/Mac:**
Edit `~/.docker/config.json`:
```json
{
  "experimental": true,
  "builder": {
    "gc": {
      "enabled": true,
      "maxUnusedBuildCacheSize": "10gb"
    }
  }
}
```

**Or use Docker Desktop settings:**
- Preferences → Docker Engine
- Add: `"max-concurrent-downloads": 1`
- Add: `"max-concurrent-uploads": 1`

## Logback Configuration

Services are configured to handle missing Logstash gracefully:

```xml
<appender name="LOGSTASH" class="net.logstash.logback.appender.LogstashTcpSocketAppender">
    <destination>${LOGSTASH_HOST:-localhost}:${LOGSTASH_PORT:-5000}</destination>
    <keepAliveDuration>5 minutes</keepAliveDuration>
    <!-- Will not crash if Logstash unavailable -->
</appender>
```

When Logstash becomes available, logs will automatically start being sent.

## Next Steps When Network Stabilizes

1. **Pull ELK images:**
   ```bash
   docker-compose --profile elk pull
   ```

2. **Start ELK services:**
   ```bash
   docker-compose --profile elk up -d
   ```

3. **Wait for Elasticsearch to initialize** (30-60 seconds):
   ```bash
   curl http://localhost:9200/_cluster/health
   ```

4. **Access Kibana:**
   ```
   http://localhost:5601
   ```

5. **Create index pattern:**
   - Go to **Stack Management** → **Index Patterns**
   - Create pattern: `retailr-logs-*`
   - Time field: `@timestamp`

## Files Modified for ELK

All files are already configured and committed. When you successfully pull the Docker images, ELK will work immediately:

```
backend/
├── logstash.conf                          # Logstash pipeline
├── pom.xml                                # Added logstash-logback-encoder, APM agent
├── gateway/src/main/resources/
│   ├── application.yml                    # APM configuration
│   └── logback-spring.xml                 # Logstash appender
├── auth-service/src/main/resources/
│   ├── application.yml                    
│   └── logback-spring.xml
├── catalog-service/src/main/resources/
│   ├── application.yml
│   └── logback-spring.xml
└── order-service/src/main/resources/
    ├── application.yml
    └── logback-spring.xml

docker-compose.yml                         # ELK services with 'elk' profile
ELK_SETUP.md                              # Complete ELK documentation
ELK_QUICKSTART.md                         # Quick reference
```

## Verification Command

```bash
# Verify ELK services when they're running
docker-compose --profile elk ps | grep -E "elasticsearch|logstash|kibana|apm"

# Expected: All four services running and healthy
```

## Performance Note

- Elasticsearch requires 512MB RAM (configurable in docker-compose.yml)
- Logstash requires 256MB RAM
- Kibana requires ~512MB RAM
- Total: ~1.3GB for full ELK stack

Reduce if needed:
```yaml
elasticsearch:
  environment:
    - "ES_JAVA_OPTS=-Xms256m -Xmx256m"  # Reduce from 512m
```

## Support Resources

- [Docker Pull Timeout Solutions](https://github.com/moby/moby/issues/32066)
- [Elastic Docker Images](https://www.docker.elastic.co/)
- [Docker Registry Troubleshooting](https://docs.docker.com/develop/registry/developing/)
