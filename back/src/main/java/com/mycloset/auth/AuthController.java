package com.mycloset.auth;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public AuthResponse signup(@RequestBody Map<String, String> body) {
        return authService.signup(body.get("email"), body.get("password"), body.get("displayName"));
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody Map<String, String> body) {
        return authService.login(body.get("email"), body.get("password"));
    }

    @GetMapping("/me")
    public AppUser me(@RequestHeader("Authorization") String authorization) {
        return authService.findBySessionToken(extractToken(authorization));
    }

    @GetMapping("/users/{id}")
    public AppUser publicProfile(@PathVariable Long id) {
        return authService.publicProfile(id);
    }

    @PostMapping("/profile")
    public AppUser updateProfile(
            @RequestHeader("Authorization") String authorization,
            @RequestParam(value = "displayName", required = false) String displayName,
            @RequestParam(value = "bio", required = false) String bio,
            @RequestParam(value = "avatar", required = false) MultipartFile avatar) {
        return authService.updateProfile(extractToken(authorization), displayName, bio, avatar);
    }

    @PostMapping("/logout")
    public void logout(@RequestHeader("Authorization") String authorization) {
        authService.logout(extractToken(authorization));
    }

    private String extractToken(String authorizationHeader) {
        return authorizationHeader.replaceFirst("(?i)^Bearer\\s+", "");
    }
}
