package com.mycloset.room;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomSummary {
    private String lookCategory;
    private int memberCount;
    private boolean joined;
}
