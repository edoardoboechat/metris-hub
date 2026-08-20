# Aether Quest Development Baseline

## Objective

This document is the operational baseline for future development in Aether Quest.
It defines architecture, implementation patterns, build flow, integration rules between frontend and backend, and the minimum quality bar expected before any delivery.

Use this file as the first reference before adding screens, APIs, services, or infrastructure changes.

Operational note for any coding agent:

- Read `copilot/PROJECT_WORKFLOW.md` before changing code or infra for this repository.

## Working Branch Context

Current active implementation work is expected to happen on:

- `feature`

Branch intent:

- `master`
  stable baseline
- `develop`
  integration branch
- `feature`
  ongoing implementation work

Do not assume work should happen directly on `master`.

## Solution Shape

The project is split into two main applications during development:

- `frontend-react-pwa`
  React application used as the main UI workspace.
- `backend-spring`
  Spring Boot application that exposes APIs and serves the final frontend bundle.

At runtime, the final app must be deliverable as a Spring Boot application with the latest compiled frontend embedded into:

- `backend-spring/target/classes/static`

## Java Toolchain Baseline

The backend compatibility target is Java 25.

- Use `JDK 25` as the IntelliJ project SDK when possible.
- Use `JDK 25` for Maven import and Maven runner configuration.
- Do not treat `JDK 26` as the project compatibility baseline even if it can launch Maven locally.

Reason:

- IDE builds and annotation-processing integrations can fail on newer `javac` internals before the rest of the stack is ready.
- The repository does not require Lombok, so the backend should stay free of unnecessary annotation-processor dependencies.

This means any relevant frontend change must be followed by a rebuild and resource synchronization so the backend serves the current UI bundle.
Do not stop after a successful frontend-only build if the backend is expected to serve the app; finish by syncing the new frontend bundle into the backend output.

## Frontend Architecture

The frontend must follow a layered structure and should not collapse back into a single-file implementation.

### Current frontend layers

- `src/App.js`
  Thin composition layer and high-level orchestration only.
- `src/components`
  Reusable presentation blocks.
- `src/screens`
  Screen-level compositions and user flows.
- `src/hooks`
  Stateful orchestration and app/session flow.
- `src/services`
  HTTP/API access and integration with backend endpoints.
- `src/utils`
  Stateless utilities such as JWT parsing and persistence helpers.
- `src/constants`
  Stable constants and initial state.
- `src/i18n`
  Internationalization provider and dictionaries.

### Frontend rules

- Treat the application as mobile-first by default.
- Design and validate layouts primarily for phone screens before expanding them for tablet or desktop.
- Assume the primary runtime context is a mobile browser on a real device, not only a desktop browser.
- Keep UI text out of components whenever possible.
- All user-facing strings must go through i18n.
- Default locale is English.
- Portuguese must always be available.
- The language switcher must remain accessible before and after login.
- New screens must be created under `src/screens`.
- Shared primitives must go under `src/components`.
- API calls must not be embedded directly into screen files if they are reusable.
- Session, auth, or polling logic belongs in hooks/services, not in presentational components.
- Avoid putting business rules in JSX trees.
- Preserve the current visual language unless the task explicitly asks for redesign.
- Toast notifications must use the shared floating pattern and auto-close after 10 seconds.
- Split-screen pages should use the shared resizable layout with `30/70` as the default ratio.
- The split ratio should remain persisted locally for user continuity.
- New layouts must remain usable on narrow mobile widths without requiring horizontal scrolling.
- Actions, forms, dialogs, and navigation must be touch-friendly and readable on phone-sized screens.
- Any camera, geolocation, or device capability flow must be evaluated with mobile browser constraints in mind.
- Header content must not overlap navigation or block interaction.
- Backend connectivity state must be represented in the UI and respected by backend-dependent actions.

## Backend Architecture

The backend must keep a layered Spring Boot structure.

### Current backend layers

- `controller`
  HTTP entrypoints and request/response binding.
- `service`
  Business logic, Keycloak integration, orchestration, and access rules.
- `dto`
  API payload contracts.
- `config`
  Security and platform configuration.
- `exception`
  Error contract and centralized handling.

### Backend rules

- Controllers should stay thin.
- Business logic belongs in services.
- DTOs define the external contract and should not contain business logic.
- New integrations should be isolated behind services.
- Cross-cutting access validation should remain centralized.
- Error responses must stay consistent with the global exception handler.
- Security changes must be reflected in `SecurityConfig`.
- Database schema changes must be managed with Flyway migrations under `backend-spring/src/main/resources/db/migration`.
- Do not use Hibernate `create`, `create-drop`, or ad-hoc schema recreation as a delivery mechanism.
- If an entity or persisted field changes, add a new versioned migration and keep `spring.jpa.hibernate.ddl-auto=validate`.

## i18n Standard

Frontend i18n is mandatory.

### Current implementation

- Provider: `frontend-react-pwa/src/i18n/I18nProvider.jsx`
- Dictionaries: `frontend-react-pwa/src/i18n/translations.js`

### Rules

- New content must be added in both `en` and `pt`.
- `en` is the default locale.
- Do not add hardcoded UI strings in components or screens.
- If backend messages are surfaced directly to users, align backend responses with the same bilingual strategy when that work is scheduled.

## Authentication And Admin Flow

The current product flow includes:

- self-registration
- admin approval
- admin task board
- user activation/block
- user deletion
- profile management
- persistent language switcher
- backend connection awareness
- floating toast feedback
- resizable split layouts

### Key rules

- New users register in pending state.
- Pending users cannot log in until approved by admin.
- Admins can list, search, activate, block, and delete users.
- Deletion must remove the account from the application and from Keycloak.
- Admin task entry must remain visible from the header through the bell access point.
- Any admin-facing new feature must consider:
  - admin navigation
  - task visibility
  - localized labels/messages

## Build And Integration Flow

The frontend and backend are developed separately, but the backend must always be able to serve the latest frontend build.

## Deployment Flow

The operational deployment model is image-first and compose-first.

- The backend image is published manually by the project owner to `ghcr.io/edoardoboechat/coingame:latest`.
- The compose file is expected to pull that image on startup.
- The target workflow on deployment hosts is:
  - `git pull`
  - `docker compose up -d`

Rules:

- Do not assume the target server builds the backend image locally.
- Infra changes must keep the compose stack able to start the whole application and its dependencies from the pulled image.
- If a backend source fix is made locally but the compose stack depends on a published image, state clearly when the image still needs to be rebuilt and pushed by the user.
- When infra/auth/gateway changes are made, validate them against the compose topology, not only against direct local process execution.

### Required commands

Frontend build:

```powershell
cd frontend-react-pwa
npm.cmd run build
```

Backend compilation:

```powershell
cd backend-spring
mvn -q -DskipTests compiler:compile
```

Backend resource sync so Spring Boot serves the latest frontend:

```powershell
cd backend-spring
mvn -q -DskipTests process-resources
```

Final package build:

```powershell
cd backend-spring
mvn -q package
```

### Mandatory validation after frontend changes

After frontend changes that affect runtime behavior:

1. Run the frontend build.
2. Run backend resource sync.
3. Prefer `mvn package` when validating the final executable app, because it rebuilds the frontend and copies it into the backend artifact.
4. Confirm that:
   - `frontend-react-pwa/build/asset-manifest.json`
   - `backend-spring/target/classes/static/asset-manifest.json`
   point to the same current bundle.

This is not optional for completion:

- If frontend code changed, the task should be left with the backend static bundle already updated unless the user explicitly says not to do that step.

If `mvn package` was executed, treat the packaged backend output as the source of truth for what the user will actually run.

If the browser appears stale, verify the backend static bundle first before debugging the UI logic.

## Testing Standard

Unit tests are required for both frontend and backend as the project evolves.

### Current state

At the moment, the repository does not yet contain implemented unit tests in:

- `frontend-react-pwa/src/**/*.test.*`
- `backend-spring/src/test/**`

This is a known gap, not a target state.

### Forward rule

Any meaningful new business logic should add automated coverage.

### Frontend expected test strategy

- Component behavior tests
- Screen interaction tests
- Hook tests for session/i18n/admin flows when logic grows
- Critical state transitions around auth, admin actions, and language switching

Suggested command:

```powershell
cd frontend-react-pwa
npm.cmd test -- --watchAll=false --passWithNoTests
```

### Backend expected test strategy

- Service-layer unit tests
- Controller/web-layer tests for critical endpoints
- Security/access tests for admin-only flows
- Validation/error contract tests for auth/admin/profile endpoints

Suggested command:

```powershell
cd backend-spring
mvn test
```

## Definition Of Done

A change is only considered ready when all relevant items below are true:

- Architecture stays layered.
- i18n is implemented for `en` and `pt`.
- No important logic is hidden inside view-only components.
- Frontend build passes.
- Backend compile passes.
- Backend serves the latest frontend bundle.
- Any completed frontend change is already rebuilt and synchronized into the backend static resources.
- Tests are added or the testing gap is explicitly documented.
- New admin flows consider permissions, visibility, and localized feedback.
- Shared UI standards such as toast behavior, language switching, and split layout behavior remain consistent.
- Mobile-first behavior remains intact and the experience is usable on phone screens.
- Backend schema changes are represented by Flyway migrations and the application starts without recreating the database.
- Documentation is updated when a cross-cutting rule or workflow changes materially.

## Practical Guidance For Future Work

- Read existing service and hook layers before adding new logic.
- Prefer extending the current structure instead of bypassing it.
- If adding a new endpoint, create or update:
  - backend DTO
  - backend controller
  - backend service
  - frontend service adapter
  - relevant screen/component
  - i18n entries in `en` and `pt`
- If a user reports that the browser still shows old frontend behavior, validate the Spring static bundle before changing code.
- If a change alters shared UX conventions, update `README.md` and this baseline so the standard stays explicit.

## Recommended Next Engineering Step

The next structural quality improvement should be:

- add unit tests for frontend session/i18n/admin flows
- add backend tests for auth/admin/profile services and controllers
- optionally internationalize backend response messages to align with the frontend locale strategy
