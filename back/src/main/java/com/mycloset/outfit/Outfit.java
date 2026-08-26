package com.mycloset.outfit;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Outfit {
    private Long id;
    private LocalDate recordDate;
    private String photoPath;
    private String filterType;
    private String memo;
    private Integer isMain;
    private String itemTags;
    private String lookCategory;
    private String location;
    private Integer likeCount;
    private Integer isLiked;
    private Integer isSaved;
    private LocalDateTime createdAt;
    private Long userId;
    private String authorDisplayName;
    private String authorAvatarPath;
}
