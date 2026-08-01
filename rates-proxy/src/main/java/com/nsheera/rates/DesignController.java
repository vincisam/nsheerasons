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
public class DesignController {

    private final DesignService designService;

    public DesignController(DesignService designService) {
        this.designService = designService;
    }

    /**
     * Body: { "promptText": "...", "fileBlock": { "type": "image"|"document", "source": {...} } | null }
     * Returns the parsed design-concept JSON directly (same shape the frontend's
     * normalizeDesignConcept() already expects) — the frontend doesn't need to know
     * anything about Anthropic's response format.
     */
    @PostMapping("/api/design/generate")
    public Map<String, Object> generate(@RequestBody JsonNode body) {
        try {
            return designService.generateConcept(body);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        } catch (DesignService.DesignUnavailableException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, e.getMessage(), e);
        }
    }
}
