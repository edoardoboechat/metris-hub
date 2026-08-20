#!/usr/bin/env pwsh

# Color codes for output
$Green = [System.ConsoleColor]::Green
$Red = [System.ConsoleColor]::Red
$Yellow = [System.ConsoleColor]::Yellow
$Blue = [System.ConsoleColor]::Blue
$Reset = [System.ConsoleColor]::White

function Write-Header {
    param([string]$text)
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $Blue
    Write-Host "  $text" -ForegroundColor $Blue
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$text)
    Write-Host "✅ $text" -ForegroundColor $Green
}

function Write-Error-Custom {
    param([string]$text)
    Write-Host "❌ $text" -ForegroundColor $Red
}

function Write-Warning-Custom {
    param([string]$text)
    Write-Host "⚠️  $text" -ForegroundColor $Yellow
}

function Write-Info {
    param([string]$text)
    Write-Host "ℹ️  $text" -ForegroundColor $Blue
}

# Start validation
Write-Host "`n🚀 VALIDAÇÃO COMPLETA - AETHER QUEST DOCKER COMPOSE`n" -ForegroundColor $Blue -BackgroundColor Black

Write-Header "1. VERIFICANDO CONTAINERS"

$containers = @("aether_keycloak", "aether_postgres", "aether_redis", "aether_rabbitmq")
$allRunning = $true

foreach ($container in $containers) {
    $status = docker ps --format "{{.Names}}\t{{.Status}}" | Select-String $container
    if ($status) {
        if ($status -match "Up") {
            $uptime = ($status | Select-String -Pattern "Up \d+" -AllMatches).Matches[0].Value
            Write-Success "$container - RUNNING ($uptime)"
        } else {
            Write-Error-Custom "$container - PARADO"
            $allRunning = $false
        }
    } else {
        Write-Error-Custom "$container - NÃO EXISTE"
        $allRunning = $false
    }
}

Write-Header "2. PORTAS MAPEADAS"

$ports = @{
    "Keycloak"   = "8080:8080"
    "PostgreSQL" = "5432:5432"
    "Redis"      = "6379:6379"
    "RabbitMQ"   = "5672:5672, 15672:15672"
}

foreach ($service in $ports.GetEnumerator()) {
    $portLine = docker ps --format "table {{.Names}}\t{{.Ports}}" | Select-String "aether_$(($service.Name).ToLower())"
    if ($portLine -match $service.Value) {
        Write-Success "$($service.Name) - Portas $($service.Value) ativas"
    } else {
        Write-Warning-Custom "$($service.Name) - Portas podem estar bloqueadas"
    }
}

Write-Header "3. TESTES DE CONECTIVIDADE"

# Test Redis
Write-Info "Testando Redis..."
$redisTest = docker exec aether_redis redis-cli ping 2>&1
if ($redisTest -match "PONG") {
    Write-Success "Redis - Respondendo corretamente"
} else {
    Write-Error-Custom "Redis - Não respondendo"
}

# Test PostgreSQL
Write-Info "Testando PostgreSQL..."
$pgTest = docker exec aether_postgres psql -U admin -d aether_db -c "SELECT 1;" 2>&1
if ($pgTest -match "1") {
    Write-Success "PostgreSQL - Conectado e respondendo"
} else {
    Write-Warning-Custom "PostgreSQL - Possível problema de conexão"
}

# Test RabbitMQ
Write-Info "Testando RabbitMQ..."
$rmqTest = docker exec aether_rabbitmq rabbitmq-diagnostics ping 2>&1
if ($rmqTest -match "Ping succeeded") {
    Write-Success "RabbitMQ - Respondendo corretamente"
} else {
    Write-Warning-Custom "RabbitMQ - Possível problema"
}

# Test Keycloak
Write-Info "Testando Keycloak..."
$kcTest = docker logs aether_keycloak --tail 5 2>&1
if ($kcTest -match "started in") {
    Write-Success "Keycloak - Iniciado corretamente"
} else {
    Write-Warning-Custom "Keycloak - Verifique os logs"
}

Write-Header "4. INFORMACOES DOS SERVIÇOS"

Write-Host "PostgreSQL:" -ForegroundColor $Blue
$pgVersion = docker exec aether_postgres psql -U admin -d aether_db -c "SELECT version();" 2>&1 | Select-String "PostgreSQL"
Write-Host "  $pgVersion" -ForegroundColor $Green

Write-Host "Redis:" -ForegroundColor $Blue
$redisVersion = docker exec aether_redis redis-cli INFO server 2>&1 | Select-String "redis_version"
Write-Host "  $redisVersion" -ForegroundColor $Green

Write-Header "5. URLS DE ACESSO"

Write-Host "Keycloak Admin:     http://localhost:8080/admin" -ForegroundColor $Green
Write-Host "RabbitMQ Admin:     http://localhost:15672" -ForegroundColor $Green
Write-Host "PostgreSQL:         localhost:5432" -ForegroundColor $Green
Write-Host "Redis:              redis://localhost:6379" -ForegroundColor $Green

Write-Header "6. CREDENCIAIS PADRAO"

Write-Warning-Custom "Keycloak Admin: admin / admin"
Write-Warning-Custom "PostgreSQL: admin / password"
Write-Warning-Custom "RabbitMQ: guest / guest"
Write-Warning-Custom "Redis: (sem autenticacao)"

Write-Header "7. RESUMO FINAL"

if ($allRunning) {
    Write-Success "TODOS OS CONTAINERS ESTAO RODANDO - AMBIENTE PRONTO!"
} else {
    Write-Error-Custom "ALGUNS CONTAINERS NAO ESTAO OPERACIONAIS"
    Write-Host "Tente: docker-compose restart" -ForegroundColor $Blue
}

Write-Header "8. PROXIMOS PASSOS"

Write-Host "1. Acesse Keycloak: http://localhost:8080/admin (admin/admin)"
Write-Host "2. Configure realm e clients"
Write-Host "3. Clone o projeto Spring Boot"
Write-Host "4. Configure application.yml"
Write-Host "5. Rode mvn spring-boot:run"
Write-Host ""

