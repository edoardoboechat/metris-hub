package com.aetherquest.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Informe o username.")
        @Size(min = 3, max = 30, message = "O username deve ter entre 3 e 30 caracteres.")
        String username,
        @NotBlank(message = "Informe o email.")
        @Email(message = "Informe um email valido.")
        String email,
        @NotBlank(message = "Informe o telefone.")
        @Pattern(regexp = "^[0-9+()\\-\\s]{7,20}$", message = "Informe um telefone valido.")
        String phone,
        @NotBlank(message = "Informe o nome.")
        @Size(max = 50, message = "O nome deve ter no maximo 50 caracteres.")
        String firstName,
        @NotBlank(message = "Informe o sobrenome.")
        @Size(max = 50, message = "O sobrenome deve ter no maximo 50 caracteres.")
        String lastName,
        @NotBlank(message = "Informe a password.")
        @Size(min = 8, max = 64, message = "A password deve ter entre 8 e 64 caracteres.")
        String password
) {
}
