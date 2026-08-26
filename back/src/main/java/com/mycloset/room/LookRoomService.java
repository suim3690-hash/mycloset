package com.mycloset.room;

import java.util.List;

import org.springframework.stereotype.Service;

import com.mycloset.auth.AuthMapper;

@Service
public class LookRoomService {

    private final LookRoomMapper roomMapper;
    private final AuthMapper authMapper;

    public LookRoomService(LookRoomMapper roomMapper, AuthMapper authMapper) {
        this.roomMapper = roomMapper;
        this.authMapper = authMapper;
    }

    public List<RoomCount> listRooms() {
        return roomMapper.countAllMembers();
    }

    public RoomSummary getRoom(String lookCategory, String token) {
        Long userId = resolveUserId(token);
        return new RoomSummary(lookCategory, roomMapper.countMembers(lookCategory), roomMapper.isMember(lookCategory, userId));
    }

    public RoomSummary join(String lookCategory, String token) {
        Long userId = resolveUserId(token);
        roomMapper.insertMemberIfAbsent(lookCategory, userId);
        return new RoomSummary(lookCategory, roomMapper.countMembers(lookCategory), true);
    }

    public RoomSummary leave(String lookCategory, String token) {
        Long userId = resolveUserId(token);
        roomMapper.deleteMember(lookCategory, userId);
        return new RoomSummary(lookCategory, roomMapper.countMembers(lookCategory), false);
    }

    public List<LookRoomMessage> getMessages(String lookCategory) {
        return roomMapper.findMessages(lookCategory);
    }

    public List<LookRoomMessage> sendMessage(String lookCategory, String token, String content) {
        Long userId = resolveUserId(token);
        if (!roomMapper.isMember(lookCategory, userId)) {
            throw new IllegalStateException("방에 먼저 참가해주세요");
        }
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("메시지를 입력해주세요");
        }

        LookRoomMessage message = new LookRoomMessage();
        message.setLookCategory(lookCategory);
        message.setUserId(userId);
        message.setContent(content.trim());
        roomMapper.insertMessage(message);

        return roomMapper.findMessages(lookCategory);
    }

    private Long resolveUserId(String token) {
        return authMapper.findUserIdByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요해요"));
    }
}
