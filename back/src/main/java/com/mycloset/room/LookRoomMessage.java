package com.mycloset.room;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LookRoomMessage {
    private Long id;
    private String lookCategory;
    private Long userId;
    private String content;
    private LocalDateTime createdAt;
    private String senderName;
    private String senderAvatarPath;
}
