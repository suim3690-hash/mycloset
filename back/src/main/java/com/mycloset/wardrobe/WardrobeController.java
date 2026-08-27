package com.mycloset.wardrobe;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mycloset.auth.AuthMapper;

@RestController
@RequestMapping("/api/wardrobe")
public class WardrobeController {

    private final WardrobeService wardrobeService;
    private final AuthMapper authMapper;

    public WardrobeController(WardrobeService wardrobeService, AuthMapper authMapper) {
        this.wardrobeService = wardrobeService;
        this.authMapper = authMapper;
    }

    @GetMapping
    public List<WardrobeItem> findMyItems(@RequestHeader("Authorization") String authorization) {
        return wardrobeService.findMyItems(resolveUserId(authorization));
    }

    @SuppressWarnings("unchecked")
    @PostMapping("/match")
    public Map<String, String> match(@RequestBody Map<String, Object> body) {
        List<Map<String, String>> items = (List<Map<String, String>>) body.get("items");
        return Map.of("result", wardrobeService.matchOutfits(items));
    }

    private Long resolveUserId(String authorizationHeader) {
        String token = authorizationHeader.replaceFirst("(?i)^Bearer\\s+", "");
        return authMapper.findUserIdByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요해요"));
    }
}
