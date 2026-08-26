package com.mycloset.outfit;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class OutfitService {

    private final OutfitMapper outfitMapper;
    private final Path uploadDir;

    public OutfitService(OutfitMapper outfitMapper, @Value("${app.upload-dir}") String uploadDir) {
        this.outfitMapper = outfitMapper;
        this.uploadDir = Path.of(uploadDir);
    }

    public Outfit register(
            LocalDate recordDate,
            String filterType,
            String memo,
            String itemTags,
            String lookCategory,
            String location,
            MultipartFile photo) {
        String savedFileName = savePhoto(photo);
        boolean hasExisting = !outfitMapper.findAllByDate(recordDate).isEmpty();

        Outfit outfit = new Outfit();
        outfit.setRecordDate(recordDate);
        outfit.setPhotoPath(savedFileName);
        outfit.setFilterType(filterType);
        outfit.setMemo(memo);
        outfit.setItemTags(itemTags);
        outfit.setLookCategory(lookCategory);
        outfit.setLocation(location);
        outfit.setIsMain(hasExisting ? 0 : 1);

        outfitMapper.insert(outfit);
        return outfit;
    }

    public List<Outfit> findAll() {
        return outfitMapper.findAll();
    }

    public Optional<Outfit> findByDate(LocalDate recordDate) {
        return outfitMapper.findByDate(recordDate);
    }

    public List<Outfit> findAllByDate(LocalDate recordDate) {
        return outfitMapper.findAllByDate(recordDate);
    }

    @Transactional
    public List<Outfit> setMain(Long id, LocalDate recordDate) {
        outfitMapper.clearMainForDate(recordDate);
        outfitMapper.setMainById(id);
        return outfitMapper.findAllByDate(recordDate);
    }

    public Outfit updateDetails(Long id, String memo, String itemTags, String lookCategory, String location) {
        Outfit outfit = new Outfit();
        outfit.setId(id);
        outfit.setMemo(memo);
        outfit.setItemTags(itemTags);
        outfit.setLookCategory(lookCategory);
        outfit.setLocation(location);
        outfitMapper.updateDetails(outfit);
        return outfitMapper.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("기록을 찾을 수 없습니다: " + id));
    }

    public Outfit setLiked(Long id, boolean liked) {
        outfitMapper.setLiked(id, liked ? 1 : 0);
        return outfitMapper.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("기록을 찾을 수 없습니다: " + id));
    }

    public Outfit setSaved(Long id, boolean saved) {
        outfitMapper.setSaved(id, saved ? 1 : 0);
        return outfitMapper.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("기록을 찾을 수 없습니다: " + id));
    }

    public List<Outfit> findSaved() {
        return outfitMapper.findSaved();
    }

    public List<OutfitComment> addComment(Long outfitId, String content) {
        OutfitComment comment = new OutfitComment();
        comment.setOutfitId(outfitId);
        comment.setContent(content);
        outfitMapper.insertComment(comment);
        return outfitMapper.findCommentsByOutfitId(outfitId);
    }

    public List<OutfitComment> getComments(Long outfitId) {
        return outfitMapper.findCommentsByOutfitId(outfitId);
    }

    private String savePhoto(MultipartFile photo) {
        try {
            Files.createDirectories(uploadDir);
            String extension = extractExtension(photo.getOriginalFilename());
            String fileName = UUID.randomUUID() + extension;
            Files.copy(photo.getInputStream(), uploadDir.resolve(fileName));
            return fileName;
        } catch (IOException e) {
            throw new IllegalStateException("사진 저장에 실패했습니다", e);
        }
    }

    private String extractExtension(String originalFilename) {
        if (originalFilename == null || !originalFilename.contains(".")) {
            return ".jpg";
        }
        return originalFilename.substring(originalFilename.lastIndexOf('.'));
    }
}
