package com.pingme.utils;

import java.util.List;

public record PageResponseDTO<T>(
        List<T> content,
        int page,
        int limit
) {
    public static <T> PageResponseDTO<T> format(List<T> content, int page, int limit) {
        return new PageResponseDTO<>(
                content,
                page,
                limit
        );
    }
}