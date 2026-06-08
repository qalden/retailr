#!/bin/bash

# Service verification script for Retailr platform
# Checks if all Docker services are running and responsive

set -e

GATEWAY_URL="http://localhost:8080"
AUTH_URL="http://localhost:8081"
CATALOG_URL="http://localhost:8082"
ORDER_URL="http://localhost:8083"
FRONTEND_URL="http://localhost:3000"
DB_HOST="localhost"
DB_PORT="5432"

echo "======================================"
echo "Retailr Platform Service Verification"
echo "======================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check service
check_service() {
  local name=$1
  local url=$2
  local expected_code=${3:-200}

  echo -n "Checking $name... "

  if response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null); then
    if [ "$response" = "$expected_code" ] || [ "$response" = "000" ]; then
      echo -e "${GREEN}✓ OK${NC}"
      return 0
    else
      echo -e "${YELLOW}⚠ HTTP $response${NC}"
      return 1
    fi
  else
    echo -e "${RED}✗ FAILED${NC}"
    return 1
  fi
}

# Function to check database
check_database() {
  echo -n "Checking PostgreSQL database... "

  if command -v pg_isready &> /dev/null; then
    if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U retailr_user 2>/dev/null | grep -q "accepting connections"; then
      echo -e "${GREEN}✓ OK${NC}"
      return 0
    else
      echo -e "${YELLOW}⚠ Not ready${NC}"
      return 1
    fi
  else
    echo -e "${YELLOW}⚠ pg_isready not found${NC}"
    return 1
  fi
}

# Function to check Docker containers
check_containers() {
  echo "Docker Container Status:"
  echo "------------------------"

  services=("retailr-gateway" "retailr-auth-service" "retailr-catalog-service" "retailr-order-service" "retailr-frontend" "retailr-postgres")

  for service in "${services[@]}"; do
    status=$(docker-compose ps "$service" 2>/dev/null | tail -1 | awk '{print $NF}' || echo "not found")
    if [[ "$status" == *"Up"* ]]; then
      echo -e "$service: ${GREEN}✓ Running${NC}"
    elif [[ "$status" == *"Exited"* ]]; then
      echo -e "$service: ${RED}✗ Exited${NC}"
    else
      echo -e "$service: ${YELLOW}⚠ $status${NC}"
    fi
  done
  echo ""
}

# Main checks
echo "Container Status:"
echo "=================="
check_containers

echo "Service Health Checks:"
echo "====================="
check_service "PostgreSQL" "http://$DB_HOST:$DB_PORT"
check_database
check_service "API Gateway" "$GATEWAY_URL/actuator/health" 200
check_service "Auth Service" "$AUTH_URL/actuator/health" 200
check_service "Catalog Service" "$CATALOG_URL/actuator/health" 200
check_service "Order Service" "$ORDER_URL/actuator/health" 200
check_service "Frontend" "$FRONTEND_URL" 200

echo ""
echo "API Endpoint Tests:"
echo "=================="

# Test Gateway
echo -n "Gateway /api/health endpoint... "
if curl -s "$GATEWAY_URL/api/health" | grep -q "status"; then
  echo -e "${GREEN}✓ OK${NC}"
else
  echo -e "${YELLOW}⚠ No response${NC}"
fi

# Test Catalog Service
echo -n "Catalog /api/v1/products endpoint... "
if response=$(curl -s "$GATEWAY_URL/api/v1/products?page=0&size=5"); then
  if echo "$response" | grep -q "content\|error"; then
    echo -e "${GREEN}✓ OK${NC}"
  else
    echo -e "${YELLOW}⚠ Unexpected response${NC}"
  fi
else
  echo -e "${RED}✗ FAILED${NC}"
fi

echo ""
echo "Suggested Next Steps:"
echo "===================="
echo "1. Open frontend: $FRONTEND_URL"
echo "2. API Gateway: $GATEWAY_URL"
echo "3. View logs: docker-compose logs -f"
echo "4. Stop services: docker-compose down"
echo ""

echo "======================================"
echo "Verification Complete"
echo "======================================"
