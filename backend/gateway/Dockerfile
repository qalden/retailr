# Build stage
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /build
COPY pom.xml .
COPY gateway ./gateway
COPY auth-service ./auth-service
COPY catalog-service ./catalog-service
COPY order-service ./order-service
RUN mvn clean package -DskipTests -pl gateway -am

# Runtime stage
FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY --from=builder /build/gateway/target/*.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
