package com.mycloset.stylist;

import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface StyleProfileMapper {
    Optional<StyleProfile> findByUserId(Long userId);

    void insert(StyleProfile profile);

    void update(StyleProfile profile);
}
