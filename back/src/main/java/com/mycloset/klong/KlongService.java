package com.mycloset.klong;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.mycloset.wardrobe.WardrobeItem;
import com.mycloset.wardrobe.WardrobeService;

@Service
public class KlongService {

    private static final Pattern NAME_PATTERN = Pattern.compile("\"name\"\\s*:\\s*\"([^\"]*)\"");

    private static final String PERSONA_PROMPT = """
            너는 '클롱'이라는 이름의 친근하고 트렌디한 AI 패션 스타일리스트야.
            사용자와 반말로 편하게 대화하면서 스타일 고민을 들어주고 조언을 해줘.
            답변은 2~4문장 정도로 짧고 친근하게, 이모지 없이 대답해.
            """;

    private static final String RECOMMEND_PROMPT_TEMPLATE = """
            너는 '클롱'이라는 AI 패션 스타일리스트야. 사용자의 기존 옷장 아이템을 참고해서,
            사용자 스타일과 잘 어울릴 만한 다른 브랜드의 아이템을 3개 추천해줘.

            사용자가 가진 아이템: %s

            실제로 존재하는 국내외 패션 브랜드 중에서 골라 추천하고, 왜 이 아이템을 추천하는지
            사용자의 기존 스타일과 연결지어 근거를 설명해줘.
            특정 실제 판매 중인 정확한 제품(가격, 재고 등)을 보장하듯 말하지 말고,
            그 브랜드의 대표적인 스타일 방향을 참고해서 추천해줘.
            각 아이템의 대표적인 색상을 hex 코드로도 알려줘.

            아래 JSON 형식으로만 답하세요. 다른 설명이나 마크다운 코드블록 없이 순수 JSON만 출력하세요.
            {"recommendations":[{"brand":"무신사 스탠다드","item":"오버사이즈 코튼 셔츠","reason":"...","colorHex":"#F5F0E8"}]}
            """;

    private final RestClient openAiClient;
    private final String model;
    private final WardrobeService wardrobeService;

    public KlongService(
            WardrobeService wardrobeService,
            @Value("${openai.api-key}") String apiKey,
            @Value("${openai.model}") String model) {
        this.openAiClient = RestClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
        this.model = model;
        this.wardrobeService = wardrobeService;
    }

    @SuppressWarnings("unchecked")
    public String chat(List<Map<String, String>> history, String message) {
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", PERSONA_PROMPT));
        if (history != null) {
            for (Map<String, String> turn : history) {
                messages.add(Map.of("role", turn.get("role"), "content", turn.get("content")));
            }
        }
        messages.add(Map.of("role", "user", "content", message));

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "max_tokens", 300,
                "messages", messages);

        Map<String, Object> response = openAiClient.post()
                .uri("/chat/completions")
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        return extractContent(response).trim();
    }

    @SuppressWarnings("unchecked")
    public String recommendOtherBrands(Long userId) {
        List<WardrobeItem> myItems = wardrobeService.findMyItems(userId);
        String itemSummary = summarizeItemNames(myItems);
        if (itemSummary.isBlank()) {
            itemSummary = "아직 등록된 아이템이 없음";
        }

        String prompt = RECOMMEND_PROMPT_TEMPLATE.formatted(itemSummary);

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "response_format", Map.of("type", "json_object"),
                "max_tokens", 600,
                "messages", List.of(Map.of("role", "user", "content", prompt)));

        Map<String, Object> response = openAiClient.post()
                .uri("/chat/completions")
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        return sanitize(extractContent(response));
    }

    private String summarizeItemNames(List<WardrobeItem> items) {
        List<String> names = new ArrayList<>();
        for (WardrobeItem item : items) {
            if (item.getItemsJson() == null) continue;
            Matcher matcher = NAME_PATTERN.matcher(item.getItemsJson());
            while (matcher.find()) {
                names.add(matcher.group(1));
            }
        }
        return String.join(", ", names);
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
