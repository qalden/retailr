# Build stage
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /build
COPY pom.xml .
COPY gateway ./gateway
COPY auth-service ./auth-service
COPY catalog-service ./catalog-service
COPY order-service ./order-service
RUN mvn clean package -DskipTests -pl gateway -am && \
    mvn org.springframework.boot:spring-boot-maven-plugin:3.2.0:repackage -pl gateway -DskipTests

# Runtime stage
FROM maven:3.9.6-eclipse-temurin-17
WORKDIR /build
COPY pom.xml .
COPY gateway ./gateway
COPY auth-service ./auth-service
COPY catalog-service ./catalog-service
COPY order-service ./order-service
RUN mvn clean package -DskipTests -pl gateway -am
EXPOSE 8080
CMD ["mvn", "-pl", "gateway", "spring-boot:run"]
