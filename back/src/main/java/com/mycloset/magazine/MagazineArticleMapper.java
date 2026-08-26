package com.mycloset.magazine;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MagazineArticleMapper {
    List<MagazineArticle> findAll();

    List<MagazineArticle> findByCategories(List<String> categories);

    void updateSummary(MagazineArticle article);
}
