package com.mycloset.analysis;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.mycloset.outfit.Outfit;
import com.mycloset.outfit.OutfitMapper;

@Service
public class StyleAnalysisService {

    private static final String STYLE_CATEGORIES = String.join(", ", List.of(
            "미니멀룩", "클래식룩", "캐주얼룩", "스트릿룩", "댄디룩", "시티보이룩", "시티걸룩", "스포티룩",
            "애슬레저룩", "빈티지룩", "레트로룩", "아메카지룩", "워크웨어룩", "밀리터리룩", "프레피룩", "테크웨어룩",
            "고프코어룩", "그런지룩", "힙합룩", "Y2K룩", "발레코어룩", "페미닌룩", "러블리룩", "로맨틱룩",
            "걸리시룩", "오피스룩", "포멀룩", "올드머니룩", "모던룩", "젠더리스룩"));

    private static final String PROMPT = """
            이 사진은 사용자가 오늘 입은 코디 사진입니다.
            다음 스타일 카테고리 중에서 이 코디와 가장 잘 맞는 2~4개를 골라,
            각 비중의 합이 100이 되도록 퍼센트를 매겨주세요.
            카테고리 목록: %s
            각 카테고리마다 사진 속 옷차림의 구체적인 특징(아이템, 색감, 실루엣 등)을 근거로
            왜 그 카테고리와 비중을 부여했는지 한국어로 1~2문장의 간결한 근거(reason)를 함께 작성하세요.
            아래 JSON 형식으로만 답하세요. 다른 설명이나 마크다운 코드블록 없이 순수 JSON만 출력하세요.
            {"categories":[{"name":"스트릿룩","percent":50,"reason":"오버사이즈 후드와 로고 스니커즈 조합이 캐주얼하면서도 힘 있는 스트릿 무드를 만들어요."},{"name":"미니멀룩","percent":50,"reason":"무채색 톤과 군더더기 없는 실루엣이 절제된 미니멀 인상을 줘요."}]}
            """.formatted(STYLE_CATEGORIES);

    private static final String FACT_BOMB_PROMPT = """
            이 사진은 사용자가 오늘 입은 코디 사진입니다.
            당신은 필터 없이 팩트로 조지는 걸로 유명한 패션 인플루언서입니다.
            '팩트폭력' 컨셉이라 봐주는 거 1도 없이 솔직하게 갑니다.

            먼저 이 코디가 정말 감각적이고 완성도 높은, 진짜 잘 입은 코디인지 냉정하게 판단하세요.
            기준은 엄격합니다 — 무난하거나 평범한 정도로는 "잘 입었다"로 쳐주지 않습니다.

            - 진짜 감각적이고 완성도 높은 코디라면 (이런 경우는 드물어야 정상입니다):
              진심으로, 구체적으로 칭찬하세요.
            - 그 기준에 못 미치는 코디라면 (무난함, 애매함, 색 조합 이상함, 핏 안 맞음, 밸런스 깨짐 등
              포함 — 즉 대부분의 경우): 가차없이, 반말로, 밈처럼 웃기면서도 신랄하게 조지세요.
              돌려 말하지 말고 바로 팩트를 꽂으세요.
              예시 톤: "이건 코디가 아니라 사고야", "색 조합이 진짜 대참사네",
              "이거 입고 나온 용기가 대단하다", "누가 봐도 그냥 아무거나 걸친 티가 나" 같은 식으로
              과감하고 웃기게 조지세요.

            좋지도 나쁘지도 않은 애매한 평가는 하지 마세요. 확신이 안 서면 지적하는 쪽으로 기우세요.
            정확히 6줄로 작성하고, 각 줄은 짧은 한 문장으로, 줄바꿈으로만 구분하세요.
            외모나 신체에 대한 언급은 절대 하지 말고 옷차림과 스타일링에만 집중하세요.
            번호, 마크다운, 따옴표 없이 순수 텍스트 6줄만 출력하세요.
            """;

    private static final String CHAT_SYSTEM_PROMPT = """
            당신은 방금 사용자의 코디에 팩트폭력을 날린 '팩폭 상담사'입니다.
            사용자가 억울해하거나, 반박하거나, 이유를 물어보면 상담사답게 대화를 이어가되
            절대 봐주지 말고 방금과 같은 반말/팩폭 톤을 유지하세요.
            단, 구체적으로 왜 그렇게 평가했는지, 어떻게 하면 나아지는지도 함께 짚어주세요.
            외모나 신체에 대한 언급은 절대 하지 말고 옷차림과 스타일링에만 집중하세요.
            번호, 마크다운, 따옴표 없이 2~4문장의 순수 텍스트로만 짧고 임팩트 있게 답하세요.
            """;

    private static final int MAX_CHAT_TURNS = 3;

    private final RestClient openAiClient;
    private final String model;
    private final OutfitMapper outfitMapper;
    private final StyleAnalysisMapper analysisMapper;
    private final FactBombChatMapper chatMapper;
    private final Path uploadDir;

    public StyleAnalysisService(
            OutfitMapper outfitMapper,
            StyleAnalysisMapper analysisMapper,
            FactBombChatMapper chatMapper,
            @Value("${openai.api-key}") String apiKey,
            @Value("${openai.model}") String model,
            @Value("${app.upload-dir}") String uploadDir) {
        this.openAiClient = RestClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
        this.model = model;
        this.outfitMapper = outfitMapper;
        this.analysisMapper = analysisMapper;
        this.chatMapper = chatMapper;
        this.uploadDir = Path.of(uploadDir);
    }

    public StyleAnalysis analyze(LocalDate recordDate, boolean force) {
        Outfit outfit = outfitMapper.findByDate(recordDate)
                .orElseThrow(() -> new IllegalArgumentException("해당 날짜의 코디 기록이 없습니다: " + recordDate));

        Optional<StyleAnalysis> existing = analysisMapper.findByDate(recordDate);
        boolean hasBreakdown = existing.isPresent()
                && existing.get().getStyleBreakdown() != null
                && !existing.get().getStyleBreakdown().isBlank();
        if (hasBreakdown && !force) {
            return existing.get();
        }

        String dataUrl = "data:" + mimeTypeOf(outfit.getPhotoPath()) + ";base64," + readPhotoAsBase64(outfit.getPhotoPath());

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "response_format", Map.of("type", "json_object"),
                "max_tokens", 500,
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

        String json = sanitize(extractContent(response));

        if (existing.isPresent()) {
            StyleAnalysis update = new StyleAnalysis();
            update.setRecordDate(recordDate);
            update.setStyleBreakdown(json);
            analysisMapper.updateBreakdown(update);
            return analysisMapper.findByDate(recordDate).orElseThrow();
        }

        StyleAnalysis analysis = new StyleAnalysis();
        analysis.setRecordDate(recordDate);
        analysis.setStyleBreakdown(json);
        analysisMapper.insert(analysis);
        return analysis;
    }

    public StyleAnalysis generateFactBomb(LocalDate recordDate, boolean force) {
        Outfit outfit = outfitMapper.findByDate(recordDate)
                .orElseThrow(() -> new IllegalArgumentException("해당 날짜의 코디 기록이 없습니다: " + recordDate));

        Optional<StyleAnalysis> existing = analysisMapper.findByDate(recordDate);
        boolean hasFactBomb = existing.isPresent()
                && existing.get().getFactBomb() != null
                && !existing.get().getFactBomb().isBlank();
        if (hasFactBomb && !force) {
            return existing.get();
        }

        String dataUrl = "data:" + mimeTypeOf(outfit.getPhotoPath()) + ";base64," + readPhotoAsBase64(outfit.getPhotoPath());

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "max_tokens", 400,
                "messages", List.of(
                        Map.of(
                                "role", "user",
                                "content", List.of(
                                        Map.of("type", "text", "text", FACT_BOMB_PROMPT),
                                        Map.of("type", "image_url", "image_url", Map.of("url", dataUrl))))));

        Map<String, Object> response = openAiClient.post()
                .uri("/chat/completions")
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        String text = extractContent(response).trim();

        if (existing.isPresent()) {
            StyleAnalysis update = new StyleAnalysis();
            update.setRecordDate(recordDate);
            update.setFactBomb(text);
            analysisMapper.updateFactBomb(update);
        } else {
            StyleAnalysis fresh = new StyleAnalysis();
            fresh.setRecordDate(recordDate);
            fresh.setFactBomb(text);
            analysisMapper.insertFactBomb(fresh);
        }
        return analysisMapper.findByDate(recordDate).orElseThrow();
    }

    public List<FactBombChatMessage> getChat(LocalDate recordDate) {
        return chatMapper.findByDate(recordDate);
    }

    public List<FactBombChatMessage> sendChatMessage(LocalDate recordDate, String userMessage) {
        StyleAnalysis analysis = analysisMapper.findByDate(recordDate)
                .orElseThrow(() -> new IllegalArgumentException("팩트폭력 결과가 먼저 필요합니다: " + recordDate));
        if (analysis.getFactBomb() == null || analysis.getFactBomb().isBlank()) {
            throw new IllegalArgumentException("팩트폭력 결과가 먼저 필요합니다: " + recordDate);
        }

        List<FactBombChatMessage> history = chatMapper.findByDate(recordDate);
        long userTurns = history.stream().filter(m -> "user".equals(m.getRole())).count();
        if (userTurns >= MAX_CHAT_TURNS) {
            throw new IllegalStateException("오늘 상담은 여기까지예요. 다음에 또 만나요!");
        }

        List<Map<String, String>> messages = new java.util.ArrayList<>();
        messages.add(Map.of("role", "system", "content", CHAT_SYSTEM_PROMPT));
        messages.add(Map.of("role", "assistant", "content", analysis.getFactBomb()));
        for (FactBombChatMessage m : history) {
            messages.add(Map.of("role", m.getRole(), "content", m.getContent()));
        }
        messages.add(Map.of("role", "user", "content", userMessage));

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "max_tokens", 300,
                "messages", messages);

        Map<String, Object> response = openAiClient.post()
                .uri("/chat/completions")
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        String reply = extractContent(response).trim();

        FactBombChatMessage userMsg = new FactBombChatMessage();
        userMsg.setRecordDate(recordDate);
        userMsg.setRole("user");
        userMsg.setContent(userMessage);
        chatMapper.insert(userMsg);

        FactBombChatMessage assistantMsg = new FactBombChatMessage();
        assistantMsg.setRecordDate(recordDate);
        assistantMsg.setRole("assistant");
        assistantMsg.setContent(reply);
        chatMapper.insert(assistantMsg);

        return chatMapper.findByDate(recordDate);
    }

    public List<StyleAnalysis> findAll() {
        return analysisMapper.findAll();
    }

    public Optional<StyleAnalysis> findByDate(LocalDate recordDate) {
        return analysisMapper.findByDate(recordDate);
    }

    public StyleAnalysis saveTags(LocalDate recordDate, List<String> moodTags, List<String> reasonTags) {
        StyleAnalysis analysis = new StyleAnalysis();
        analysis.setRecordDate(recordDate);
        analysis.setSelectedTags(String.join(",", moodTags));
        analysis.setReasonTags(String.join(",", reasonTags));
        analysisMapper.updateTags(analysis);
        return analysisMapper.findByDate(recordDate)
                .orElseThrow(() -> new IllegalStateException("분석 결과를 찾을 수 없습니다: " + recordDate));
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
