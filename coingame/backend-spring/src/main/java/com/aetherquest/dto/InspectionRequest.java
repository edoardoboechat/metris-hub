package com.aetherquest.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record InspectionRequest(
        @Min(value = 0, message = "x deve ser entre 0 e 100.")
        @Max(value = 100, message = "x deve ser entre 0 e 100.")
        double x,
        @Min(value = 0, message = "y deve ser entre 0 e 100.")
        @Max(value = 100, message = "y deve ser entre 0 e 100.")
        double y
) {
}
