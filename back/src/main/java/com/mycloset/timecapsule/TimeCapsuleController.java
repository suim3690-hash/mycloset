package com.mycloset.timecapsule;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/timecapsules")
public class TimeCapsuleController {

    private final TimeCapsuleService capsuleService;

    public TimeCapsuleController(TimeCapsuleService capsuleService) {
        this.capsuleService = capsuleService;
    }

    @PostMapping
    public TimeCapsule create(@RequestBody Map<String, String> body) {
        return capsuleService.create(
                LocalDate.parse(body.get("recordDate")),
                body.get("message"),
                LocalDate.parse(body.get("revealDate")));
    }

    @GetMapping("/due")
    public List<TimeCapsule> findDue() {
        return capsuleService.findDue();
    }

    @PostMapping("/{id}/open")
    public void markOpened(@PathVariable Long id) {
        capsuleService.markOpened(id);
    }
}
