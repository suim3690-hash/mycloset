package com.mycloset.timecapsule;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface TimeCapsuleMapper {
    void insert(TimeCapsule capsule);

    List<TimeCapsule> findDue();

    void markOpened(Long id);
}
