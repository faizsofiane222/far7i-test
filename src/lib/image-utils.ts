import imageCompression from "browser-image-compression";
import { supabase } from "@/integrations/supabase/client";

interface UploadOptions {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    bucket?: string;
    folder?: string;
}

export async function compressAndUpload(
    file: File,
    userId: string,
    options: UploadOptions = {}
): Promise<{ publicUrl: string; error: any }> {
    try {
        const {
            maxSizeMB = 0.7, // Increased compression
            maxWidthOrHeight = 1024, // Optimized for web
            bucket = "service_images",
            folder = userId
        } = options;

        // 1. Compression
        const compressionOptions = {
            maxSizeMB,
            maxWidthOrHeight,
            useWebWorker: true,
            fileType: "image/webp" as any,
            initialQuality: 0.8
        };

        console.log(`📸 Compressing ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)...`);

        let fileToUpload: File | Blob = file;
        try {
            fileToUpload = await imageCompression(file, compressionOptions);
            console.log(`✅ Compressed to ${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB`);
        } catch (compressionError) {
            console.warn("Compression failed, uploading original:", compressionError);
            fileToUpload = file;
        }

        // 2. Upload
        const fileName = `${crypto.randomUUID()}.webp`;
        const filePath = `${folder}/${fileName}`;

        console.log(`🚀 Uploading to Supabase Storage: ${bucket}/${filePath}`);

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, fileToUpload, {
                cacheControl: "3600",
                upsert: false,
                contentType: 'image/webp'
            });

        if (uploadError) {
            // Enhanced error logging for debugging
            if (uploadError.message?.includes('name resolution failed')) {
                console.error("❌ DNS ERROR: Could not resolve Supabase Storage domain. Check your internet or VITE_SUPABASE_URL.");
            }
            throw uploadError;
        }

        // 3. Get URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return { publicUrl, error: null };
    } catch (error: any) {
        console.error("🚨 Upload utility error:", error);
        return { publicUrl: "", error };
    }
}
