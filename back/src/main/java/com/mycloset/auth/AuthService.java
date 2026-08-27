package com.mycloset.auth;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final AuthMapper authMapper;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final Path uploadDir;

    public AuthService(AuthMapper authMapper, @Value("${app.upload-dir}") String uploadDir) {
        this.authMapper = authMapper;
        this.uploadDir = Path.of(uploadDir);
    }

    public AuthResponse signup(String email, String password, String displayName) {
        if (email == null || email.isBlank() || password == null || password.length() < 6) {
            throw new IllegalArgumentException("이메일과 6자 이상의 비밀번호를 입력해주세요");
        }
        if (authMapper.findUserByEmail(email).isPresent()) {
            throw new IllegalArgumentException("이미 가입된 이메일이에요");
        }

        AppUser user = new AppUser();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setDisplayName(displayName == null || displayName.isBlank() ? "나의 옷장 주인" : displayName);
        authMapper.insertUser(user);

        return issueSession(user);
    }

    public AuthResponse login(String email, String password) {
        AppUser user = authMapper.findUserByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않아요"));
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않아요");
        }
        return issueSession(user);
    }

    public AppUser findBySessionToken(String token) {
        Long userId = authMapper.findUserIdByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요해요"));
        AppUser user = authMapper.findUserById(userId)
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요해요"));
        return sanitize(user);
    }

    public AppUser updateProfile(
            String token, String displayName, String bio, MultipartFile avatar, MultipartFile cover) {
        Long userId = authMapper.findUserIdByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요해요"));
        AppUser existing = authMapper.findUserById(userId)
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요해요"));

        AppUser update = new AppUser();
        update.setId(userId);
        update.setDisplayName(displayName == null || displayName.isBlank() ? existing.getDisplayName() : displayName);
        update.setBio(bio);
        update.setAvatarPath(avatar != null && !avatar.isEmpty() ? saveImage(avatar) : existing.getAvatarPath());
        update.setCoverPath(cover != null && !cover.isEmpty() ? saveImage(cover) : existing.getCoverPath());

        authMapper.updateProfile(update);
        return sanitize(authMapper.findUserById(userId).orElseThrow());
    }

    public void logout(String token) {
        authMapper.deleteSession(token);
    }

    public Long resolveUserId(String authorizationHeader) {
        String token = extractToken(authorizationHeader);
        return authMapper.findUserIdByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요해요"));
    }

    public AppUser publicProfile(Long userId) {
        AppUser user = authMapper.findUserById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없어요"));
        AppUser publicUser = new AppUser();
        publicUser.setId(user.getId());
        publicUser.setDisplayName(user.getDisplayName());
        publicUser.setBio(user.getBio());
        publicUser.setAvatarPath(user.getAvatarPath());
        publicUser.setCoverPath(user.getCoverPath());
        return publicUser;
    }

    private String extractToken(String authorizationHeader) {
        if (authorizationHeader == null) {
            throw new IllegalArgumentException("로그인이 필요해요");
        }
        return authorizationHeader.replaceFirst("(?i)^Bearer\\s+", "");
    }

    private AuthResponse issueSession(AppUser user) {
        String token = generateToken();
        authMapper.insertSession(new SessionRow(token, user.getId()));
        return new AuthResponse(token, sanitize(user));
    }

    private AppUser sanitize(AppUser user) {
        user.setPasswordHash(null);
        return user;
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String saveImage(MultipartFile image) {
        try {
            Files.createDirectories(uploadDir);
            String original = image.getOriginalFilename();
            String extension = original != null && original.contains(".")
                    ? original.substring(original.lastIndexOf('.'))
                    : ".jpg";
            String fileName = UUID.randomUUID() + extension;
            Files.copy(image.getInputStream(), uploadDir.resolve(fileName));
            return fileName;
        } catch (IOException e) {
            throw new IllegalStateException("이미지 저장에 실패했습니다", e);
        }
    }
}
