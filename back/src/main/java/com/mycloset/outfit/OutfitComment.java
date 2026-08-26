package com.mycloset.outfit;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OutfitComment {
    private Long id;
    private Long outfitId;
    private String content;
    private LocalDateTime createdAt;
}
