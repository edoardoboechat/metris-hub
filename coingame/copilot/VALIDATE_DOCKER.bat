@echo off
REM Script de validacao Docker Compose - Aether Quest
REM Windows CMD Version

echo.
echo =====================================================
echo  VALIDACAO COMPLETA - AETHER QUEST DOCKER COMPOSE
echo =====================================================
echo.

echo [1] Verificando containers...
echo.
docker ps --format "table {{.Names}}\t{{.Status}}"
echo.

echo [2] Testando Redis...
docker exec aether_redis redis-cli ping
echo.

echo [3] Testando PostgreSQL...
docker exec aether_postgres psql -U admin -d aether_db -c "SELECT 1;" > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] PostgreSQL esta respondendo
) else (
    echo [ERRO] PostgreSQL nao esta acessivel
)
echo.

echo [4] Testando RabbitMQ...
docker exec aether_rabbitmq rabbitmq-diagnostics ping > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] RabbitMQ esta respondendo
) else (
    echo [ERRO] RabbitMQ nao esta acessivel
)
echo.

echo [5] PostgreSQL Version:
docker exec aether_postgres psql -U admin -d aether_db -c "SELECT version();" | find "PostgreSQL"
echo.

echo [6] Redis Version:
docker exec aether_redis redis-cli INFO server | find "redis_version"
echo.

echo =====================================================
echo  URLS DE ACESSO
echo =====================================================
echo.
echo Keycloak Admin:     http://localhost:8080/admin
echo RabbitMQ Admin:     http://localhost:15672
echo PostgreSQL:         localhost:5432
echo Redis:              redis://localhost:6379
echo.

echo =====================================================
echo  CREDENCIAIS PADRAO
echo =====================================================
echo.
echo Keycloak Admin:  admin / admin
echo PostgreSQL:      admin / password
echo RabbitMQ:        guest / guest
echo Redis:           (sem autenticacao)
echo.

echo =====================================================
echo  RESUMO
echo =====================================================
echo.
echo Se todos os testes acima retornaram [OK] ou PONG,
echo seu ambiente Docker esta pronto para desenvolvimento!
echo.
echo Proximos passos:
echo 1. Acesse http://localhost:8080/admin (admin/admin)
echo 2. Configure o Realm aether-quest
echo 3. Clone o projeto Spring Boot
echo 4. Configure application.yml
echo 5. Rode: mvn spring-boot:run
echo.

