package com.mycloset.room;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rooms")
public class LookRoomController {

    private final LookRoomService roomService;

    public LookRoomController(LookRoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping
    public List<RoomCount> listRooms() {
        return roomService.listRooms();
    }

    @GetMapping("/{lookCategory}")
    public RoomSummary getRoom(@PathVariable String lookCategory, @RequestHeader("Authorization") String authorization) {
        return roomService.getRoom(lookCategory, extractToken(authorization));
    }

    @PostMapping("/{lookCategory}/join")
    public RoomSummary join(@PathVariable String lookCategory, @RequestHeader("Authorization") String authorization) {
        return roomService.join(lookCategory, extractToken(authorization));
    }

    @PostMapping("/{lookCategory}/leave")
    public RoomSummary leave(@PathVariable String lookCategory, @RequestHeader("Authorization") String authorization) {
        return roomService.leave(lookCategory, extractToken(authorization));
    }

    @GetMapping("/{lookCategory}/messages")
    public List<LookRoomMessage> getMessages(@PathVariable String lookCategory) {
        return roomService.getMessages(lookCategory);
    }

    @PostMapping("/{lookCategory}/messages")
    public List<LookRoomMessage> sendMessage(
            @PathVariable String lookCategory,
            @RequestHeader("Authorization") String authorization,
            @RequestBody Map<String, String> body) {
        return roomService.sendMessage(lookCategory, extractToken(authorization), body.get("content"));
    }

    private String extractToken(String authorizationHeader) {
        return authorizationHeader.replaceFirst("(?i)^Bearer\\s+", "");
    }
}
