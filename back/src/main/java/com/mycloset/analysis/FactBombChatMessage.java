package com.mycloset.analysis;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FactBombChatMessage {
    private Long id;
    private LocalDate recordDate;
    private String role;
    private String content;
    private LocalDateTime createdAt;
}
