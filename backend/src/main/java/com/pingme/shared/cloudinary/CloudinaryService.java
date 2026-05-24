package com.pingme.shared.cloudinary;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.cloudinary.Transformation;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryUploadResult uploadImage(MultipartFile file, String folder) throws IOException {

        if (file.isEmpty()) {
            throw new IllegalArgumentException("Folder is empty.");
        }

        Map<?, ?> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder",   folder,
                        "use_filename",     true,
                        "unique_filename",  true,
                        "overwrite",        false,
                        "resource_type",    "image"
                )
        );

        String publicId  = (String) result.get("public_id");
        String secureUrl = (String) result.get("secure_url");

        return new CloudinaryUploadResult(publicId, secureUrl);
    }

    public void deleteImage(String publicId) throws IOException {

        if (publicId == null || publicId.isBlank()) {
            throw new IllegalArgumentException("publicId can't be null.");
        }

        Map<?, ?> result = cloudinary.uploader().destroy(
                publicId,
                ObjectUtils.asMap("resource_type", "image")
        );

        String status = (String) result.get("result");
        if (!"ok".equals(status)) {
            throw new RuntimeException("Erro ao apagar imagem: " + status);
        }
    }

    public CloudinaryUploadResult uploadProfilePicture(
            MultipartFile file
    ) throws IOException {

        Map<?, ?> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder", "profile_pictures",
                        "unique_filename", true,

                        "transformation",
                        new Transformation<>()
                                .width(300)
                                .height(300)
                                .crop("fill")
                                .gravity("face")
                )
        );

        return new CloudinaryUploadResult(
                (String) result.get("public_id"),
                (String) result.get("secure_url")
        );
    }

    public CloudinaryUploadResult uploadFile(MultipartFile file, String folder) throws IOException {
        Map<?, ?> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder",           folder,
                        "unique_filename",  true,
                        "overwrite",        false,
                        "resource_type",    "raw"   // "raw" para PDFs, ZIPs, etc.
                )
        );

        return new CloudinaryUploadResult(
                (String) result.get("public_id"),
                (String) result.get("secure_url")
        );
    }
}