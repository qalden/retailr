# Build stage - build context should be the backend root directory
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /build
COPY pom.xml .
COPY gateway ./gateway
COPY auth-service ./auth-service
COPY catalog-service ./catalog-service
COPY order-service ./order-service
RUN mvn clean package -DskipTests -pl order-service -am && \
    mvn org.springframework.boot:spring-boot-maven-plugin:3.2.0:repackage -pl order-service -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY --from=builder /build/order-service/target/*.jar app.jar
EXPOSE 8083
CMD ["java", "-jar", "app.jar"]
