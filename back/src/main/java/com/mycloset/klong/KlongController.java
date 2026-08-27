package com.mycloset.klong;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mycloset.auth.AuthMapper;

@RestController
@RequestMapping("/api/klong")
public class KlongController {

    private final KlongService klongService;
    private final AuthMapper authMapper;

    public KlongController(KlongService klongService, AuthMapper authMapper) {
        this.klongService = klongService;
        this.authMapper = authMapper;
    }

    @SuppressWarnings("unchecked")
    @PostMapping("/chat")
    public Map<String, String> chat(@RequestBody Map<String, Object> body) {
        List<Map<String, String>> history = (List<Map<String, String>>) body.get("history");
        String message = (String) body.get("message");
        return Map.of("reply", klongService.chat(history, message));
    }

    @PostMapping("/recommend")
    public Map<String, String> recommend(@RequestHeader("Authorization") String authorization) {
        String token = authorization.replaceFirst("(?i)^Bearer\\s+", "");
        Long userId = authMapper.findUserIdByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요해요"));
        return Map.of("result", klongService.recommendOtherBrands(userId));
    }
}
