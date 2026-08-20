# Aether Quest Project Workflow

## Purpose

Any LLM or coding agent working in this repository must read the material in the `copilot` folder first, before proposing changes or editing code.

The minimum reading order is:

1. `copilot/PROJECT_WORKFLOW.md`
2. `copilot/documentation/DEVELOPMENT_BASELINE.md`
3. `copilot/documentation/IMPLEMENTATION_CHECKLIST.md`

These files define the expected architecture, workflow, deployment model, and validation rules for this project.

## Working Model

This project is developed with a split workflow:

- source code is changed locally in the repository
- backend images are published manually by the project owner to:
  - `ghcr.io/edoardoboechat/coingame:latest`
- deployment happens through `docker-compose.yml`
- target operational flow is:
  - `git pull`
  - `docker compose up -d`

The compose file is expected to pull the latest backend image and recreate the app container without requiring local image builds on the target server.

## Mandatory Agent Behavior

Any LLM or agent working here should assume the following:

- do not treat the local Spring Boot process as the primary deployment model
- always consider the Docker Compose stack as a first-class runtime target
- if a change affects infrastructure, auth, routing, certificates, startup, or inter-service communication, validate it against the compose topology
- if a change affects frontend behavior, rebuild the frontend and sync it into the backend static bundle unless the user explicitly says not to
- if a backend change is meant to be exercised through the published image flow, note clearly when the source is fixed but the published GHCR image still needs to be rebuilt/pushed by the user

## Deployment Pattern

The current intended production-like topology is:

- `nginx` is the single external entry point
- `nginx` serves HTTPS
- `backend` is exposed only behind `nginx`
- `keycloak`, `adminer`, `redis-commander`, and `rabbitmq` are exposed behind `nginx` by subdomain
- internal service-to-service traffic happens on the dedicated Docker network

Expected hostnames:

- `moneyback.com.br`
- `keycloak.moneyback.com.br`
- `adminer.moneyback.com.br`
- `redis.moneyback.com.br`
- `rabbitmq.moneyback.com.br`

## Authentication And Infra Rules

- frontend API calls are expected to be same-origin by default
- login and refresh flow depend on backend-to-Keycloak communication being correct inside the compose network
- JWT validation in the backend must remain aligned with the public issuer used by Keycloak behind the HTTPS gateway
- if the gateway certificate changes, backend trust requirements must also be considered

## Certificates

The desired certificate model is:

- valid HTTPS certificates
- free issuance
- Let's Encrypt
- wildcard support for `*.moneyback.com.br` and `moneyback.com.br`
- DNS challenge using the Contabo DNS provider

The repository already contains the structure for this under:

- `infra/certbot`
- `infra/certs`

Agents should not replace this with paid certificate assumptions or local-only self-signed workflows unless explicitly asked.

## Validation Expectations

When infra or deployment changes are made, validate as much of the following as possible:

- `docker compose config`
- `docker compose up -d`
- container health/status
- HTTPS routing through `nginx`
- backend startup
- backend access to PostgreSQL, Keycloak, Redis, and RabbitMQ
- login flow through the gateway
- authenticated API flow through the gateway
- logout flow through the gateway

If something is blocked because the published image is stale, say that explicitly.

## Source Of Truth

For cross-cutting project rules, the source of truth is:

- `copilot/documentation/DEVELOPMENT_BASELINE.md`
- `copilot/documentation/IMPLEMENTATION_CHECKLIST.md`
- `README.md`

If one of these becomes outdated after a change, update it in the same task.
