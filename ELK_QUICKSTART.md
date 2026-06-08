# ELK Stack Quick Start

## Starting ELK

```bash
# Start all services
docker-compose up -d

# Verify services are healthy
docker-compose ps

# Check Elasticsearch
curl http://localhost:9200/_cluster/health
```

## Accessing Services

| Service | URL |
|---------|-----|
| **Kibana** (Logs & Metrics) | http://localhost:5601 |
| **Elasticsearch** (API) | http://localhost:9200 |
| **APM Server** | http://localhost:8200 |

## Viewing Logs in Kibana

1. Open http://localhost:5601
2. Go to **Discover**
3. Select `retailr-logs-*` index pattern
4. View real-time logs from all services

## Common Kibana Queries

```
# All logs from gateway service
service: "retailr-gateway"

# Error logs only
level: "ERROR"

# Gateway errors only
service: "retailr-gateway" AND level: "ERROR"

# Last 1 hour
@timestamp: > now-1h

# Authentication service logs
service: "retailr-auth-service"

# Catalog service logs
service: "retailr-catalog-service"

# Order service logs
service: "retailr-order-service"

# Search by message content
message: "database" OR message: "connection"
```

## Checking Service Health

```bash
# View Elasticsearch cluster health
curl http://localhost:9200/_cluster/health | jq

# List all indices
curl http://localhost:9200/_cat/indices | head

# View APM Server status
curl http://localhost:8200/

# Check Logstash stats
curl http://localhost:9600/_node/stats | jq
```

## Viewing Logs from CLI

```bash
# All logs (last 100 entries)
curl 'http://localhost:9200/retailr-logs-*/_search?size=100' | jq '.hits.hits[]._source'

# Gateway logs only
curl 'http://localhost:9200/retailr-logs-*/_search' -d '{
  "query": {"match": {"service": "retailr-gateway"}},
  "size": 50
}' | jq

# Errors only
curl 'http://localhost:9200/retailr-logs-*/_search' -d '{
  "query": {"match": {"level": "ERROR"}},
  "size": 100
}' | jq '.hits.hits[]._source | {service, level, message, "@timestamp"}'
```

## Troubleshooting Commands

```bash
# Check Logstash logs
docker logs retailr-logstash

# Check Elasticsearch logs
docker logs retailr-elasticsearch

# Check APM Server logs
docker logs retailr-apm-server

# Verify service connectivity to Logstash
docker exec retailr-gateway nc -zv logstash 5000

# View Elasticsearch indices
docker exec retailr-elasticsearch curl -s http://localhost:9200/_cat/indices?v

# Clear all logs (caution: irreversible)
docker exec retailr-elasticsearch curl -X DELETE http://localhost:9200/retailr-logs-*
```

## Application Logs in Docker

```bash
# View gateway container logs (console output)
docker logs retailr-gateway

# View auth-service container logs
docker logs retailr-auth-service

# View catalog-service container logs
docker logs retailr-catalog-service

# View order-service container logs
docker logs retailr-order-service

# Follow logs in real-time
docker logs -f retailr-gateway
```

## Stopping ELK

```bash
# Stop all services
docker-compose down

# Stop and remove data
docker-compose down -v
```

## Port Mapping

| Service | Port | Purpose |
|---------|------|---------|
| Kibana | 5601 | Web UI |
| Elasticsearch | 9200 | REST API |
| Logstash | 5000 | Log ingestion |
| APM Server | 8200 | APM metrics |

## Data Persistence

- Elasticsearch data is stored in `elasticsearch_data` Docker volume
- Logs are preserved across container restarts
- To delete all logs: `docker volume rm retailr_elasticsearch_data`

## Performance Tips

- Kibana may take 30 seconds to initialize
- First log query might be slow (index warm-up)
- Large date ranges may timeout - use specific time filters
- Consider limiting query results with `size` parameter

For detailed information, see **ELK_SETUP.md**
