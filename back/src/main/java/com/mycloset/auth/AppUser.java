package com.mycloset.auth;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppUser {
    private Long id;
    private String email;
    private String passwordHash;
    private String displayName;
    private String bio;
    private String avatarPath;
    private String coverPath;
    private boolean isAdmin;
    private LocalDateTime createdAt;
}
