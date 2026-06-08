# Docker Quick Start

## Start the Application

```bash
docker-compose up --build
```

Wait for all services to start (~5-10 minutes on first run). You'll see output like:
```
retailr-frontend | VITE v6.0.1  ready in 123 ms
retailr-gateway  | Started GatewayApplication
```

## Access the Application

- **Frontend**: http://localhost:3000
- **Gateway API**: http://localhost:8080
- **Auth Service**: http://localhost:8081
- **Catalog Service**: http://localhost:8082
- **Order Service**: http://localhost:8083

## Common Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service (last 50 lines)
docker-compose logs --tail 50 -f gateway
```

### Stop Services
```bash
docker-compose stop      # Stop (preserves data)
docker-compose down      # Stop and remove containers
docker-compose down -v   # Stop and remove everything including database
```

### Rebuild a Service
```bash
docker-compose up --build catalog-service
```

### Connect to Database
```bash
# Using psql (if installed)
psql -h localhost -U retailr_user -d retailr_db
# Password: retailr_password

# Or using docker
docker-compose exec postgres psql -U retailr_user -d retailr_db
```

### Check Service Status
```bash
docker-compose ps
```

### View Service Logs
```bash
docker-compose logs -f [service-name]
```

### Debug a Service
```bash
# Interactive shell in a container
docker-compose exec gateway /bin/bash

# Run a single command
docker-compose exec gateway java -version
```

## Troubleshooting

### Services won't start
1. Check logs: `docker-compose logs gateway`
2. Ensure Docker has 4GB+ RAM allocated
3. Check port conflicts: `lsof -i :8080` (on Mac/Linux)

### Database connection errors
```bash
# Check database is healthy
docker-compose exec postgres pg_isready -U retailr_user -d retailr_db

# View database logs
docker-compose logs postgres
```

### Port already in use
Edit `docker-compose.yml` and change the first port number:
```yaml
ports:
  - "9080:8080"  # Use 9080 instead of 8080
```

### Clean rebuild
```bash
docker-compose down -v
docker system prune -a --volumes
docker-compose up --build
```

## Development Tips

### Watch Logs While Developing
```bash
# Terminal 1: Start services
docker-compose up

# Terminal 2: Watch specific service
docker-compose logs -f catalog-service
```

### Rebuild Without Rebuild Timeout
```bash
# Increase timeout for large builds
docker-compose --compatibility up --build
```

### Database Schema First Time
For initial setup, change in `docker-compose.yml`:
```yaml
SPRING_JPA_HIBERNATE_DDL_AUTO: create  # Instead of validate
```

Then run, let schemas be created, then change back to `validate`.

## File Locations

- **Docker Compose**: `docker-compose.yml`
- **Documentation**: `docs/DOCKER_SETUP.md`
- **Environment Config**: `.env.example`
- **Backend Dockerfiles**: `backend/*/Dockerfile`
- **Frontend Dockerfile**: `frontend/Dockerfile`
