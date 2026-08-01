package com.nsheera.rates;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Fetches live gold/silver rates on the server, where the metals.dev API key can stay
 * secret. Caches the result for CACHE_TTL so we don't burn API quota on every page
 * view, and falls back to free/no-key sources (gold-api.com + a live FX rate) if
 * metals.dev is ever unreachable or over quota.
 */
@Service
public class MetalsService {

    private static final Logger log = LoggerFactory.getLogger(MetalsService.class);
    private static final double OZ_TO_GRAM = 31.1035;
    private static final Duration CACHE_TTL = Duration.ofMinutes(2);

    @Value("${metals.api.key}")
    private String metalsApiKey;

    @Value("${rapidapi.key}")
    private String rapidApiKey;

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();
    private final ObjectMapper mapper = new ObjectMapper();
    private final ReentrantLock lock = new ReentrantLock();

    private volatile RateSnapshot cached;

    public RateSnapshot getRates() {
        RateSnapshot snapshot = cached;
        if (isFresh(snapshot)) {
            return snapshot;
        }
        lock.lock();
        try {
            // Re-check after acquiring the lock in case another thread just refreshed it.
            if (isFresh(cached)) {
                return cached;
            }
            RateSnapshot fresh = fetchFresh();
            cached = fresh;
            return fresh;
        } finally {
            lock.unlock();
        }
    }

    private boolean isFresh(RateSnapshot snapshot) {
        return snapshot != null && Duration.between(snapshot.fetchedAt(), Instant.now()).compareTo(CACHE_TTL) < 0;
    }

    private RateSnapshot fetchFresh() {
        Exception lastError = null;

        try {
            RateSnapshot snap = fetchFromMetalsDev();
            log.info("Rates fetched from source={}", snap.source());
            return snap;
        } catch (Exception e) {
            lastError = e;
            log.warn("Primary source metals.dev failed: {}", e.getMessage());
        }

        try {
            RateSnapshot snap = fetchFromRapidApi();
            log.info("Rates fetched from source={}", snap.source());
            return snap;
        } catch (Exception e) {
            lastError = e;
            log.warn("Secondary source RapidAPI failed: {}", e.getMessage());
        }

        try {
            RateSnapshot snap = fetchFromGoldApi();
            log.info("Rates fetched from source={}", snap.source());
            return snap;
        } catch (Exception e) {
            lastError = e;
            log.warn("Fallback source gold-api.com failed: {}", e.getMessage());
        }

        if (cached != null) {
            log.warn("All providers failed; serving stale cached snapshot fetchedAt={}", cached.fetchedAt());
            return cached;
        }

        throw new RatesUnavailableException("All rate sources failed", lastError);
    }

    private RateSnapshot fetchFromMetalsDev() throws Exception {
        String url = "https://api.metals.dev/v1/latest?api_key=" + metalsApiKey + "&currency=INR&unit=toz";
        JsonNode root = getJson(url);
        if (!"success".equals(root.path("status").asText())) {
            throw new RuntimeException("metals.dev status: " + root.path("status").asText());
        }
        double goldPerOz = root.path("metals").path("gold").asDouble();
        double silverPerOz = root.path("metals").path("silver").asDouble();
        if (goldPerOz <= 0 || silverPerOz <= 0) {
            throw new RuntimeException("metals.dev returned invalid prices");
        }
        return new RateSnapshot(goldPerOz / OZ_TO_GRAM, silverPerOz / OZ_TO_GRAM, "metals.dev", Instant.now());
    }

    private RateSnapshot fetchFromRapidApi() throws Exception {
        if (rapidApiKey == null || rapidApiKey.isBlank()) {
            throw new RuntimeException("RAPIDAPI_KEY is missing");
        }

        String todayStr = java.time.LocalDate.now().toString();
        String host = "gold-silver-live-price-india.p.rapidapi.com";
        String city = "Delhi";

        JsonNode goldJson = fetchRapidApiWithFallback(host, "gold_historical_price_india_city_value", city, todayStr);
        JsonNode silverJson = fetchRapidApiWithFallback(host, "silver_historical_price_india_city_value", city, todayStr);

        double goldPerGram = parseRapidApiValue(goldJson, city, "24k");
        double silverPerGram = parseRapidApiValue(silverJson, city, "1g");

        if (goldPerGram <= 0 || silverPerGram <= 0) {
            throw new RuntimeException("RapidAPI returned invalid Delhi prices (gold24k/silver1g)");
        }
        return new RateSnapshot(goldPerGram, silverPerGram, "RapidAPI (Delhi)", Instant.now());
    }

    private JsonNode fetchRapidApiWithFallback(String host, String path, String city, String date) throws Exception {
        try {
            return getRapidApiJson(host, path, city, date);
        } catch (Exception e) {
            String yesterday = java.time.LocalDate.now().minusDays(1).toString();
            log.warn("RapidAPI {} failed for date={}, retrying with date={}: {}", path, date, yesterday, e.getMessage());
            return getRapidApiJson(host, path, city, yesterday);
        }
    }

    private JsonNode getRapidApiJson(String host, String path, String city, String date) throws Exception {
        String url = "https://" + host + "/" + path + "/";
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .header("Accept", "application/json")
                .header("Content-Type", "application/json")
                .header("city", city)
                .header("required-date-yyyy-mm-dd", date)
                .header("x-rapidapi-host", host)
                .header("x-rapidapi-key", rapidApiKey)
                .timeout(Duration.ofSeconds(10))
                .GET()
                .build();
        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new RuntimeException(url + " returned HTTP " + response.statusCode());
        }
        return mapper.readTree(response.body());
    }

    private double parseRapidApiValue(JsonNode node, String city, String keySuffix) {
        if (node == null) return 0.0;
        String exactKey = city + "_" + keySuffix;
        if (node.has(exactKey)) {
            return node.path(exactKey).asDouble();
        }
        var fields = node.fields();
        while (fields.hasNext()) {
            var entry = fields.next();
            String k = entry.getKey().toLowerCase();
            if (k.contains(city.toLowerCase()) && k.contains(keySuffix.toLowerCase())) {
                return entry.getValue().asDouble();
            }
        }
        return 0.0;
    }

    private RateSnapshot fetchFromGoldApi() throws Exception {
        double goldUsdOz = getJson("https://api.gold-api.com/price/XAU").path("price").asDouble();
        double silverUsdOz = getJson("https://api.gold-api.com/price/XAG").path("price").asDouble();
        double usdToInr = getJson("https://open.er-api.com/v6/latest/USD").path("rates").path("INR").asDouble();
        if (goldUsdOz <= 0 || silverUsdOz <= 0 || usdToInr <= 0) {
            throw new RuntimeException("gold-api.com / FX returned invalid data");
        }
        double goldPerGram = (goldUsdOz / OZ_TO_GRAM) * usdToInr;
        double silverPerGram = (silverUsdOz / OZ_TO_GRAM) * usdToInr;
        return new RateSnapshot(goldPerGram, silverPerGram, "gold-api.com", Instant.now());
    }

    private JsonNode getJson(String url) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .header("Accept", "application/json")
                .timeout(Duration.ofSeconds(10))
                .GET()
                .build();
        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new RuntimeException(url + " returned HTTP " + response.statusCode());
        }
        return mapper.readTree(response.body());
    }

    public record RateSnapshot(double goldPerGram, double silverPerGram, String source, Instant fetchedAt) {}

    public static class RatesUnavailableException extends RuntimeException {
        public RatesUnavailableException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
