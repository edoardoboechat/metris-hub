package com.aetherquest.service;

import com.aetherquest.config.KeycloakProperties;
import com.aetherquest.dto.AdminTaskBoardResponse;
import com.aetherquest.dto.AdminTaskSummary;
import com.aetherquest.dto.AdminUserSummary;
import com.aetherquest.dto.GameLedgerResponse;
import com.aetherquest.dto.PlayerGameStats;
import com.aetherquest.dto.ProfileResponse;
import com.aetherquest.dto.ProfileUpdateRequest;
import com.aetherquest.dto.RegisterRequest;
import com.aetherquest.exception.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import java.net.URI;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class KeycloakAdminService {

    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_BLOCKED = "BLOCKED";
    private static final String ATTRIBUTE_PHONE = "phone";
    private static final String ATTRIBUTE_APPROVAL_STATUS = "approvalStatus";

    private final RestTemplate restTemplate;
    private final KeycloakProperties properties;
    private final PlayerGameStateService playerGameStateService;
    private final GameSettingsService gameSettingsService;

    public KeycloakAdminService(
            KeycloakProperties properties,
            PlayerGameStateService playerGameStateService,
            GameSettingsService gameSettingsService
    ) {
        this.restTemplate = new RestTemplate();
        this.properties = properties;
        this.playerGameStateService = playerGameStateService;
        this.gameSettingsService = gameSettingsService;
    }

    public String getAdminAccessToken() {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("client_id", properties.adminClientId());
        body.add("username", properties.adminUsername());
        body.add("password", properties.adminPassword());

        JsonNode response = postForm(tokenUri(properties.adminRealm()), body);
        return response.path("access_token").asText();
    }

    public void createUser(RegisterRequest request) {
        String adminToken = getAdminAccessToken();

        HttpHeaders headers = authorizedHeaders(adminToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> payload = Map.of(
                "enabled", false,
                "username", request.username().trim(),
                "email", request.email().trim(),
                "firstName", request.firstName().trim(),
                "lastName", request.lastName().trim(),
                "emailVerified", false,
                "attributes", Map.of(
                        ATTRIBUTE_PHONE, List.of(request.phone().trim()),
                        ATTRIBUTE_APPROVAL_STATUS, List.of(STATUS_PENDING)
                ),
                "credentials", List.of(Map.of(
                        "type", "password",
                        "value", request.password(),
                        "temporary", false
                ))
        );

        try {
            restTemplate.exchange(usersUri(), HttpMethod.POST, new HttpEntity<>(payload, headers), Void.class);
        } catch (HttpStatusCodeException exception) {
            if (exception.getStatusCode() == HttpStatus.CONFLICT) {
                throw new ApiException(HttpStatus.CONFLICT, "Ja existe um utilizador com esse username ou email.");
            }
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Falha ao criar o utilizador no Keycloak.");
        }

        String userId = findUserIdByUsername(request.username().trim(), adminToken);
        assignPlayerRole(userId, adminToken);
    }

    public ProfileResponse getUserProfile(String userId) {
        String adminToken = getAdminAccessToken();
        return getUserProfile(userId, adminToken);
    }

    public ProfileResponse getUserProfile(String userId, String adminToken) {
        HttpHeaders headers = authorizedHeaders(adminToken);
        ResponseEntity<JsonNode> response = restTemplate.exchange(
                userUri(userId),
                HttpMethod.GET,
                new HttpEntity<>(headers),
                JsonNode.class
        );

        JsonNode user = response.getBody();
        if (user == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Utilizador nao encontrado.");
        }
        return toProfile(user);
    }

    public ProfileResponse updateUserProfile(String userId, ProfileUpdateRequest request) {
        String adminToken = getAdminAccessToken();
        JsonNode existingUser = getUserRepresentation(userId, adminToken);
        HttpHeaders headers = authorizedHeaders(adminToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> payload = Map.of(
                "id", userId,
                "enabled", existingUser.path("enabled").asBoolean(),
                "username", request.username().trim(),
                "email", request.email().trim(),
                "firstName", request.firstName().trim(),
                "lastName", request.lastName().trim(),
                "attributes", buildAttributes(request.phone().trim(), resolveApprovalStatus(existingUser))
        );

        try {
            restTemplate.exchange(userUri(userId), HttpMethod.PUT, new HttpEntity<>(payload, headers), Void.class);
        } catch (HttpStatusCodeException exception) {
            if (exception.getStatusCode() == HttpStatus.CONFLICT) {
                throw new ApiException(HttpStatus.CONFLICT, "Ja existe um utilizador com esse username ou email.");
            }
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Falha ao atualizar o perfil no Keycloak.");
        }

        return getUserProfile(userId, adminToken);
    }

    public String resolveUsername(String identifier) {
        if (!identifier.contains("@")) {
            return identifier;
        }

        String adminToken = getAdminAccessToken();
        HttpHeaders headers = authorizedHeaders(adminToken);
        URI uri = UriComponentsBuilder.fromUriString(usersUri().toString())
                .queryParam("email", identifier)
                .build(true)
                .toUri();

        ResponseEntity<JsonNode> response = restTemplate.exchange(
                uri,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                JsonNode.class
        );

        JsonNode users = response.getBody();
        if (users == null || !users.isArray()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Credenciais invalidas.");
        }

        for (JsonNode user : users) {
            if (identifier.equalsIgnoreCase(user.path("email").asText())) {
                return user.path("username").asText();
            }
        }

        throw new ApiException(HttpStatus.UNAUTHORIZED, "Credenciais invalidas.");
    }

    public void ensureUserCanLogin(String username) {
        String adminToken = getAdminAccessToken();
        JsonNode user = findUserByUsername(username, adminToken);
        String approvalStatus = resolveApprovalStatus(user);

        if (STATUS_PENDING.equals(approvalStatus)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Conta aguardando aprovacao do administrador.");
        }

        if (STATUS_BLOCKED.equals(approvalStatus) || !user.path("enabled").asBoolean()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Conta bloqueada. Contacte um administrador.");
        }
    }

    public List<AdminUserSummary> listUsers(String query, String status) {
        String adminToken = getAdminAccessToken();
        HttpHeaders headers = authorizedHeaders(adminToken);
        ResponseEntity<JsonNode> response = restTemplate.exchange(
                usersUri(),
                HttpMethod.GET,
                new HttpEntity<>(headers),
                JsonNode.class
        );

        JsonNode users = response.getBody();
        if (users == null || !users.isArray()) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Nao foi possivel listar os utilizadores.");
        }

        String normalizedQuery = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        String normalizedStatus = status == null ? "all" : status.trim().toLowerCase(Locale.ROOT);
        List<AdminUserSummary> results = new ArrayList<>();
        for (JsonNode user : users) {
            AdminUserSummary summary = toAdminUserSummary(user);
            if (!matchesStatus(summary.approvalStatus(), normalizedStatus)) {
                continue;
            }
            if (!matchesQuery(summary, normalizedQuery)) {
                continue;
            }
            results.add(summary);
        }

        results.sort(Comparator.comparing(AdminUserSummary::username, String.CASE_INSENSITIVE_ORDER));
        return results;
    }

    public AdminUserSummary updateUserStatus(String userId, String action) {
        String adminToken = getAdminAccessToken();
        JsonNode user = getUserRepresentation(userId, adminToken);
        String normalizedAction = action == null ? "" : action.trim().toLowerCase(Locale.ROOT);

        String nextStatus;
        boolean enabled;
        if ("activate".equals(normalizedAction)) {
            nextStatus = STATUS_ACTIVE;
            enabled = true;
        } else if ("block".equals(normalizedAction)) {
            nextStatus = STATUS_BLOCKED;
            enabled = false;
        } else {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Acao invalida. Use activate ou block.");
        }

        HttpHeaders headers = authorizedHeaders(adminToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> payload = Map.of(
                "id", userId,
                "enabled", enabled,
                "username", user.path("username").asText(),
                "email", user.path("email").asText(),
                "firstName", user.path("firstName").asText(),
                "lastName", user.path("lastName").asText(),
                "attributes", buildAttributes(readPhone(user), nextStatus)
        );

        restTemplate.exchange(userUri(userId), HttpMethod.PUT, new HttpEntity<>(payload, headers), Void.class);
        return toAdminUserSummary(getUserRepresentation(userId, adminToken));
    }

    public AdminUserSummary addUserPlayTime(String userId, long minutes) {
        String adminToken = getAdminAccessToken();
        JsonNode user = getUserRepresentation(userId, adminToken);
        playerGameStateService.addPlayTime(userId, user.path("username").asText(), minutes);
        return toAdminUserSummary(user);
    }

    public AdminTaskBoardResponse getAdminTaskBoard() {
        List<AdminTaskSummary> tasks = new ArrayList<>(listUsers("", "pending").stream()
                .map(user -> new AdminTaskSummary(
                        "approve-user-" + user.id(),
                        "USER_APPROVAL",
                        "Validar novo utilizador",
                        "Rever e aprovar o acesso de " + user.username() + ".",
                        0L,
                        user.id(),
                        user.username()
                ))
                .toList());

        long availableCoins = gameSettingsService.getAvailableCoins();
        if (availableCoins < GameSettingsService.LOW_COIN_ALERT_THRESHOLD) {
            tasks.add(new AdminTaskSummary(
                    availableCoins == 0 ? "reload-coins-empty" : "reload-coins-low",
                    "COIN_RELOAD",
                    availableCoins == 0 ? "Carregar moedas esgotadas" : "Carregar mais moedas",
                    availableCoins == 0
                            ? "O stock global de moedas chegou a zero. E necessario carregar novas moedas para o jogo voltar a premiar jogadores."
                            : "Restam menos de 100 moedas disponiveis para serem encontradas. Carrega mais moedas para manter o jogo ativo.",
                    0L,
                    null,
                    null
            ));
        }

        return new AdminTaskBoardResponse(tasks.size(), tasks);
    }

    public GameLedgerResponse getAdminLedger(String username, LocalDate startDate, LocalDate endDate) {
        return playerGameStateService.getAdminLedger(username, startDate, endDate);
    }

    public void deleteUser(String userId) {
        String adminToken = getAdminAccessToken();
        HttpHeaders headers = authorizedHeaders(adminToken);

        try {
            restTemplate.exchange(
                    userUri(userId),
                    HttpMethod.DELETE,
                    new HttpEntity<>(headers),
                    Void.class
            );
        } catch (HttpStatusCodeException exception) {
            if (exception.getStatusCode() == HttpStatus.NOT_FOUND) {
                throw new ApiException(HttpStatus.NOT_FOUND, "Utilizador nao encontrado.");
            }
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Falha ao excluir o utilizador no Keycloak.");
        }

        playerGameStateService.deleteUserState(userId);
    }

    private void assignPlayerRole(String userId, String adminToken) {
        HttpHeaders headers = authorizedHeaders(adminToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        JsonNode role = restTemplate.exchange(
                roleUri("PLAYER"),
                HttpMethod.GET,
                new HttpEntity<>(headers),
                JsonNode.class
        ).getBody();

        if (role == null) {
            return;
        }

        List<Map<String, String>> payload = List.of(
                Map.of("id", role.path("id").asText(), "name", role.path("name").asText())
        );

        restTemplate.exchange(
                roleMappingsUri(userId),
                HttpMethod.POST,
                new HttpEntity<>(payload, headers),
                Void.class
        );
    }

    private String findUserIdByUsername(String username, String adminToken) {
        return findUserByUsername(username, adminToken).path("id").asText();
    }

    private JsonNode findUserByUsername(String username, String adminToken) {
        HttpHeaders headers = authorizedHeaders(adminToken);
        URI uri = UriComponentsBuilder.fromUriString(usersUri().toString())
                .queryParam("username", username)
                .queryParam("exact", true)
                .build(true)
                .toUri();

        ResponseEntity<JsonNode> response = restTemplate.exchange(
                uri,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                JsonNode.class
        );

        JsonNode users = response.getBody();
        if (users == null || !users.isArray() || users.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Utilizador criado mas nao localizado no Keycloak.");
        }

        return users.get(0);
    }

    private JsonNode getUserRepresentation(String userId, String adminToken) {
        HttpHeaders headers = authorizedHeaders(adminToken);
        ResponseEntity<JsonNode> response = restTemplate.exchange(
                userUri(userId),
                HttpMethod.GET,
                new HttpEntity<>(headers),
                JsonNode.class
        );

        JsonNode user = response.getBody();
        if (user == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Utilizador nao encontrado.");
        }
        return user;
    }

    private JsonNode postForm(URI uri, MultiValueMap<String, String> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        try {
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    uri,
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    JsonNode.class
            );
            JsonNode payload = response.getBody();
            if (payload == null) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Resposta invalida do Keycloak.");
            }
            return payload;
        } catch (HttpStatusCodeException exception) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Falha na comunicacao com o Keycloak.");
        }
    }

    private ProfileResponse toProfile(JsonNode user) {
        String approvalStatus = resolveApprovalStatus(user);
        PlayerGameStats stats = playerGameStateService.getStats(user.path("id").asText());
        return new ProfileResponse(
                user.path("id").asText(),
                user.path("username").asText(),
                user.path("email").asText(),
                readPhone(user),
                user.path("firstName").asText(),
                user.path("lastName").asText(),
                approvalStatus,
                user.path("enabled").asBoolean(),
                stats.remainingPlayTimeSeconds(),
                stats.totalPlayedSeconds(),
                stats.totalCoinsFound(),
                stats.coinBalance()
        );
    }

    private AdminUserSummary toAdminUserSummary(JsonNode user) {
        PlayerGameStats stats = playerGameStateService.getStats(user.path("id").asText());
        return new AdminUserSummary(
                user.path("id").asText(),
                user.path("username").asText(),
                user.path("email").asText(),
                readPhone(user),
                user.path("firstName").asText(),
                user.path("lastName").asText(),
                resolveApprovalStatus(user),
                user.path("enabled").asBoolean(),
                stats.remainingPlayTimeSeconds(),
                stats.totalPlayedSeconds(),
                stats.coinBalance()
        );
    }

    private boolean matchesStatus(String approvalStatus, String normalizedStatus) {
        if (normalizedStatus.isBlank() || "all".equals(normalizedStatus)) {
            return true;
        }

        return approvalStatus.equalsIgnoreCase(normalizedStatus);
    }

    private boolean matchesQuery(AdminUserSummary summary, String normalizedQuery) {
        if (normalizedQuery.isBlank()) {
            return true;
        }

        return contains(summary.username(), normalizedQuery)
                || contains(summary.email(), normalizedQuery)
                || contains(summary.firstName(), normalizedQuery)
                || contains(summary.lastName(), normalizedQuery);
    }

    private boolean contains(String value, String query) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(query);
    }

    private String resolveApprovalStatus(JsonNode user) {
        JsonNode approvalNode = user.path("attributes").path(ATTRIBUTE_APPROVAL_STATUS);
        if (approvalNode.isArray() && !approvalNode.isEmpty()) {
            String status = approvalNode.get(0).asText().trim().toUpperCase(Locale.ROOT);
            if (!status.isBlank()) {
                return status;
            }
        }

        return user.path("enabled").asBoolean() ? STATUS_ACTIVE : STATUS_BLOCKED;
    }

    private String readPhone(JsonNode user) {
        JsonNode phoneNode = user.path("attributes").path(ATTRIBUTE_PHONE);
        return phoneNode.isArray() && !phoneNode.isEmpty() ? phoneNode.get(0).asText() : "";
    }

    private Map<String, Object> buildAttributes(String phone, String approvalStatus) {
        return Map.of(
                ATTRIBUTE_PHONE, List.of(phone == null ? "" : phone),
                ATTRIBUTE_APPROVAL_STATUS, List.of(approvalStatus)
        );
    }

    private HttpHeaders authorizedHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return headers;
    }

    private URI tokenUri(String realm) {
        return URI.create(properties.baseUrl() + "/realms/" + realm + "/protocol/openid-connect/token");
    }

    private URI usersUri() {
        return URI.create(properties.baseUrl() + "/admin/realms/" + properties.realm() + "/users");
    }

    private URI userUri(String userId) {
        return URI.create(usersUri() + "/" + userId);
    }

    private URI roleUri(String roleName) {
        return URI.create(properties.baseUrl() + "/admin/realms/" + properties.realm() + "/roles/" + roleName);
    }

    private URI roleMappingsUri(String userId) {
        return URI.create(properties.baseUrl() + "/admin/realms/" + properties.realm() + "/users/" + userId + "/role-mappings/realm");
    }
}
