package com.mycloset.magazine;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MagazineArticle {
    private Long id;
    private String category;
    private String title;
    private String sourceName;
    private String sourceUrl;
    private String imageUrl;
    private String summaryKo;
    private LocalDateTime createdAt;
}
