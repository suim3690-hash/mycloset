package com.mycloset.outfit;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
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
@RequestMapping("/api/outfits")
public class OutfitController {

    private final OutfitService outfitService;

    public OutfitController(OutfitService outfitService) {
        this.outfitService = outfitService;
    }

    @PostMapping
    public Outfit register(
            @RequestHeader("Authorization") String authorization,
            @RequestParam("recordDate") String recordDate,
            @RequestParam("filterType") String filterType,
            @RequestParam(value = "memo", required = false) String memo,
            @RequestParam(value = "itemTags", required = false) String itemTags,
            @RequestParam(value = "lookCategory", required = false) String lookCategory,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam("photo") MultipartFile photo) {
        return outfitService.register(
                authorization, LocalDate.parse(recordDate), filterType, memo, itemTags, lookCategory, location, photo);
    }

    @GetMapping
    public List<Outfit> findAll() {
        return outfitService.findAll();
    }

    @GetMapping("/mine")
    public List<Outfit> findMine(@RequestHeader("Authorization") String authorization) {
        return outfitService.findMine(authorization);
    }

    @GetMapping("/by-user/{userId}")
    public List<Outfit> findByUser(@PathVariable Long userId) {
        return outfitService.findByUser(userId);
    }

    @GetMapping("/saved")
    public List<Outfit> findSaved() {
        return outfitService.findSaved();
    }

    @GetMapping("/{recordDate}")
    public ResponseEntity<Outfit> findByDate(
            @RequestHeader("Authorization") String authorization, @PathVariable String recordDate) {
        return outfitService.findMyOutfitByDate(authorization, LocalDate.parse(recordDate))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{recordDate}/all")
    public List<Outfit> findAllByDate(
            @RequestHeader("Authorization") String authorization, @PathVariable String recordDate) {
        return outfitService.findMyOutfitsByDate(authorization, LocalDate.parse(recordDate));
    }

    @PostMapping("/{id}/main")
    public List<Outfit> setMain(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long id,
            @RequestParam("recordDate") String recordDate) {
        return outfitService.setMain(authorization, id, LocalDate.parse(recordDate));
    }

    @PostMapping("/{id}")
    public Outfit updateDetails(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long id,
            @RequestParam(value = "memo", required = false) String memo,
            @RequestParam(value = "itemTags", required = false) String itemTags,
            @RequestParam(value = "lookCategory", required = false) String lookCategory,
            @RequestParam(value = "location", required = false) String location) {
        return outfitService.updateDetails(authorization, id, memo, itemTags, lookCategory, location);
    }

    @PostMapping("/{id}/like")
    public Outfit setLiked(@PathVariable Long id, @RequestParam("liked") boolean liked) {
        return outfitService.setLiked(id, liked);
    }

    @PostMapping("/{id}/save")
    public Outfit setSaved(@PathVariable Long id, @RequestParam("saved") boolean saved) {
        return outfitService.setSaved(id, saved);
    }

    @PostMapping("/{id}/share")
    public Outfit setShared(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long id,
            @RequestParam("shared") boolean shared) {
        return outfitService.setShared(authorization, id, shared);
    }

    @GetMapping("/{id}/comments")
    public List<OutfitComment> getComments(@PathVariable Long id) {
        return outfitService.getComments(id);
    }

    @PostMapping("/{id}/comments")
    public List<OutfitComment> addComment(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return outfitService.addComment(id, body.get("content"));
    }

    @DeleteMapping("/{id}")
    public List<Outfit> delete(@RequestHeader("Authorization") String authorization, @PathVariable Long id) {
        return outfitService.delete(authorization, id);
    }
}
