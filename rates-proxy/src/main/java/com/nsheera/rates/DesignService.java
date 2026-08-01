package com.nsheera.rates;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
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
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Server-side proxy for the AI Design Studio. Calls the real Anthropic Messages API
 * with a server-held API key, so the key never reaches the browser bundle.
 *
 * The frontend's direct `fetch('https://api.anthropic.com/v1/messages', ...)` call
 * (no key attached) only succeeds inside a Claude.ai artifact preview, where that
 * call is specially authenticated for the artifact host. Deployed standalone, that
 * call fails cleanly and the frontend falls back to this endpoint instead — this
 * service is what makes AI Design Studio actually work on the public site.
 */
@Service
public class DesignService {

    private static final Logger log = LoggerFactory.getLogger(DesignService.class);
    private static final String ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
    private static final String ANTHROPIC_VERSION = "2023-06-01";

    @Value("${anthropic.api.key:}")
    private String apiKey;

    @Value("${anthropic.model:claude-sonnet-5}")
    private String model;

    private final ImageService imageService;

    public DesignService(ImageService imageService) {
        this.imageService = imageService;
    }

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final ObjectMapper mapper = new ObjectMapper();

    // Kept identical to the system prompt the frontend previously sent inline, so
    // moving the call server-side doesn't change the design concepts it produces.
    private static final String SYSTEM_PROMPT = """
            You are a senior jewellery design consultant for N.S. Heera & Sons Jewellers, an Indian gold, diamond and silver jewellery retailer established in 1968. A customer will either describe a design they want in words, or share a photo/document of an existing piece they'd like redesigned.

            Propose ONE thoughtful, realistic jewellery design concept suited to Indian jewellery craftsmanship (gold purities like 22K/916, 18K/750, silver 925, diamonds, traditional and contemporary styles). Keep suggestions realistic for a working jeweller to actually produce — avoid impossible, wildly extravagant, or unsafe claims, and do not invent a precise final price (a human will quote that).

            If the request is unrelated to jewellery design (or the uploaded file isn't jewellery), politely decline within the JSON's "description" field and leave other fields empty, rather than making something up.

            You MUST include at least 2-3 designVariations entries showing alternative options (e.g. different metal, purity, weight, price point) for the concept. Each variation should have its own specs.

            Respond with ONLY a JSON object in exactly this shape — no markdown fences, no preamble, no text outside the JSON:
            {
              "title": "short concept name",
              "description": "2-4 sentence description of the design",
              "suggestedMetal": "e.g. 22K Gold / Sterling Silver / Gold with Diamonds",
              "suggestedPurity": "e.g. 22K (916)",
              "estimatedWeightRange": "e.g. 8-12 grams",
              "approximatePrice": "e.g. ₹45,000 - ₹55,000",
              "detailing": "Detailed design description — pattern, finish, gemstone settings, special features",
              "gemstoneSuggestions": "e.g. Small round diamonds, ruby accent, or none",
              "stoneDetails": "Detailed stone specifications — type, carat weight, color, clarity, cut, number of stones",
              "styleNotes": "1-2 sentences on style, occasion fit, or how this reinterprets the uploaded reference",
              "craftsmanshipTime": "Estimated making time, e.g. 2-3 weeks",
              "suitableFor": "e.g. Wedding, Engagement, Festive wear, Daily wear, Gift",
              "techniqueNotes": "Craftsmanship techniques — e.g. hand engraving, filigree, kundan setting, milgrain detailing",
              "designVariations": [
                {
                  "name": "e.g. Premium Version (Diamond-set)",
                  "description": "What makes this variation different",
                  "metal": "e.g. 18K Gold",
                  "purity": "e.g. 18K (750)",
                  "weight": "e.g. 10-12 grams",
                  "price": "e.g. ₹65,000 - ₹75,000",
                  "gemstones": "e.g. VS clarity diamonds, 0.5ct total",
                  "makingTime": "e.g. 3-4 weeks"
                },
                {
                  "name": "e.g. Essential Version (Without Diamonds)",
                  "description": "A more affordable option",
                  "metal": "e.g. 22K Gold",
                  "purity": "e.g. 22K (916)",
                  "weight": "e.g. 8-10 grams",
                  "price": "e.g. ₹35,000 - ₹42,000",
                  "gemstones": "None",
                  "makingTime": "e.g. 2-3 weeks"
                }
              ]
            }""";

    public Map<String, Object> generateConcept(JsonNode requestBody) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new DesignUnavailableException(
                    "AI Design Studio is not configured on this server (missing ANTHROPIC_API_KEY)");
        }

        String promptText = requestBody.path("promptText").asText("");
        if (promptText.isBlank()) {
            throw new IllegalArgumentException("promptText is required");
        }
        JsonNode fileBlock = requestBody.hasNonNull("fileBlock") ? requestBody.get("fileBlock") : null;

        ArrayNode userContent = mapper.createArrayNode();
        if (fileBlock != null) userContent.add(fileBlock);
        ObjectNode textBlock = mapper.createObjectNode();
        textBlock.put("type", "text");
        textBlock.put("text", promptText);
        userContent.add(textBlock);

        ObjectNode userMessage = mapper.createObjectNode();
        userMessage.put("role", "user");
        userMessage.set("content", userContent);

        ObjectNode payload = mapper.createObjectNode();
        payload.put("model", model);
        payload.put("max_tokens", 2000);
        payload.put("system", SYSTEM_PROMPT);
        payload.set("messages", mapper.createArrayNode().add(userMessage));

        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(ANTHROPIC_URL))
                    .header("Content-Type", "application/json")
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", ANTHROPIC_VERSION)
                    .timeout(Duration.ofSeconds(45))
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(payload)))
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.warn("Anthropic API returned HTTP {}: {}", response.statusCode(), response.body());
                throw new DesignUnavailableException("AI design request failed (HTTP " + response.statusCode() + ")");
            }

            JsonNode root = mapper.readTree(response.body());
            StringBuilder text = new StringBuilder();
            for (JsonNode block : root.path("content")) {
                if (block.has("text")) text.append(block.path("text").asText());
            }
            String cleaned = text.toString().replaceAll("```json|```", "").trim();

            JsonNode concept;
            try {
                concept = mapper.readTree(cleaned);
            } catch (Exception e) {
                throw new DesignUnavailableException("Could not understand the AI response — please try again.", e);
            }

            Map<String, Object> result = new LinkedHashMap<>(
                    mapper.convertValue(concept, new TypeReference<Map<String, Object>>() {}));

            // Image generation rides on top of the text concept and is never allowed to
            // fail the whole request — if it's unconfigured or errors out, we just omit
            // imageBase64 and the frontend falls back to a text-only concept.
            String imagePrompt = buildImagePrompt(concept);
            String imageBase64 = imageService.generateImageBase64(imagePrompt);
            if (imageBase64 != null) {
                result.put("imageBase64", imageBase64);
                result.put("imageMediaType", "image/png");
            }
            return result;
        } catch (DesignUnavailableException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Design generation failed: {}", e.getMessage());
            throw new DesignUnavailableException("Could not reach the AI design service — please try again.", e);
        }
    }

    /**
     * Turns the structured text concept into a prompt for the image model. Deliberately
     * framed as product photography of a *concept piece*, not a literal claim that this
     * exact object exists — the text concept remains the source of truth for specs; the
     * image is an illustrative visual, not a manufacturing reference.
     */
    private String buildImagePrompt(JsonNode concept) {
        StringBuilder p = new StringBuilder();
        p.append("Professional product photograph of a single piece of fine Indian jewellery, ");
        p.append("studio lighting, plain neutral background, no text or watermarks, no hands or model, ");
        p.append("photorealistic, elegant, high detail. ");
        p.append("Piece: ").append(textOrEmpty(concept, "title")).append(". ");
        String metal = textOrEmpty(concept, "suggestedMetal");
        if (!metal.isBlank()) p.append("Metal: ").append(metal).append(". ");
        String detailing = textOrEmpty(concept, "detailing");
        if (!detailing.isBlank()) p.append("Design details: ").append(detailing).append(". ");
        String gems = textOrEmpty(concept, "gemstoneSuggestions");
        if (!gems.isBlank() && !gems.equalsIgnoreCase("none")) p.append("Gemstones: ").append(gems).append(". ");
        String style = textOrEmpty(concept, "styleNotes");
        if (!style.isBlank()) p.append("Style: ").append(style).append(".");
        return p.toString();
    }

    private String textOrEmpty(JsonNode node, String field) {
        String v = node.path(field).asText("");
        return v == null ? "" : v.trim();
    }

    public static class DesignUnavailableException extends RuntimeException {
        public DesignUnavailableException(String message) {
            super(message);
        }

        public DesignUnavailableException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
