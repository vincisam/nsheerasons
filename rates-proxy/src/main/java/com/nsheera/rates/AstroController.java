package com.nsheera.rates;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@CrossOrigin(origins = "${frontend.allowed-origin:*}")
public class AstroController {

    private final AstroService astroService;

    public AstroController(AstroService astroService) {
        this.astroService = astroService;
    }

    /**
     * Body: { "dateOfBirth": "YYYY-MM-DD", "timeOfBirth": "HH:MM" | "", "placeOfBirth": "..." | "", "concern": "..." | "" }
     * Returns the parsed astrology-suggestion JSON directly (see AstroService's
     * SYSTEM_PROMPT for the exact shape) — the frontend doesn't need to know
     * anything about Anthropic's response format.
     */
    @PostMapping("/api/astro/suggest-stone")
    public Map<String, Object> suggestStone(@RequestBody JsonNode body) {
        try {
            return astroService.suggestStone(body);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        } catch (AstroService.AstroUnavailableException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, e.getMessage(), e);
        }
    }
}
