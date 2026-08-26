package com.mycloset.geo;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class GeoService {

    private static final List<String> AREA_FIELDS = List.of("city", "town", "county", "state");
    private static final List<String> DETAIL_FIELDS = List.of("borough", "suburb", "quarter", "neighbourhood");

    private final RestClient nominatimClient = RestClient.builder()
            .baseUrl("https://nominatim.openstreetmap.org")
            .defaultHeader("User-Agent", "mycloset-fashion-diary-app (personal project)")
            .build();

    @SuppressWarnings("unchecked")
    public String reverseGeocode(double lat, double lon) {
        Map<String, Object> response = nominatimClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/reverse")
                        .queryParam("lat", lat)
                        .queryParam("lon", lon)
                        .queryParam("format", "json")
                        .queryParam("accept-language", "ko")
                        .build())
                .retrieve()
                .body(Map.class);

        if (response == null || !(response.get("address") instanceof Map)) {
            return null;
        }
        Map<String, Object> address = (Map<String, Object>) response.get("address");

        String area = firstPresent(address, AREA_FIELDS);
        String detail = firstPresent(address, DETAIL_FIELDS);

        if (area == null && detail == null) {
            return null;
        }
        return String.join(" ", java.util.Objects.requireNonNullElse(area, ""), java.util.Objects.requireNonNullElse(detail, "")).trim();
    }

    private String firstPresent(Map<String, Object> address, List<String> keys) {
        for (String key : keys) {
            Object value = address.get(key);
            if (value instanceof String s && !s.isBlank()) {
                return s;
            }
        }
        return null;
    }
}
