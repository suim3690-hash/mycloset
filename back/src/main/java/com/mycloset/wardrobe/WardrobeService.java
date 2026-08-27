package com.mycloset.wardrobe;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.mycloset.outfit.Outfit;

@Service
public class WardrobeService {

    private static final Logger log = LoggerFactory.getLogger(WardrobeService.class);

    private static final String PROMPT = """
            이 사진은 사용자가 오늘 입은 코디 사진입니다.
            사진 속에서 실제로 착용하고 있는 옷/소품 아이템을 파악해서,
            다음 8개 카테고리 중 해당하는 것으로만 분류해주세요: 상의, 아우터, 바지, 원피스, 스커트, 가방, 모자, 소품

            사진에 실제로 보이는 아이템만 포함하고, 안 보이거나 확실하지 않은 카테고리는 포함하지 마세요.
            각 아이템마다 색상/특징을 담은 간단한 한국어 이름을 붙여주세요 (예: "화이트 반팔 티셔츠", "블랙 크로스백").

            아래 JSON 형식으로만 답하세요. 다른 설명이나 마크다운 코드블록 없이 순수 JSON만 출력하세요.
            {"items":[{"category":"상의","name":"화이트 반팔 티셔츠"},{"category":"바지","name":"블랙 슬랙스"}]}
            """;

    private static final String MATCH_PROMPT_TEMPLATE = """
            다음은 사용자의 옷장에 있는 아이템 목록입니다. 각 아이템은 번호(index)로 구분됩니다.

            %s

            이 중에서 상의(또는 원피스)와 하의(바지/스커트)를 서로 잘 어울리는 조합으로 묶어서 코디를 추천해주세요.
            원피스는 그 자체로 완성된 룩이니 하의와 묶지 말고 단독으로 추천하세요.
            최대한 다양한 조합으로 2~4개를 추천하고, 색감/실루엣/분위기를 근거로
            왜 이 조합이 잘 어울리는지, 어떤 룩(스타일)이 완성되는지 설명하세요.
            목록에 없는 인덱스는 절대 사용하지 마세요.

            아래 JSON 형식으로만 답하세요. 다른 설명이나 마크다운 코드블록 없이 순수 JSON만 출력하세요.
            원피스 단독 추천인 경우 bottomIndex는 null로 주세요.
            {"matches":[{"topIndex":0,"bottomIndex":3,"look":"미니멀룩","reason":"..."},{"topIndex":2,"bottomIndex":null,"look":"러블리룩","reason":"..."}]}
            """;

    private final RestClient openAiClient;
    private final String model;
    private final WardrobeMapper wardrobeMapper;
    private final Path uploadDir;

    public WardrobeService(
            WardrobeMapper wardrobeMapper,
            @Value("${openai.api-key}") String apiKey,
            @Value("${openai.model}") String model,
            @Value("${app.upload-dir}") String uploadDir) {
        this.openAiClient = RestClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
        this.model = model;
        this.wardrobeMapper = wardrobeMapper;
        this.uploadDir = Path.of(uploadDir);
    }

    @SuppressWarnings("unchecked")
    public void classifyAndSave(Outfit outfit) {
        try {
            String dataUrl = "data:" + mimeTypeOf(outfit.getPhotoPath()) + ";base64,"
                    + readPhotoAsBase64(outfit.getPhotoPath());

            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "response_format", Map.of("type", "json_object"),
                    "max_tokens", 400,
                    "messages", List.of(
                            Map.of(
                                    "role", "user",
                                    "content", List.of(
                                            Map.of("type", "text", "text", PROMPT),
                                            Map.of("type", "image_url", "image_url", Map.of("url", dataUrl))))));

            Map<String, Object> response = openAiClient.post()
                    .uri("/chat/completions")
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            String json = sanitize((String) message.get("content"));

            WardrobeItem record = new WardrobeItem();
            record.setOutfitId(outfit.getId());
            record.setUserId(outfit.getUserId());
            record.setItemsJson(json);
            wardrobeMapper.insert(record);
        } catch (Exception e) {
            log.warn("옷장 아이템 분류에 실패했습니다 (outfitId={}): {}", outfit.getId(), e.getMessage());
        }
    }

    public List<WardrobeItem> findMyItems(Long userId) {
        return wardrobeMapper.findByUserId(userId);
    }

    @SuppressWarnings("unchecked")
    public String matchOutfits(List<Map<String, String>> items) {
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("옷장에 매칭할 아이템이 없어요");
        }

        StringBuilder itemList = new StringBuilder();
        for (int i = 0; i < items.size(); i++) {
            Map<String, String> item = items.get(i);
            itemList.append(i).append(": [").append(item.get("category")).append("] ")
                    .append(item.get("name")).append('\n');
        }

        String prompt = MATCH_PROMPT_TEMPLATE.formatted(itemList.toString());

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

        List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
        return sanitize((String) message.get("content"));
    }

    private String sanitize(String text) {
        String trimmed = text.trim();
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.replaceFirst("^```[a-zA-Z]*", "").trim();
            trimmed = trimmed.replaceFirst("```$", "").trim();
        }
        return trimmed;
    }

    private String readPhotoAsBase64(String photoPath) {
        try {
            byte[] bytes = Files.readAllBytes(uploadDir.resolve(photoPath));
            return Base64.getEncoder().encodeToString(bytes);
        } catch (IOException e) {
            throw new IllegalStateException("사진을 읽을 수 없습니다: " + photoPath, e);
        }
    }

    private String mimeTypeOf(String photoPath) {
        String lower = photoPath.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".gif")) return "image/gif";
        return "image/jpeg";
    }
}
