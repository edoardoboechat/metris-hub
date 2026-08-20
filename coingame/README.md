# Aether Quest

## Overview

Aether Quest is a full-stack application composed of:

- `frontend-react-pwa`
  React application used as the main user interface during development.
- `backend-spring`
  Spring Boot application that exposes the API and serves the final compiled frontend.
- `infra`
  Infrastructure assets for Docker Compose, NGINX, certificates, Keycloak realm import, and database bootstrap.
- `docker-compose.yml`
  Unified runtime stack for the application and its dependencies.

During development, frontend and backend are worked on separately. At runtime, the frontend is embedded into the backend package and served by Spring Boot. In deployment, the application is expected to run behind NGINX through Docker Compose.

## Read This First

If you are using an LLM or coding agent on this project, instruct it to read these files first:

1. [copilot/PROJECT_WORKFLOW.md](C:\AetherQuest\project\AetherQuest\copilot\PROJECT_WORKFLOW.md)
2. [copilot/documentation/DEVELOPMENT_BASELINE.md](C:\AetherQuest\project\AetherQuest\copilot\documentation\DEVELOPMENT_BASELINE.md)
3. [copilot/documentation/IMPLEMENTATION_CHECKLIST.md](C:\AetherQuest\project\AetherQuest\copilot\documentation\IMPLEMENTATION_CHECKLIST.md)

These are the project-specific operational rules.

## Current Product Scope

The current implementation includes:

- self-registration with administrative approval
- login blocked for pending or blocked users
- admin task board for reviewing new registrations
- admin user management with search, activate, block, and delete actions
- profile management
- player play sessions, coin search, ledger, and admin game controls
- frontend i18n with English default and Portuguese available
- backend connectivity awareness in the UI
- floating toast notifications
- Docker Compose runtime with NGINX as a single HTTPS entry point

## Architecture

### Frontend

The frontend follows a layered structure:

- `src/App.js`
  High-level orchestration only.
- `src/components`
  Reusable UI building blocks.
- `src/screens`
  Screen compositions.
- `src/hooks`
  Stateful orchestration.
- `src/services`
  HTTP and backend integration.
- `src/utils`
  Stateless helpers.
- `src/constants`
  Stable app constants.
- `src/i18n`
  Language provider and dictionaries.

### Backend

The backend follows a layered Spring Boot structure:

- `controller`
  HTTP endpoints.
- `service`
  Business logic and external integrations.
- `dto`
  Request and response contracts.
- `config`
  Security and runtime configuration.

### Infrastructure

The compose stack currently includes:

- `postgres`
- `redis`
- `rabbitmq`
- `keycloak`
- `backend`
- `adminer`
- `redis-commander`
- `nginx`
- `certbot` profile for certificate issuance

## Delivery Model

This project is intended to be deployed with the following workflow:

1. source changes are made locally
2. the backend image is published manually to:
   - `ghcr.io/edoardoboechat/coingame:latest`
3. the target host runs:
   - `git pull`
   - `docker compose up -d`

The compose file is configured so the backend container pulls the latest published image on startup.

## Local Development Commands

## Java Version

The backend source and bytecode target Java 25.

- Recommended project SDK for IntelliJ: `JDK 25`
- Acceptable runtime JDK for local execution: `JDK 25`

### Frontend

Install dependencies:

```powershell
cd frontend-react-pwa
npm install
```

Run locally:

```powershell
cd frontend-react-pwa
npm start
```

Build:

```powershell
cd frontend-react-pwa
npm.cmd run build
```

Run tests:

```powershell
cd frontend-react-pwa
npm.cmd test -- --watchAll=false --passWithNoTests
```

### Backend

Run locally:

```powershell
cd backend-spring
mvn spring-boot:run
```

Compile:

```powershell
cd backend-spring
mvn -q -DskipTests compile
```

Run tests:

```powershell
cd backend-spring
mvn test
```

Package final app:

```powershell
cd backend-spring
mvn package
```

## Database Migration Policy

- The backend must not recreate the database on startup.
- Schema evolution is handled with Flyway migrations in `backend-spring/src/main/resources/db/migration`.
- Hibernate runs with schema validation only.
- If an entity or persisted field changes, add a new migration.

## Running Docker Compose On Windows With WSL

Expected environment:

- Windows host
- Docker Desktop using the WSL backend
- repository available on the Windows filesystem

From the project root:

```powershell
docker compose up -d
```

Useful commands:

```powershell
docker compose ps
docker compose logs -f nginx backend keycloak
docker compose down
```

Important notes:

- DNS for `moneyback.com.br` and the subdomains does not need to resolve locally just to start the stack.
- For local validation through the gateway before public DNS is pointed, you can test with `Host` headers.
- The compose stack uses NGINX as the single entry point on ports `80` and `443`.
- The backend itself is not published directly to the host.

## Running Docker Compose On The Final Server

Expected workflow on the server:

1. install Docker and Docker Compose plugin
2. clone the repository once
3. update with:

```bash
git pull
```

4. ensure the server can access GHCR and that Docker can pull `ghcr.io/edoardoboechat/coingame:latest`
5. create a `.env` file from `.env.example` if certificate issuance via Contabo will be used
6. start the stack:

```bash
docker compose up -d
```

Useful commands:

```bash
docker compose ps
docker compose logs -f nginx backend keycloak
docker compose pull
docker compose down
```

Notes:

- `backend` uses `pull_policy: always`, so Compose will try to pull the latest published image when recreating the container.
- The deployment host should point the public DNS records for:
  - `moneyback.com.br`
  - `keycloak.moneyback.com.br`
  - `adminer.moneyback.com.br`
  - `redis.moneyback.com.br`
  - `rabbitmq.moneyback.com.br`

## HTTPS, NGINX, And Public Routing

NGINX is the single external gateway and is configured from:

- [infra/nginx.conf](C:\AetherQuest\project\AetherQuest\infra\nginx.conf)

External routing model:

- `https://moneyback.com.br` -> application backend
- `https://keycloak.moneyback.com.br` -> Keycloak
- `https://adminer.moneyback.com.br` -> Adminer
- `https://redis.moneyback.com.br` -> Redis Commander
- `https://rabbitmq.moneyback.com.br` -> RabbitMQ Management UI

## Free Valid Certificates

The intended certificate solution is:

- Let's Encrypt
- free certificates
- wildcard support for:
  - `moneyback.com.br`
  - `*.moneyback.com.br`
- DNS challenge through Contabo

Files related to this flow:

- [infra/certbot/cli.ini](C:\AetherQuest\project\AetherQuest\infra\certbot\cli.ini)
- [infra/certbot/contabo_dns_hook.py](C:\AetherQuest\project\AetherQuest\infra\certbot\contabo_dns_hook.py)
- [infra/certs](C:\AetherQuest\project\AetherQuest\infra\certs)
- [.env.example](C:\AetherQuest\project\AetherQuest\.env.example)

### How To Issue The Certificate

1. Create a `.env` file at the project root based on `.env.example`
2. Fill:
   - `CONTABO_CLIENT_ID`
   - `CONTABO_CLIENT_SECRET`
   - `CONTABO_API_USER`
   - `CONTABO_API_PASSWORD`
   - `CERTBOT_EMAIL`
3. Run:

```powershell
docker compose --profile certbot run --rm certbot
```

After successful issuance, NGINX expects these files:

- `infra/certs/live/moneyback.com.br/fullchain.pem`
- `infra/certs/live/moneyback.com.br/privkey.pem`

Then restart the gateway:

```powershell
docker compose up -d nginx
```

### Important Certificate Note

If valid Let's Encrypt certificates are not yet present, the gateway may still be started with placeholder/self-signed material just for local validation. That is acceptable for local infrastructure checks, but it is not the final desired production state.

## Auth And Infra Alignment Notes

- Frontend requests are same-origin by default.
- Login and refresh go through the backend.
- The backend communicates with Keycloak internally on the compose network.
- JWT validation must stay aligned with the public issuer used behind the HTTPS gateway.
- If the gateway certificate changes, backend trust for that certificate must also be considered.

## Frontend Integration Into Spring Boot

When frontend behavior changes, validate that the backend is serving the current build.

Check:

- `frontend-react-pwa/build/asset-manifest.json`
- `backend-spring/target/classes/static/asset-manifest.json`

If those manifests do not point to the same bundle, the browser may still be showing an older frontend through Spring Boot.

## Documentation

Implementation standards for future work are maintained in:

- [copilot/PROJECT_WORKFLOW.md](C:\AetherQuest\project\AetherQuest\copilot\PROJECT_WORKFLOW.md)
- [copilot/documentation/DEVELOPMENT_BASELINE.md](C:\AetherQuest\project\AetherQuest\copilot\documentation\DEVELOPMENT_BASELINE.md)
- [copilot/documentation/IMPLEMENTATION_CHECKLIST.md](C:\AetherQuest\project\AetherQuest\copilot\documentation\IMPLEMENTATION_CHECKLIST.md)
