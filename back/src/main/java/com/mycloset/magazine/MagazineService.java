package com.mycloset.magazine;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class MagazineService {

    private static final String PROMPT_TEMPLATE = """
            아래는 패션 매거진 기사 제목입니다. 이 제목만 보고, 독자가 원문을 클릭해서 읽고 싶어지도록
            한국어로 1~2문장짜리 짧은 미리보기 요약을 써주세요.
            기사 본문을 알 수 없으니 구체적인 사실을 지어내지 말고, 제목에서 유추 가능한 분위기와
            일반적인 스타일링 팁 수준으로만 작성하세요. 요약문 텍스트만 출력하세요 (따옴표, 설명 없이).

            매체: %s
            제목: %s
            """;

    private final RestClient openAiClient;
    private final String model;
    private final MagazineArticleMapper articleMapper;

    public MagazineService(
            MagazineArticleMapper articleMapper,
            @Value("${openai.api-key}") String apiKey,
            @Value("${openai.model}") String model) {
        this.openAiClient = RestClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
        this.model = model;
        this.articleMapper = articleMapper;
    }

    public List<MagazineArticle> listByCategories(List<String> categories) {
        List<MagazineArticle> articles = (categories == null || categories.isEmpty())
                ? articleMapper.findAll()
                : articleMapper.findByCategories(categories);

        for (MagazineArticle article : articles) {
            if (article.getSummaryKo() == null || article.getSummaryKo().isBlank()) {
                String summary = generateSummary(article);
                article.setSummaryKo(summary);
                MagazineArticle update = new MagazineArticle();
                update.setId(article.getId());
                update.setSummaryKo(summary);
                articleMapper.updateSummary(update);
            }
        }
        return articles;
    }

    private String generateSummary(MagazineArticle article) {
        String prompt = PROMPT_TEMPLATE.formatted(article.getSourceName(), article.getTitle());

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "max_tokens", 150,
                "messages", List.of(Map.of("role", "user", "content", prompt)));

        Map<String, Object> response = openAiClient.post()
                .uri("/chat/completions")
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        return extractContent(response).trim();
    }

    @SuppressWarnings("unchecked")
    private String extractContent(Map<String, Object> response) {
        List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
        return (String) message.get("content");
    }
}
