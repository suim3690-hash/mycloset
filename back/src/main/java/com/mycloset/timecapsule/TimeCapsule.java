package com.mycloset.timecapsule;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TimeCapsule {
    private Long id;
    private LocalDate recordDate;
    private String message;
    private LocalDate revealDate;
    private Integer opened;
    private LocalDateTime createdAt;
}
