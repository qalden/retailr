# Build and runtime in single stage
FROM maven:3.9.6-eclipse-temurin-17
WORKDIR /build
COPY pom.xml .
COPY gateway ./gateway
COPY auth-service ./auth-service
COPY catalog-service ./catalog-service
COPY order-service ./order-service
RUN mvn clean package -DskipTests -pl catalog-service -am
EXPOSE 8082
CMD ["mvn", "-pl", "catalog-service", "spring-boot:run"]
