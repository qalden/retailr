# Build stage
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /build
COPY pom.xml .
COPY gateway/src ./gateway/src
COPY auth-service/src ./auth-service/src
COPY catalog-service/src ./catalog-service/src
COPY order-service/src ./order-service/src
RUN mvn clean package -DskipTests -pl gateway -am

# Runtime stage
FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY --from=builder /build/gateway/target/*.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
