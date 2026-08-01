package com.nsheera.rates;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Server-side proxy for AI image generation. Holds the image-provider API key on the
 * server, same pattern as MetalsService and DesignService — the key never reaches the
 * browser.
 *
 * Default provider is OpenAI's image endpoint (gpt-image-1), because it's a single
 * REST call with no SDK required. Swapping providers (Stability AI, Google Imagen,
 * etc.) means changing buildRequest()/parseResponse() below — the rest of the app
 * (DesignService, the frontend) only cares that this returns base64 PNG bytes.
 */
@Service
public class ImageService {

    private static final Logger log = LoggerFactory.getLogger(ImageService.class);
    private static final String OPENAI_IMAGE_URL = "https://api.openai.com/v1/images/generations";

    @Value("${openai.api.key:}")
    private String apiKey;

    @Value("${openai.image.model:gpt-image-1}")
    private String model;

    @Value("${openai.image.size:1024x1024}")
    private String size;

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final ObjectMapper mapper = new ObjectMapper();

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    /**
     * @return base64-encoded PNG bytes (no data: prefix), or null if image generation
     *         isn't configured or fails — callers should treat a null image as
     *         non-fatal and still return the text concept.
     */
    public String generateImageBase64(String prompt) {
        if (!isConfigured()) {
            log.info("Image generation skipped: OPENAI_API_KEY not set");
            return null;
        }
        try {
            ObjectNode payload = mapper.createObjectNode();
            payload.put("model", model);
            payload.put("prompt", prompt);
            payload.put("size", size);
            payload.put("n", 1);

            HttpRequest request = HttpRequest.newBuilder(URI.create(OPENAI_IMAGE_URL))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .timeout(Duration.ofSeconds(60))
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(payload)))
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.warn("Image generation returned HTTP {}: {}", response.statusCode(), response.body());
                return null;
            }
            JsonNode root = mapper.readTree(response.body());
            JsonNode first = root.path("data").path(0);
            String b64 = first.path("b64_json").asText(null);
            if (b64 == null || b64.isBlank()) {
                log.warn("Image generation response had no b64_json field");
                return null;
            }
            return b64;
        } catch (Exception e) {
            // Image generation is a nice-to-have on top of the text concept — never let
            // it take down the whole design-generation request.
            log.warn("Image generation failed: {}", e.getMessage());
            return null;
        }
    }
}
