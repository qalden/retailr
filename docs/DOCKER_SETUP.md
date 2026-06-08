# Docker Setup Guide

This guide explains how to containerize and run the Retailr platform using Docker and Docker Compose.

## Prerequisites

- Docker Desktop installed (or Docker + Docker Compose)
- Minimum 4GB RAM allocated to Docker
- ~20GB disk space for images and data

## Architecture

The application consists of:

- **PostgreSQL** (5432): Database backend
- **API Gateway** (8080): Main entry point for all requests
- **Auth Service** (8081): Authentication and authorization
- **Catalog Service** (8082): Product catalog management
- **Order Service** (8083): Order management and processing
- **Frontend** (3000): React + Vite application

All services communicate through a custom Docker network and share a single PostgreSQL database.

## Quick Start

### Build and Run All Services

```bash
# Navigate to the project root
cd /path/to/retailr

# Build all images and start services
docker-compose up --build

# Services will be available at:
# - Frontend: http://localhost:3000
# - Gateway: http://localhost:8080
# - Auth Service: http://localhost:8081
# - Catalog Service: http://localhost:8082
# - Order Service: http://localhost:8083
```

### Run in Background

```bash
docker-compose up -d --build
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f catalog-service

# Last 100 lines
docker-compose logs -f --tail 100
```

### Stop Services

```bash
# Stop all services (preserves volumes)
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove everything including volumes
docker-compose down -v
```

## Development Workflow

### Working on a Specific Service

If you need to rebuild just one service:

```bash
docker-compose up -d --build catalog-service
```

### View Database

Connect to PostgreSQL from your host:

```bash
psql -h localhost -U retailr_user -d retailr_db
# Password: retailr_password
```

Or use a GUI tool:
- Host: localhost
- Port: 5432
- Username: retailr_user
- Password: retailr_password
- Database: retailr_db

### Check Service Health

```bash
docker-compose ps
```

## Configuration

### Environment Variables

Service behavior can be customized via environment variables in `docker-compose.yml`:

- `SPRING_DATASOURCE_URL`: Database connection string
- `SPRING_DATASOURCE_USERNAME`: Database user
- `SPRING_DATASOURCE_PASSWORD`: Database password
- `SPRING_JPA_HIBERNATE_DDL_AUTO`: Schema management (validate, update, create, create-drop)
- `VITE_API_BASE_URL`: Frontend API base URL

### Database Schema

By default, services use `SPRING_JPA_HIBERNATE_DDL_AUTO=validate`, which requires existing schema. To auto-create schema on first run:

1. Change `validate` to `create` in `docker-compose.yml`
2. Run `docker-compose up --build`
3. Change back to `validate` for subsequent runs

## Troubleshooting

### Services Won't Start

Check logs for errors:
```bash
docker-compose logs postgres  # Check database
docker-compose logs gateway   # Check gateway
```

### Database Connection Issues

Ensure PostgreSQL is healthy:
```bash
docker-compose exec postgres pg_isready -U retailr_user -d retailr_db
```

### Port Already in Use

If a port is already bound on your host, modify the port mapping in `docker-compose.yml`:
```yaml
ports:
  - "8080:8080"  # Change first number to use a different host port
```

### Clean Build

Remove all containers and images, then rebuild:
```bash
docker-compose down -v
docker system prune -a
docker-compose up --build
```

### Memory Issues

Increase Docker's allocated memory in Docker Desktop settings (Preferences → Resources).

## Production Considerations

This setup is optimized for local development. For production:

1. Use specific image versions instead of latest
2. Configure proper secrets management (not hardcoded passwords)
3. Set up persistent volumes properly
4. Use environment-specific compose files
5. Configure health checks and auto-restart policies
6. Set appropriate resource limits
7. Use a proper container orchestration platform (Kubernetes)

## Debugging

### Connect to a Running Container

```bash
# Interactive shell in a service
docker-compose exec catalog-service /bin/sh

# Run a command
docker-compose exec catalog-service java -version
```

### View Java Heap Dumps

Add to service environment in docker-compose.yml:
```yaml
environment:
  JAVA_TOOL_OPTIONS: -XX:+PrintGCDetails -XX:+PrintGCDateStamps
```

## Performance Tips

1. Use BuildKit for faster builds: `DOCKER_BUILDKIT=1 docker-compose build`
2. Pre-pull base images: `docker pull maven:3.9.6-eclipse-temurin-17`
3. Mount source directories for hot reload (development only)
4. Use Alpine base images for smaller footprint
