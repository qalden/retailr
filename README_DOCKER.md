# Retailr Platform - Docker Setup Documentation

Complete guide for running the Retailr multi-service platform using Docker and Docker Compose.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Architecture](#architecture)
5. [Services](#services)
6. [Configuration](#configuration)
7. [Usage](#usage)
8. [Troubleshooting](#troubleshooting)
9. [Development](#development)
10. [Additional Resources](#additional-resources)

## Overview

Retailr is a production-ready microservices platform with:

- **Frontend**: React + Vite single-page application
- **Backend**: Spring Boot microservices (Gateway, Auth, Catalog, Order)
- **Database**: PostgreSQL with Flyway migrations
- **Infrastructure**: Docker containerized, orchestrated with Docker Compose

All components are containerized and can be run locally with a single command.

## Prerequisites

### Required
- **Docker Desktop** (Mac/Windows) or **Docker + Docker Compose** (Linux)
  - Minimum version: Docker 20.10+, Docker Compose 2.0+
- **4GB+ RAM** allocated to Docker
- **20GB+ free disk space** for images and data volumes

### Optional
- `psql` (PostgreSQL client) for direct database access
- `curl` for API testing
- `jq` for JSON formatting

### Verify Installation

```bash
docker --version
docker-compose --version
```

## Quick Start

### 1. Clone the Repository

```bash
cd /path/to/retailr
```

### 2. Start All Services

```bash
docker-compose up --build
```

**First run takes 10-15 minutes** (Maven builds Java services)

**Subsequent runs take 1-2 minutes**

### 3. Access the Application

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Web application |
| Gateway | http://localhost:8080 | API gateway |
| Auth Service | http://localhost:8081 | Authentication |
| Catalog Service | http://localhost:8082 | Products & inventory |
| Order Service | http://localhost:8083 | Orders & shipping |

### 4. Verify Services

```bash
./verify-services.sh
```

### 5. Stop Services

```bash
docker-compose down
```

Or with volume cleanup:

```bash
docker-compose down -v
```

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────┐
│         Frontend (React + Vite)         │
│              (localhost:3000)           │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│      API Gateway (Spring Boot)          │
│              (localhost:8080)           │
└─┬────────┬────────────┬────────────────┘
  │        │            │
  ▼        ▼            ▼
┌──────┐ ┌─────────┐ ┌─────────┐
│Auth  │ │Catalog  │ │ Order   │
│Svc   │ │Service  │ │ Service │
│8081  │ │ 8082    │ │ 8083    │
└──────┘ └────┬────┘ └────┬────┘
              │           │
              └─────┬─────┘
                    │
           ┌────────▼────────┐
           │   PostgreSQL    │
           │    (localhost)  │
           │      :5432      │
           └─────────────────┘
```

### Communication

- **Synchronous**: HTTP/REST with circuit breaker pattern
- **Internal Network**: Docker bridge network (`retailr-network`)
- **Database**: Shared PostgreSQL instance
- **Service Discovery**: Docker DNS (service names resolve to containers)

## Services

### Frontend (`retailr-frontend`)

- **Technology**: React 18 + Vite 6
- **Port**: 3000
- **Build**: Multi-stage (Node builder + Alpine)
- **Size**: ~150MB image

**Features**:
- Hot module replacement (HMR) during development
- TypeScript strict mode
- Redux state management
- Responsive UI with Tailwind CSS

### API Gateway (`retailr-gateway`)

- **Technology**: Spring Boot 3.2 + Spring Cloud Gateway
- **Port**: 8080
- **Base Image**: Eclipse Temurin 17 JDK
- **Build Time**: 3-5 minutes

**Responsibilities**:
- Route requests to appropriate services
- Load balancing
- Authentication/authorization
- Rate limiting
- CORS handling

### Auth Service (`retailr-auth-service`)

- **Technology**: Spring Boot 3.2 + Spring Security
- **Port**: 8081
- **Build Time**: 3-5 minutes

**Responsibilities**:
- User authentication (JWT)
- Token generation and validation
- User management
- RBAC implementation

### Catalog Service (`retailr-catalog-service`)

- **Technology**: Spring Boot 3.2 + Spring Data JPA
- **Port**: 8082
- **Build Time**: 3-5 minutes

**Responsibilities**:
- Product management
- Inventory tracking (SKU, quantity)
- Category management
- Product search & filtering

### Order Service (`retailr-order-service`)

- **Technology**: Spring Boot 3.2 + Spring Data JPA
- **Port**: 8083
- **Build Time**: 3-5 minutes

**Responsibilities**:
- Order creation and management
- Order status tracking
- Shipping management
- Payment processing integration

### PostgreSQL Database

- **Technology**: PostgreSQL 16 Alpine
- **Port**: 5432
- **Volume**: `postgres_data` (persistent)
- **Credentials**: 
  - User: `retailr_user`
  - Password: `retailr_password`
  - Database: `retailr_db`

**Features**:
- Health checks (pg_isready)
- Automatic schema migrations (Flyway)
- Connection pooling

## Configuration

### Environment Variables

See `.env.example` for all configurable options:

```bash
# Database
POSTGRES_USER=retailr_user
POSTGRES_PASSWORD=retailr_password
POSTGRES_DB=retailr_db

# Spring Boot
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/retailr_db
SPRING_JPA_HIBERNATE_DDL_AUTO=validate

# API Configuration
VITE_API_BASE_URL=http://localhost:8080
```

### Customization

Create a `.env` file with custom values:

```bash
cp .env.example .env
# Edit .env with your values
docker-compose up --build
```

### Schema Management

First run requires schema creation:

1. Change in `docker-compose.yml`:
   ```yaml
   SPRING_JPA_HIBERNATE_DDL_AUTO: create
   ```

2. Start services (schemas created automatically)

3. Change back to:
   ```yaml
   SPRING_JPA_HIBERNATE_DDL_AUTO: validate
   ```

## Usage

### Basic Commands

```bash
# Start all services in foreground
docker-compose up

# Start in background
docker-compose up -d

# Build images without starting
docker-compose build

# Rebuild without using cache
docker-compose build --no-cache

# Stop services
docker-compose stop

# Remove containers
docker-compose down

# Remove everything including volumes
docker-compose down -v
```

### Logs

```bash
# All services
docker-compose logs -f

# Specific service (last 50 lines)
docker-compose logs --tail 50 -f gateway

# Service output without timestamps
docker-compose logs --no-log-prefix -f catalog-service
```

### Service Management

```bash
# Status check
docker-compose ps

# Rebuild single service
docker-compose up --build catalog-service

# Restart service
docker-compose restart order-service

# View resource usage
docker stats

# Execute command in container
docker-compose exec gateway ps aux

# Interactive shell
docker-compose exec postgres /bin/bash
```

### Testing & Verification

```bash
# Run verification script
./verify-services.sh

# Test specific endpoint
curl http://localhost:8080/api/v1/products

# Test with authentication
TOKEN=$(curl -s http://localhost:8080/auth/token)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/orders
```

## Troubleshooting

### Services Won't Start

**Check logs first:**
```bash
docker-compose logs gateway
```

**Common issues:**

1. **Port in use**
   ```bash
   # Find process using port
   lsof -i :8080
   
   # Either kill process or change port in docker-compose.yml
   ```

2. **Insufficient memory**
   - Allocate more RAM to Docker (4GB minimum)
   - Monitor with: `docker stats`

3. **Disk space**
   - Check available space: `df -h`
   - Clean up: `docker system prune -a`

### Database Issues

```bash
# Check database health
docker-compose exec postgres pg_isready -U retailr_user -d retailr_db

# Connect to database
docker-compose exec postgres psql -U retailr_user -d retailr_db

# View database logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up
```

### Service Communication Issues

```bash
# Test service-to-service connectivity
docker-compose exec gateway curl http://catalog-service:8082/actuator/health

# Check network
docker network inspect retailr_retailr-network

# View Docker DNS resolution
docker-compose exec gateway cat /etc/resolv.conf
```

### Performance Issues

```bash
# Monitor CPU/Memory
docker stats

# Check container logs for errors
docker-compose logs --tail 100 -f

# View Java process details
docker-compose exec gateway jps -lm
```

## Development

### Local Development Workflow

**Option 1: Full Docker (Recommended)**
```bash
docker-compose up --build
```

**Option 2: Docker Services + Local Code**

Edit `docker-compose.yml` to remove frontend and run locally:
```bash
docker-compose up -d --build  # Start backend services only
npm run dev                    # Run frontend locally
```

### Debugging

**Java Application Debugging**

Add to service environment in `docker-compose.yml`:
```yaml
environment:
  JAVA_TOOL_OPTIONS: "-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005"
```

Then connect debugger to `localhost:5005`

**Frontend Development**

```bash
# Extract frontend from compose and run locally
npm install
npm run dev  # Vite dev server with HMR
```

### Building for Production

```bash
# Build optimized images
docker-compose build

# Tag images for registry
docker tag retailr-gateway myregistry/retailr-gateway:1.0.0
docker push myregistry/retailr-gateway:1.0.0

# Use in production with proper secrets management
```

## Additional Resources

### Documentation Files

- `DOCKER_SETUP.md` - Detailed setup guide
- `DOCKER_QUICKSTART.md` - Quick reference
- `docs/TESTING_DOCKER_SETUP.md` - Testing procedures
- `docs/SEARCH_FILTERING.md` - Search/filter features

### External References

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Spring Boot Docker Documentation](https://spring.io/guides/spring-boot-docker/)
- [Vite Documentation](https://vitejs.dev/)

### Health Check Endpoints

All services expose health endpoints:
```
GET http://localhost:8080/actuator/health
GET http://localhost:8081/actuator/health
GET http://localhost:8082/actuator/health
GET http://localhost:8083/actuator/health
```

### Metrics & Monitoring

Services expose metrics endpoints:
```
GET http://localhost:8080/actuator/metrics
GET http://localhost:8081/actuator/metrics
```

View specific metric:
```
GET http://localhost:8080/actuator/metrics/jvm.memory.used
```

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Run verification: `./verify-services.sh`
3. Review troubleshooting section above
4. Check documentation files
