# Build and runtime in single stage
FROM maven:3.9.6-eclipse-temurin-17
WORKDIR /build
COPY pom.xml .
COPY gateway ./gateway
COPY auth-service ./auth-service
COPY catalog-service ./catalog-service
COPY order-service ./order-service
RUN mvn clean package -DskipTests -pl auth-service -am
EXPOSE 8081
CMD ["mvn", "-pl", "auth-service", "spring-boot:run"]
