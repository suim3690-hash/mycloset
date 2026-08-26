package com.mycloset.stylist;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StyleProfile {
    private Long id;
    private Long userId;
    private String gender;
    private Integer heightCm;
    private Integer weightKg;
    private String preferredLooks;
    private String recommendation;
    private LocalDateTime updatedAt;
}
