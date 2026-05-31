package com.pingme.messages.system;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record SystemMessageContent(
        String event,
        List<String> targetNames,
        String actorName,
        String oldName,
        String newName
) {
    public static SystemMessageContent of(SystemEventType event, List<String> targetNames) {
        return new SystemMessageContent(event.name(), targetNames, null, null, null);
    }

    public static SystemMessageContent of(SystemEventType event, List<String> targetNames, String actorName) {
        return new SystemMessageContent(event.name(), targetNames, actorName, null, null);
    }

    public static SystemMessageContent of(SystemEventType event, String targetName) {
        return new SystemMessageContent(event.name(), List.of(targetName), null, null, null);
    }

    public static SystemMessageContent of(SystemEventType event, String targetName, String actorName) {
        return new SystemMessageContent(event.name(), List.of(targetName), actorName, null, null);
    }
}