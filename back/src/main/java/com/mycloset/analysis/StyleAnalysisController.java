package com.mycloset.analysis;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analysis")
public class StyleAnalysisController {

    private final StyleAnalysisService analysisService;

    public StyleAnalysisController(StyleAnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @PostMapping
    public StyleAnalysis analyze(
            @RequestParam("recordDate") String recordDate,
            @RequestParam(value = "force", defaultValue = "false") boolean force) {
        return analysisService.analyze(LocalDate.parse(recordDate), force);
    }

    @GetMapping
    public List<StyleAnalysis> findAll() {
        return analysisService.findAll();
    }

    @GetMapping("/{recordDate}")
    public ResponseEntity<StyleAnalysis> findByDate(@PathVariable String recordDate) {
        return analysisService.findByDate(LocalDate.parse(recordDate))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{recordDate}/fact-bomb")
    public StyleAnalysis generateFactBomb(
            @PathVariable String recordDate,
            @RequestParam(value = "force", defaultValue = "false") boolean force) {
        return analysisService.generateFactBomb(LocalDate.parse(recordDate), force);
    }

    @PostMapping("/{recordDate}/tags")
    public StyleAnalysis saveTags(@PathVariable String recordDate, @RequestBody Map<String, List<String>> body) {
        List<String> moodTags = body.getOrDefault("moodTags", List.of());
        List<String> reasonTags = body.getOrDefault("reasonTags", List.of());
        return analysisService.saveTags(LocalDate.parse(recordDate), moodTags, reasonTags);
    }

    @GetMapping("/{recordDate}/chat")
    public List<FactBombChatMessage> getChat(@PathVariable String recordDate) {
        return analysisService.getChat(LocalDate.parse(recordDate));
    }

    @PostMapping("/{recordDate}/chat")
    public List<FactBombChatMessage> sendChatMessage(@PathVariable String recordDate, @RequestBody Map<String, String> body) {
        return analysisService.sendChatMessage(LocalDate.parse(recordDate), body.get("message"));
    }
}
