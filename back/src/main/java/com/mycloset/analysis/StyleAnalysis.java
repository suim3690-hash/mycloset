package com.mycloset.analysis;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StyleAnalysis {
    private Long id;
    private LocalDate recordDate;
    /** JSON string, e.g. [{"category":"스트릿","percent":50}, ...] */
    private String styleBreakdown;
    /** comma-separated mood tags chosen by the user (e.g. 오늘 최악/쏘쏘/꾸꾸/꾸안꾸) */
    private String selectedTags;
    /** comma-separated reason tags for why the outfit felt off (e.g. #색조합) */
    private String reasonTags;
    private String factBomb;
    private LocalDateTime createdAt;
}
