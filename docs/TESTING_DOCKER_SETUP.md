# Testing Docker Setup

This guide provides step-by-step instructions for testing the Retailr platform running in Docker.

## Prerequisites

- All Docker services should be running: `docker-compose ps`
- Services should show as "Up" status
- Database should be accessible

## Quick Verification

Run the automated verification script:

```bash
./verify-services.sh
```

This will check:
- All containers are running
- Database is accessible
- All services respond to health checks
- API endpoints return expected responses

## Manual Testing

### 1. Check Container Status

```bash
docker-compose ps
```

Expected output:
```
NAME                    STATUS      PORTS
retailr-postgres        Up          5432/tcp
retailr-gateway         Up          0.0.0.0:8080->8080/tcp
retailr-auth-service    Up          0.0.0.0:8081->8081/tcp
retailr-catalog-service Up          0.0.0.0:8082->8082/tcp
retailr-order-service   Up          0.0.0.0:8083->8083/tcp
retailr-frontend        Up          0.0.0.0:3000->3000/tcp
```

### 2. Test Frontend

Open in browser: http://localhost:3000

You should see:
- Retailr application loaded
- Navigation menu visible
- No console errors

### 3. Test Backend Services

#### Health Checks (Spring Boot Actuator)

```bash
# Gateway health
curl http://localhost:8080/actuator/health

# Auth Service health
curl http://localhost:8081/actuator/health

# Catalog Service health
curl http://localhost:8082/actuator/health

# Order Service health
curl http://localhost:8083/actuator/health
```

Expected response:
```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "PostgreSQL",
        "result": 1
      }
    },
    "livenessState": {
      "status": "UP"
    },
    "readinessState": {
      "status": "UP"
    }
  }
}
```

#### API Endpoints

```bash
# List products (through gateway)
curl http://localhost:8080/api/v1/products?page=0&size=5 | jq

# List orders (through gateway)
curl http://localhost:8080/api/v1/orders?page=0&size=5 | jq

# Catalog service directly
curl http://localhost:8082/api/v1/products?page=0&size=5 | jq
```

### 4. Test Database Connectivity

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U retailr_user -d retailr_db

# Inside psql:
\dt                  # List tables
SELECT * FROM products LIMIT 5;  # Query products
\q                   # Exit
```

Or using psql from your machine (if installed):

```bash
psql -h localhost -U retailr_user -d retailr_db
# Password: retailr_password
```

### 5. Test Logs

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f gateway

# View last N lines
docker-compose logs --tail 50 -f catalog-service

# View logs for multiple services
docker-compose logs -f gateway catalog-service order-service
```

### 6. Test Service Communication

Services communicate internally through the Docker network. Test if one service can reach another:

```bash
# From gateway container, test if it can reach catalog-service
docker-compose exec gateway curl http://catalog-service:8082/actuator/health

# From frontend container
docker-compose exec frontend curl http://gateway:8080/actuator/health
```

## Performance Testing

### Load Testing Gateway

Use Apache Bench (if installed):

```bash
# 100 requests with 10 concurrent
ab -n 100 -c 10 http://localhost:8080/api/v1/products?page=0&size=5
```

Or using curl in a loop:

```bash
for i in {1..10}; do
  curl -s http://localhost:8080/api/v1/products | jq '.totalElements'
done
```

### Database Query Performance

```bash
docker-compose exec postgres psql -U retailr_user -d retailr_db -c "
  EXPLAIN ANALYZE SELECT * FROM products LIMIT 10;
"
```

## Troubleshooting

### Service Won't Start

1. Check logs:
   ```bash
   docker-compose logs gateway
   ```

2. Verify database is healthy:
   ```bash
   docker-compose exec postgres pg_isready -U retailr_user -d retailr_db
   ```

3. Check environment variables:
   ```bash
   docker-compose config | grep SPRING_DATASOURCE
   ```

### Database Connection Issues

```bash
# Check if postgres is running
docker-compose ps postgres

# Check postgres logs
docker-compose logs postgres

# Try connecting
docker-compose exec postgres psql -U retailr_user -d retailr_db -c "SELECT 1;"
```

### Port Conflicts

If ports are already in use:

1. Find what's using the port:
   ```bash
   lsof -i :8080
   ```

2. Either kill that process or change ports in docker-compose.yml

3. Rebuild and restart:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

### Memory Issues

If services are slow or crashing:

1. Check Docker's allocated memory:
   - Mac: Docker Desktop → Preferences → Resources
   - Windows: Docker Desktop → Settings → Resources

2. Monitor container resource usage:
   ```bash
   docker stats
   ```

## Integration Testing Scenarios

### Scenario 1: Product Catalog Flow

1. Frontend loads product list: http://localhost:3000
2. Request goes through Gateway to Catalog Service
3. Catalog Service queries PostgreSQL
4. Response returns through Gateway to Frontend

### Scenario 2: Order Processing Flow

1. User creates order in Frontend
2. Request goes to Gateway → Order Service
3. Order Service validates using Catalog Service (circuit breaker pattern)
4. Order saved to PostgreSQL
5. Frontend receives confirmation

### Scenario 3: Authentication Flow

1. User logs in on Frontend
2. Frontend calls Gateway auth endpoint
3. Gateway routes to Auth Service
4. Auth Service validates credentials against PostgreSQL
5. JWT token returned to Frontend

## Performance Benchmarks (Expected)

| Endpoint | Response Time | Notes |
|----------|---------------|-------|
| GET /products | <200ms | Local network |
| GET /orders | <300ms | Includes order items |
| GET /health | <50ms | Spring Boot Actuator |
| POST /orders | <500ms | Includes validation |

## Next Steps

- Run automated tests: `npm test` (frontend)
- Run backend tests: `mvn test` (backend)
- Load test with more realistic data
- Monitor using Docker dashboard or tools like Portainer
