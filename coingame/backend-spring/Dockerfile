FROM eclipse-temurin:21-jre

WORKDIR /app

# Copia o jar gerado pelo build
COPY backend-spring/target/*.jar app.jar

# Reduz o consumo de memória com flags de JVM
ENV JAVA_OPTS="-Xms256m -Xmx1024m -XX:+UseG1GC"

# Porta padrão que o Spring vai expor
EXPOSE 80

# Entrypoint configurável para permitir passar flags
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
