package com.mycloset.preview;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PreviewResult {
    /** Raw JSON string from the model: {"itemDescription","matchIndex","matchReason","stylingTips":[...]} */
    private String resultJson;
    /** Reference wardrobe photo paths, in the same order the model saw them (index-aligned with matchIndex). */
    private List<String> referencePhotoPaths;
}
