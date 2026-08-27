package com.mycloset.wardrobe;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WardrobeItem {
    private Long id;
    private Long outfitId;
    private Long userId;
    private String itemsJson;
    private LocalDateTime createdAt;
    private String photoPath;
    private LocalDate recordDate;
}
