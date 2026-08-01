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
import java.util.Map;

/**
 * Server-side proxy for the "Astro Stone Advisor" — a traditional Vedic-astrology-
 * inspired gemstone (Ratna) suggestion feature, in the same spirit as many Indian
 * jewellers' in-store consultations. Calls the real Anthropic Messages API with a
 * server-held key, same pattern as DesignService.
 *
 * IMPORTANT FRAMING: this is presented throughout as traditional/cultural belief, not
 * as fact, medicine, or guaranteed outcome. A proper Vedic gemstone recommendation
 * needs an exact birth chart (kundli) from a qualified astrologer — this endpoint only
 * ever gives a general, clearly-caveated starting point from whatever birth details
 * the customer chose to share.
 */
@Service
public class AstroService {

    private static final Logger log = LoggerFactory.getLogger(AstroService.class);
    private static final String ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
    private static final String ANTHROPIC_VERSION = "2023-06-01";

    @Value("${anthropic.api.key:}")
    private String apiKey;

    @Value("${anthropic.model:claude-sonnet-5}")
    private String model;

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final ObjectMapper mapper = new ObjectMapper();

    private static final String SYSTEM_PROMPT = """
            You are a traditional Vedic-astrology-inspired gemstone (Ratna) advisor for N.S. Heera & Sons Jewellers, an Indian gold, diamond and silver jewellery retailer established in 1968. A customer will share birth details (date of birth always; time of birth and place of birth are optional but improve accuracy) and optionally a specific concern or goal (career, health, relationships, general wellbeing, etc.).

            IMPORTANT — frame everything as traditional belief, never as established fact, medicine, or a guaranteed outcome:
            - Use phrasing like "in Vedic astrology tradition, this stone is associated with...", "many believe...", "traditionally worn to..." — never assert a gemstone will cure an illness, guarantee wealth, or guarantee any specific life outcome.
            - A precise Vedic recommendation (exact rashi, nakshatra, and planetary dasha) requires a full birth chart calculated from exact birth time and place by a qualified astrologer. If time and place of birth are missing, clearly note in moonSignEstimate that this is an approximate, general suggestion (e.g. based on sun sign / date alone), not a substitute for a personal chart reading.
            - If the customer describes a serious health concern, gently note in the disclaimer that a gemstone is a traditional/cultural practice, not medical treatment, and that they should consult a doctor for health concerns.
            - Never discourage someone from seeking medical, legal, or financial professional advice in favor of a gemstone.
            - If the input is missing a date of birth entirely, or is unrelated to astrology/gemstones, politely explain what's needed in the "rationale" field and leave other fields as general placeholders rather than inventing birth details.

            Respond with ONLY a JSON object in exactly this shape — no markdown fences, no preamble, no text outside the JSON:
            {
              "moonSignEstimate": "e.g. Approximate — based on date of birth only; an exact reading needs your birth time and place",
              "primaryStone": "e.g. Yellow Sapphire (Pukhraj)",
              "associatedPlanet": "e.g. Jupiter (Guru)",
              "rationale": "2-4 sentences, traditional-belief framing, referencing what was shared (concern/goal if given)",
              "recommendedMetal": "e.g. Gold, set in a ring",
              "wearingGuidance": {
                "finger": "e.g. Index finger, right hand (traditional guidance — confirm with an astrologer)",
                "day": "e.g. Thursday morning (traditional guidance)",
                "weightNote": "e.g. Typically 5-7 carats in tradition — a certified astrologer should confirm exact weight for your chart"
              },
              "alternativeStones": [
                { "name": "e.g. Citrine (as a substitute stone)", "reason": "why this is a common traditional alternative" },
                { "name": "e.g. Yellow Topaz", "reason": "why this is a common traditional alternative" }
              ],
              "stonesToAvoidNote": "optional — traditional combinations some avoid together, or empty string if not applicable",
              "disclaimer": "This is traditional/cultural guidance for informational purposes only, not medical, legal, or financial advice. For a personalised reading based on your exact birth chart, consult a qualified astrologer. For health concerns, please consult a doctor."
            }""";

    public Map<String, Object> suggestStone(JsonNode requestBody) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new AstroUnavailableException(
                    "Astro Stone Advisor is not configured on this server (missing ANTHROPIC_API_KEY)");
        }

        String dob = requestBody.path("dateOfBirth").asText("").trim();
        if (dob.isBlank()) {
            throw new IllegalArgumentException("dateOfBirth is required");
        }
        String timeOfBirth = requestBody.path("timeOfBirth").asText("").trim();
        String placeOfBirth = requestBody.path("placeOfBirth").asText("").trim();
        String concern = requestBody.path("concern").asText("").trim();

        StringBuilder instruction = new StringBuilder();
        instruction.append("Customer's date of birth: ").append(dob).append(". ");
        instruction.append(timeOfBirth.isBlank()
                ? "Time of birth: not provided. "
                : "Time of birth: " + timeOfBirth + ". ");
        instruction.append(placeOfBirth.isBlank()
                ? "Place of birth: not provided."
                : "Place of birth: " + placeOfBirth + ".");
        if (!concern.isBlank()) {
            instruction.append(" Their stated concern/goal: \"").append(concern).append("\".");
        }

        ArrayNode userContent = mapper.createArrayNode();
        ObjectNode textBlock = mapper.createObjectNode();
        textBlock.put("type", "text");
        textBlock.put("text", instruction.toString());
        userContent.add(textBlock);

        ObjectNode userMessage = mapper.createObjectNode();
        userMessage.put("role", "user");
        userMessage.set("content", userContent);

        ObjectNode payload = mapper.createObjectNode();
        payload.put("model", model);
        payload.put("max_tokens", 1500);
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
                throw new AstroUnavailableException("Astro suggestion request failed (HTTP " + response.statusCode() + ")");
            }

            JsonNode root = mapper.readTree(response.body());
            StringBuilder text = new StringBuilder();
            for (JsonNode block : root.path("content")) {
                if (block.has("text")) text.append(block.path("text").asText());
            }
            String cleaned = text.toString().replaceAll("```json|```", "").trim();

            JsonNode suggestion;
            try {
                suggestion = mapper.readTree(cleaned);
            } catch (Exception e) {
                throw new AstroUnavailableException("Could not understand the AI response — please try again.", e);
            }
            return mapper.convertValue(suggestion, new TypeReference<Map<String, Object>>() {});
        } catch (AstroUnavailableException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Astro stone suggestion failed: {}", e.getMessage());
            throw new AstroUnavailableException("Could not reach the astrology suggestion service — please try again.", e);
        }
    }

    public static class AstroUnavailableException extends RuntimeException {
        public AstroUnavailableException(String message) {
            super(message);
        }

        public AstroUnavailableException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
