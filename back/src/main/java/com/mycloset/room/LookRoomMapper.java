package com.mycloset.room;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface LookRoomMapper {
    void insertMemberIfAbsent(@Param("lookCategory") String lookCategory, @Param("userId") Long userId);

    void deleteMember(@Param("lookCategory") String lookCategory, @Param("userId") Long userId);

    boolean isMember(@Param("lookCategory") String lookCategory, @Param("userId") Long userId);

    int countMembers(@Param("lookCategory") String lookCategory);

    List<RoomCount> countAllMembers();

    void insertMessage(LookRoomMessage message);

    List<LookRoomMessage> findMessages(@Param("lookCategory") String lookCategory);
}
