package com.mycloset.preview;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import com.mycloset.outfit.Outfit;
import com.mycloset.outfit.OutfitMapper;

@Service
public class PreviewService {

    private static final int MAX_REFERENCE_PHOTOS = 5;

    private static final String PROMPT = """
            사용자가 구매를 고민 중인 새 옷/아이템 사진 1장(첫 번째 이미지)과,
            사용자가 기존에 기록한 옷장 사진 여러 장(이후 이미지들, 순서대로 0번부터 번호가 매겨짐)을 보여줍니다.
            새 아이템이 기존 옷장과 얼마나 잘 어울리는지 판단하고,
            가장 잘 어울리는 기존 사진 번호(matchIndex, 0부터 시작하는 정수)와 그 이유,
            실제로 조합해서 입을 수 있는 구체적인 스타일링 팁 2~3개를 알려주세요.
            아이템 사진이 옷이 아니거나 스타일링이 애매하면 솔직하게 그렇게 말해도 됩니다.
            아래 JSON 형식으로만, 다른 설명이나 마크다운 코드블록 없이 답하세요:
            {"itemDescription":"...","matchIndex":0,"matchReason":"...","stylingTips":["...","..."]}
            """;

    private final RestClient openAiClient;
    private final String model;
    private final OutfitMapper outfitMapper;
    private final Path uploadDir;

    public PreviewService(
            OutfitMapper outfitMapper,
            @Value("${openai.api-key}") String apiKey,
            @Value("${openai.model}") String model,
            @Value("${app.upload-dir}") String uploadDir) {
        this.openAiClient = RestClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
        this.model = model;
        this.outfitMapper = outfitMapper;
        this.uploadDir = Path.of(uploadDir);
    }

    public PreviewResult simulate(MultipartFile photo) {
        List<Outfit> references = outfitMapper.findAll().stream()
                .filter(o -> o.getPhotoPath() != null)
                .limit(MAX_REFERENCE_PHOTOS)
                .toList();
        if (references.isEmpty()) {
            throw new IllegalStateException("비교할 기존 옷장 기록이 없습니다. 먼저 코디를 기록해주세요.");
        }

        List<Map<String, Object>> content = new ArrayList<>();
        content.add(Map.of("type", "text", "text", PROMPT));
        content.add(Map.of("type", "image_url", "image_url", Map.of("url", toDataUrl(photo))));
        for (Outfit o : references) {
            content.add(Map.of("type", "image_url", "image_url",
                    Map.of("url", "data:" + mimeTypeOf(o.getPhotoPath()) + ";base64," + readPhotoAsBase64(o.getPhotoPath()))));
        }

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "response_format", Map.of("type", "json_object"),
                "max_tokens", 500,
                "messages", List.of(Map.of("role", "user", "content", content)));

        Map<String, Object> response = openAiClient.post()
                .uri("/chat/completions")
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        String json = sanitize(extractContent(response));

        return new PreviewResult(json, references.stream().map(Outfit::getPhotoPath).toList());
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

    private String toDataUrl(MultipartFile photo) {
        try {
            String base64 = Base64.getEncoder().encodeToString(photo.getBytes());
            String contentType = photo.getContentType() != null ? photo.getContentType() : "image/jpeg";
            return "data:" + contentType + ";base64," + base64;
        } catch (IOException e) {
            throw new IllegalStateException("업로드한 사진을 읽을 수 없습니다", e);
        }
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
