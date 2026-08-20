package com.aetherquest.service;

import com.aetherquest.config.KeycloakProperties;
import com.aetherquest.dto.LoginRequest;
import com.aetherquest.dto.ProfileResponse;
import com.aetherquest.dto.RegistrationResponse;
import com.aetherquest.dto.RegisterRequest;
import com.aetherquest.dto.TokenResponse;
import com.aetherquest.exception.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.util.Base64;
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

@Service
public class KeycloakAuthService {

    private final RestTemplate restTemplate;
    private final KeycloakProperties properties;
    private final KeycloakAdminService adminService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public KeycloakAuthService(
            KeycloakProperties properties,
            KeycloakAdminService adminService
    ) {
        this.restTemplate = new RestTemplate();
        this.properties = properties;
        this.adminService = adminService;
    }

    public TokenResponse login(LoginRequest request) {
        String username = adminService.resolveUsername(request.identifier().trim());
        adminService.ensureUserCanLogin(username);
        return exchangeToken(grantBody("password", username, request.password(), null));
    }

    public RegistrationResponse register(RegisterRequest request) {
        adminService.createUser(request);
        return new RegistrationResponse("Registo recebido. A conta aguarda aprovacao do administrador.");
    }

    public TokenResponse refresh(String refreshToken) {
        return exchangeToken(grantBody("refresh_token", null, null, refreshToken));
    }

    public void logout(String refreshToken) {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", properties.clientId());
        body.add("refresh_token", refreshToken);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        try {
            restTemplate.exchange(
                    URI.create(properties.baseUrl() + "/realms/" + properties.realm() + "/protocol/openid-connect/logout"),
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    Void.class
            );
        } catch (HttpStatusCodeException exception) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Nao foi possivel terminar a sessao.");
        }
    }

    private MultiValueMap<String, String> grantBody(
            String grantType,
            String username,
            String password,
            String refreshToken
    ) {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", grantType);
        body.add("client_id", properties.clientId());

        if (username != null) {
            body.add("username", username);
        }
        if (password != null) {
            body.add("password", password);
        }
        if (refreshToken != null) {
            body.add("refresh_token", refreshToken);
        }
        return body;
    }

    private TokenResponse exchangeToken(MultiValueMap<String, String> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        JsonNode payload;
        try {
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    URI.create(properties.baseUrl() + "/realms/" + properties.realm() + "/protocol/openid-connect/token"),
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    JsonNode.class
            );
            payload = response.getBody();
        } catch (HttpStatusCodeException exception) {
            if (exception.getStatusCode() == HttpStatus.BAD_REQUEST || exception.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Credenciais invalidas.");
            }
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Falha ao comunicar com o Keycloak.");
        }

        if (payload == null) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Resposta invalida do Keycloak.");
        }

        String userId = extractUserIdFromAccessToken(payload.path("access_token").asText());
        ProfileResponse profile = adminService.getUserProfile(userId);

        return new TokenResponse(
                payload.path("access_token").asText(),
                payload.path("refresh_token").asText(),
                payload.path("expires_in").asLong(),
                payload.path("refresh_expires_in").asLong(),
                payload.path("token_type").asText("Bearer"),
                profile
        );
    }

    private String extractUserIdFromAccessToken(String accessToken) {
        String[] parts = accessToken.split("\\.");
        if (parts.length < 2) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Token invalido recebido do Keycloak.");
        }

        try {
            byte[] decoded = Base64.getUrlDecoder().decode(parts[1]);
            JsonNode payload = objectMapper.readTree(decoded);
            return payload.path("sub").asText();
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Nao foi possivel interpretar o token recebido.");
        }
    }
}
