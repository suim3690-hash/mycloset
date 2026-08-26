package com.mycloset;

import java.nio.file.Path;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload-dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = Path.of(uploadDir).toUri().toString();
        registry.addResourceHandler("/uploads/**").addResourceLocations(location);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Personal dev app on a home network — allow any origin (e.g. phone on the
        // same Wi-Fi hitting http://<PC-LAN-IP>:5173) instead of pinning to localhost.
        registry.addMapping("/api/**").allowedOriginPatterns("*");
        registry.addMapping("/uploads/**").allowedOriginPatterns("*");
    }
}
