# Aether Quest Implementation Checklist

Use this checklist before considering a feature ready.

## Architecture

- Frontend logic stays layered across `components`, `screens`, `hooks`, `services`, `utils`, `constants`, and `i18n`.
- Backend logic stays layered across `controller`, `service`, `dto`, and `config`.
- Controllers remain thin.
- Reusable API access stays in frontend services, not inside screen files.

## UI And UX

- The feature is designed mobile-first and remains usable on phone screens.
- Layouts are validated for narrow widths before desktop refinements.
- Interactive elements remain touch-friendly on mobile devices.
- All frontend strings are added in both `en` and `pt`.
- English remains the default locale.
- The language switcher stays visible before and after authentication.
- Toast messages use the shared floating component and auto-close after 10 seconds.
- Split layouts preserve the shared resizable pattern with `30/70` as the default ratio.
- Header-level elements do not overlap or block primary navigation.
- Backend connection state is respected before triggering server-dependent actions.

## Admin Features

- Any new admin feature considers permissions, navigation, and visibility from the existing admin flow.
- Admin tasks that require attention are surfaced through the persistent header entry point.
- User-management changes remain consistent with Keycloak state.

## Backend And Integration

- Security changes are reflected in `SecurityConfig`.
- New API contracts use DTOs.
- New backend responses stay compatible with frontend expectations.
- Any persisted backend model change includes a Flyway migration in `backend-spring/src/main/resources/db/migration`.
- Hibernate schema recreation is not used as a substitute for migrations.
- If the change affects frontend runtime behavior, rebuild the frontend and sync it into the backend package.
- Do not consider a frontend task complete until the backend static bundle has been refreshed for the latest frontend build.
- If the change affects deployment, gateway, certificates, or service communication, validate it against `docker-compose.yml`.
- If the compose stack depends on `ghcr.io/edoardoboechat/coingame:latest`, make clear whether the published image already contains the source changes or still needs a manual push by the user.

## Validation

- `npm.cmd run build` passes in `frontend-react-pwa`.
- `mvn -q -DskipTests process-resources` or `mvn package` is run in `backend-spring` after frontend changes.
- `mvn test` passes in `backend-spring` when tests exist for the changed scope.
- `mvn package` succeeds in `backend-spring` for delivery validation.
- `frontend-react-pwa/build/asset-manifest.json` and `backend-spring/target/classes/static/asset-manifest.json` match after packaging.

## Documentation

- Update i18n dictionaries when new strings are introduced.
- Update `README.md` when the developer workflow, architecture, or runtime behavior changes materially.
- Update `DEVELOPMENT_BASELINE.md` when a new cross-cutting implementation rule becomes part of the project standard.
