package com.mycloset.analysis;

import java.time.LocalDate;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface FactBombChatMapper {
    void insert(FactBombChatMessage message);

    List<FactBombChatMessage> findByDate(LocalDate recordDate);
}
