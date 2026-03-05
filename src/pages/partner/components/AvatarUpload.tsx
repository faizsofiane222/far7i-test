import React, { useState } from "react";
import {
    Camera,
    Loader2,
    User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { compressAndUpload } from "@/lib/image-utils";

interface AvatarUploadProps {
    userId: string;
    currentUrl?: string;
    onUploadSuccess: (url: string) => void;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({ userId, currentUrl, onUploadSuccess }) => {
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = event.target.files?.[0];
            if (!file) return;

            if (!file.type.startsWith("image/")) {
                toast.error("Format de fichier non supporté. Veuillez choisir une image.");
                return;
            }

            setUploading(true);

            // Using centralized helper
            const { publicUrl, error: uploadError } = await compressAndUpload(
                file,
                userId,
                {
                    bucket: "provider-profiles",
                    folder: userId,
                    maxWidthOrHeight: 500
                }
            );

            if (uploadError) {
                // Potential fallback if bucket doesn't exist (legacy logic)
                if (uploadError.message?.includes("not found")) {
                    const backup = await compressAndUpload(file, userId, { bucket: "avatars", folder: userId, maxWidthOrHeight: 500 });
                    if (backup.error) throw backup.error;
                    onUploadSuccess(backup.publicUrl);
                } else {
                    throw uploadError;
                }
            } else {
                onUploadSuccess(publicUrl);
            }

            // 4. Cleanup old image (optional)
            if (currentUrl) {
                try {
                    const isProviderProfiles = currentUrl.includes("provider-profiles");
                    const isAvatars = currentUrl.includes("avatars");

                    if (isProviderProfiles || isAvatars) {
                        const bucketUsed = isProviderProfiles ? "provider-profiles" : "avatars";
                        const urlParts = currentUrl.split(`${bucketUsed}/`);
                        if (urlParts.length > 1) {
                            const oldPath = urlParts[1].split("?")[0];
                            await supabase.storage.from(bucketUsed).remove([oldPath]);
                        }
                    }
                } catch (cleanupError) {
                    console.warn("Cleanup failed, proceeding anyway:", cleanupError);
                }
            }

            onUploadSuccess(publicUrl);
            toast.success("Photo de profil mise à jour");

        } catch (error: any) {
            console.error("Critical upload process error:", error);

            let userMessage = error.message || "Cause inconnue";
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

            if (userMessage.toLowerCase().includes("name resolution failed") ||
                userMessage.toLowerCase().includes("failed to fetch") ||
                userMessage.toLowerCase().includes("network error")) {
                userMessage = `Erreur de connexion au serveur Supabase (${supabaseUrl}). Vérifiez votre connexion internet, votre VPN ou si le serveur local Supabase est lancé.`;
                console.error("Supabase Connection Failed:", {
                    url: supabaseUrl,
                    error: error,
                    timestamp: new Date().toISOString()
                });
            }

            toast.error(`Erreur d'upload: ${userMessage}`);
        } finally {
            setUploading(false);
            if (event.target) event.target.value = "";
        }
    };

    return (
        <div className="relative group shrink-0">
            <div className="w-36 h-36 md:w-40 md:h-40 rounded-full bg-[#F8F5F0] border-2 border-[#D4D2CF] flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-[1.02] group-hover:border-[#B79A63]/50 shadow-sm">
                {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-10 h-10 animate-spin text-[#B79A63]" />
                        <span className="text-[10px] font-bold text-[#B79A63] uppercase tracking-wider">Traitement...</span>
                    </div>
                ) : currentUrl ? (
                    <img src={currentUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <User className="w-16 h-16 text-[#B79A63]" />
                )}
            </div>

            <label
                className={cn(
                    "absolute inset-0 flex flex-col items-center justify-center bg-black/0 hover:bg-black/40 rounded-full cursor-pointer transition-all duration-300",
                    uploading && "pointer-events-none bg-transparent"
                )}
            >
                {!uploading && (
                    <div className="flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-10 h-10 text-white mb-1" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Changer</span>
                    </div>
                )}

                {!uploading && (
                    <div className="absolute bottom-2 right-2 p-2.5 bg-[#B79A63] text-white rounded-full shadow-lg border-2 border-white group-hover:opacity-0 transition-opacity">
                        <Camera className="w-5 h-5" />
                    </div>
                )}

                <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                />
            </label>
        </div>
    );
};
