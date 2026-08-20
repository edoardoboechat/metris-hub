package com.aetherquest.service;

import com.aetherquest.exception.ApiException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

@Service
public class AdminAccessService {

    public void requireAdmin(Jwt jwt) {
        if (jwt == null || !isAdmin(jwt)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Acesso restrito a administradores.");
        }
    }

    public boolean isAdmin(Jwt jwt) {
        Object realmAccess = jwt.getClaim("realm_access");
        if (!(realmAccess instanceof java.util.Map<?, ?> claimMap)) {
            return false;
        }

        Object roles = claimMap.get("roles");
        if (!(roles instanceof List<?> roleList)) {
            return false;
        }

        return roleList.stream()
                .filter(String.class::isInstance)
                .map(String.class::cast)
                .anyMatch(role -> "ADMIN".equalsIgnoreCase(role));
    }
}
