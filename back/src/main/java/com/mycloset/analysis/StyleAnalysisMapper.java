package com.mycloset.analysis;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface StyleAnalysisMapper {
    void insert(StyleAnalysis analysis);

    List<StyleAnalysis> findAll();

    Optional<StyleAnalysis> findByDate(LocalDate recordDate);

    void updateTags(StyleAnalysis analysis);

    void updateBreakdown(StyleAnalysis analysis);

    void updateFactBomb(StyleAnalysis analysis);

    void insertFactBomb(StyleAnalysis analysis);
}
