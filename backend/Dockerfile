FROM eclipse-temurin:21-jdk-alpine AS base

FROM base AS build
WORKDIR /app

COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./

RUN chmod +x ./gradlew

RUN ./gradlew --no-daemon dependencies

COPY src src
RUN ./gradlew clean bootJar --no-daemon

FROM base AS run
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]