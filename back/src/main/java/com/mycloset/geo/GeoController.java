package com.mycloset.geo;

import java.util.Collections;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/geo")
public class GeoController {

    private final GeoService geoService;

    public GeoController(GeoService geoService) {
        this.geoService = geoService;
    }

    @GetMapping("/reverse")
    public Map<String, String> reverse(@RequestParam double lat, @RequestParam double lon) {
        String location = geoService.reverseGeocode(lat, lon);
        return location != null ? Map.of("location", location) : Collections.emptyMap();
    }
}
