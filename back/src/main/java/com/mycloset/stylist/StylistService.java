package com.mycloset.stylist;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class StylistService {

    private static final String LOOK_CATEGORIES = String.join(", ", List.of(
            "미니멀룩", "클래식룩", "캐주얼룩", "스트릿룩", "댄디룩", "시티보이룩", "시티걸룩", "스포티룩",
            "애슬레저룩", "빈티지룩", "레트로룩", "아메카지룩", "워크웨어룩", "밀리터리룩", "프레피룩", "테크웨어룩",
            "고프코어룩", "그런지룩", "힙합룩", "Y2K룩", "발레코어룩", "페미닌룩", "러블리룩", "로맨틱룩",
            "걸리시룩", "오피스룩", "포멀룩", "올드머니룩", "모던룩", "젠더리스룩"));

    private static final String PROMPT_TEMPLATE = """
            당신은 친절하고 전문적인 패션 스타일리스트입니다.
            다음 사용자 정보를 참고해서, 어울리는 스타일과 구체적인 코디를 추천해주세요.

            성별: %s
            키: %scm
            몸무게: %skg
            좋아하는 스타일: %s

            전체 스타일 카테고리 목록(참고용): %s

            체형과 취향을 함께 고려해서, 사용자가 좋아하는 스타일 중 가장 잘 어울릴 만한 스타일을 1~2개 고르고,
            실제로 입을 수 있는 구체적인 아이템(상의/하의/신발/액세서리)을 추천하세요.
            왜 이 조합이 이 사람에게 어울리는지 체형을 근거로 설명하세요.
            외모나 신체를 비하하거나 과도하게 언급하지 말고, 스타일링 관점에서 건설적으로 조언하세요.

            아래 JSON 형식으로만 답하세요. 다른 설명이나 마크다운 코드블록 없이 순수 JSON만 출력하세요.
            {"recommendedLooks":["스트릿룩","미니멀룩"],"summary":"1~2문장 요약","items":[{"category":"상의","item":"...","reason":"..."},{"category":"하의","item":"...","reason":"..."},{"category":"신발","item":"...","reason":"..."},{"category":"액세서리","item":"...","reason":"..."}],"tip":"체형을 살리는 스타일링 팁 1~2문장"}
            """;

    private final RestClient openAiClient;
    private final String model;
    private final StyleProfileMapper profileMapper;

    public StylistService(
            StyleProfileMapper profileMapper,
            @Value("${openai.api-key}") String apiKey,
            @Value("${openai.model}") String model) {
        this.openAiClient = RestClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
        this.model = model;
        this.profileMapper = profileMapper;
    }

    public Optional<StyleProfile> getProfile(Long userId) {
        return profileMapper.findByUserId(userId);
    }

    public StyleProfile recommend(
            Long userId, String gender, Integer heightCm, Integer weightKg, List<String> preferredLooks) {
        if (preferredLooks == null || preferredLooks.isEmpty()) {
            throw new IllegalArgumentException("좋아하는 스타일을 하나 이상 선택해주세요");
        }
        if (heightCm == null || weightKg == null || heightCm <= 0 || weightKg <= 0) {
            throw new IllegalArgumentException("키와 몸무게를 입력해주세요");
        }

        String prompt = PROMPT_TEMPLATE.formatted(
                gender == null || gender.isBlank() ? "선택 안 함" : gender,
                heightCm, weightKg, String.join(", ", preferredLooks), LOOK_CATEGORIES);

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "response_format", Map.of("type", "json_object"),
                "max_tokens", 700,
                "messages", List.of(Map.of("role", "user", "content", prompt)));

        Map<String, Object> response = openAiClient.post()
                .uri("/chat/completions")
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        String json = sanitize(extractContent(response));
        String preferredLooksCsv = String.join(",", preferredLooks);

        Optional<StyleProfile> existing = profileMapper.findByUserId(userId);
        if (existing.isPresent()) {
            StyleProfile update = new StyleProfile();
            update.setUserId(userId);
            update.setGender(gender);
            update.setHeightCm(heightCm);
            update.setWeightKg(weightKg);
            update.setPreferredLooks(preferredLooksCsv);
            update.setRecommendation(json);
            profileMapper.update(update);
        } else {
            StyleProfile fresh = new StyleProfile();
            fresh.setUserId(userId);
            fresh.setGender(gender);
            fresh.setHeightCm(heightCm);
            fresh.setWeightKg(weightKg);
            fresh.setPreferredLooks(preferredLooksCsv);
            fresh.setRecommendation(json);
            profileMapper.insert(fresh);
        }

        return profileMapper.findByUserId(userId).orElseThrow();
    }

    @SuppressWarnings("unchecked")
    private String extractContent(Map<String, Object> response) {
        List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
        return (String) message.get("content");
    }

    private String sanitize(String text) {
        String trimmed = text.trim();
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.replaceFirst("^```[a-zA-Z]*", "").trim();
            trimmed = trimmed.replaceFirst("```$", "").trim();
        }
        return trimmed;
    }
}
