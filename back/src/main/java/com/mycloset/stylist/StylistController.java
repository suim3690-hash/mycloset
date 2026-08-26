package com.mycloset.stylist;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mycloset.auth.AuthMapper;

@RestController
@RequestMapping("/api/stylist")
public class StylistController {

    private final StylistService stylistService;
    private final AuthMapper authMapper;

    public StylistController(StylistService stylistService, AuthMapper authMapper) {
        this.stylistService = stylistService;
        this.authMapper = authMapper;
    }

    @GetMapping("/profile")
    public ResponseEntity<StyleProfile> getProfile(@RequestHeader("Authorization") String authorization) {
        return stylistService.getProfile(resolveUserId(authorization))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @SuppressWarnings("unchecked")
    @PostMapping("/recommend")
    public StyleProfile recommend(
            @RequestHeader("Authorization") String authorization,
            @RequestBody Map<String, Object> body) {
        Long userId = resolveUserId(authorization);
        String gender = (String) body.get("gender");
        Integer heightCm = (Integer) body.get("heightCm");
        Integer weightKg = (Integer) body.get("weightKg");
        List<String> preferredLooks = (List<String>) body.getOrDefault("preferredLooks", List.of());
        return stylistService.recommend(userId, gender, heightCm, weightKg, preferredLooks);
    }

    private Long resolveUserId(String authorizationHeader) {
        String token = authorizationHeader.replaceFirst("(?i)^Bearer\\s+", "");
        return authMapper.findUserIdByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요해요"));
    }
}
