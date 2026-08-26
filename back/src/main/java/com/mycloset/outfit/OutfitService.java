package com.mycloset.outfit;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.mycloset.auth.AuthService;

@Service
public class OutfitService {

    private final OutfitMapper outfitMapper;
    private final AuthService authService;
    private final Path uploadDir;

    public OutfitService(OutfitMapper outfitMapper, AuthService authService, @Value("${app.upload-dir}") String uploadDir) {
        this.outfitMapper = outfitMapper;
        this.authService = authService;
        this.uploadDir = Path.of(uploadDir);
    }

    public Outfit register(
            String authorization,
            LocalDate recordDate,
            String filterType,
            String memo,
            String itemTags,
            String lookCategory,
            String location,
            MultipartFile photo) {
        Long userId = authService.resolveUserId(authorization);
        String savedFileName = savePhoto(photo);
        boolean hasExisting = !outfitMapper.findAllByUserAndDate(userId, recordDate).isEmpty();

        Outfit outfit = new Outfit();
        outfit.setUserId(userId);
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

    public List<Outfit> findMine(String authorization) {
        Long userId = authService.resolveUserId(authorization);
        return outfitMapper.findAllByUserId(userId);
    }

    public List<Outfit> findByUser(Long userId) {
        return outfitMapper.findAllByUserId(userId);
    }

    public Optional<Outfit> findMyOutfitByDate(String authorization, LocalDate recordDate) {
        Long userId = authService.resolveUserId(authorization);
        return outfitMapper.findByUserAndDate(userId, recordDate);
    }

    public List<Outfit> findMyOutfitsByDate(String authorization, LocalDate recordDate) {
        Long userId = authService.resolveUserId(authorization);
        return outfitMapper.findAllByUserAndDate(userId, recordDate);
    }

    @Transactional
    public List<Outfit> setMain(String authorization, Long id, LocalDate recordDate) {
        Long userId = authService.resolveUserId(authorization);
        requireOwner(id, userId);
        outfitMapper.clearMainForUserAndDate(userId, recordDate);
        outfitMapper.setMainById(id);
        return outfitMapper.findAllByUserAndDate(userId, recordDate);
    }

    public Outfit updateDetails(
            String authorization, Long id, String memo, String itemTags, String lookCategory, String location) {
        Long userId = authService.resolveUserId(authorization);
        requireOwner(id, userId);

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

    @Transactional
    public List<Outfit> delete(String authorization, Long id) {
        Long userId = authService.resolveUserId(authorization);
        Outfit outfit = requireOwner(id, userId);

        outfitMapper.deleteCommentsByOutfitId(id);
        outfitMapper.delete(id);
        deletePhoto(outfit.getPhotoPath());

        List<Outfit> remaining = outfitMapper.findAllByUserAndDate(userId, outfit.getRecordDate());
        if (outfit.getIsMain() == 1 && !remaining.isEmpty()) {
            outfitMapper.setMainById(remaining.get(0).getId());
            remaining = outfitMapper.findAllByUserAndDate(userId, outfit.getRecordDate());
        }
        return remaining;
    }

    private Outfit requireOwner(Long id, Long userId) {
        Outfit outfit = outfitMapper.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("기록을 찾을 수 없습니다: " + id));
        if (!Objects.equals(outfit.getUserId(), userId)) {
            throw new IllegalArgumentException("본인 게시물만 수정하거나 삭제할 수 있어요");
        }
        return outfit;
    }

    private void deletePhoto(String photoPath) {
        try {
            Files.deleteIfExists(uploadDir.resolve(photoPath));
        } catch (IOException e) {
            // 파일 삭제 실패는 무시한다 - 레코드 삭제는 이미 완료된 상태
        }
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
