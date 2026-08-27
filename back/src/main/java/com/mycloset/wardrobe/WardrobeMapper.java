package com.mycloset.wardrobe;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface WardrobeMapper {
    void insert(WardrobeItem item);

    List<WardrobeItem> findByUserId(Long userId);
}
