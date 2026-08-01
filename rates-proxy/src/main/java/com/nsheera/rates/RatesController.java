package com.nsheera.rates;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@CrossOrigin(origins = "${frontend.allowed-origin:*}")
public class RatesController {

    private final MetalsService metalsService;

    public RatesController(MetalsService metalsService) {
        this.metalsService = metalsService;
    }

    @GetMapping("/api/rates")
    public Map<String, Object> getRates() {
        try {
            MetalsService.RateSnapshot snapshot = metalsService.getRates();
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("goldPerGram", snapshot.goldPerGram());
            body.put("silverPerGram", snapshot.silverPerGram());
            body.put("source", snapshot.source());
            body.put("lastUpdated", snapshot.fetchedAt().toString());
            return body;
        } catch (MetalsService.RatesUnavailableException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Live rate sources are currently unavailable", e);
        }
    }

    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }
}
