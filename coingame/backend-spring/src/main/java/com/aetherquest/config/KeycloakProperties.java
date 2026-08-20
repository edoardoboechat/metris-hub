package com.aetherquest.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.keycloak")
public record KeycloakProperties(
        String baseUrl,
        String realm,
        String clientId,
        String adminRealm,
        String adminClientId,
        String adminUsername,
        String adminPassword
) {
}
