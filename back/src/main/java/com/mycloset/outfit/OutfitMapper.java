package com.mycloset.outfit;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface OutfitMapper {
    void insert(Outfit outfit);

    List<Outfit> findAll();

    List<Outfit> findAllByUserId(Long userId);

    Optional<Outfit> findByDate(LocalDate recordDate);

    List<Outfit> findAllByDate(LocalDate recordDate);

    Optional<Outfit> findByUserAndDate(@Param("userId") Long userId, @Param("recordDate") LocalDate recordDate);

    List<Outfit> findAllByUserAndDate(@Param("userId") Long userId, @Param("recordDate") LocalDate recordDate);

    void clearMainForDate(LocalDate recordDate);

    void clearMainForUserAndDate(@Param("userId") Long userId, @Param("recordDate") LocalDate recordDate);

    void setMainById(Long id);

    Optional<Outfit> findById(Long id);

    void updateDetails(Outfit outfit);

    void setLiked(@Param("id") Long id, @Param("liked") int liked);

    void setShared(@Param("id") Long id, @Param("shared") int shared);

    void setSaved(@Param("id") Long id, @Param("saved") int saved);

    List<Outfit> findSaved();

    void insertComment(OutfitComment comment);

    List<OutfitComment> findCommentsByOutfitId(Long outfitId);

    void delete(Long id);

    void deleteCommentsByOutfitId(Long outfitId);
}
