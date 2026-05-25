package com.pingme.shared.cloudinary;

public record CloudinaryUploadResult(
        String publicId,
        String secureUrl
) {}