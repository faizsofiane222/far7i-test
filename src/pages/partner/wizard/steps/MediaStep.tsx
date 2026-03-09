import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { GildedInput } from "@/components/ui/gilded-input";
import { GildedButton } from "@/components/ui/gilded-button";
import { Image as ImageIcon, X, Box, Phone, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { compressAndUpload } from "@/lib/image-utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function MediaStep() {
    const { register, watch, setValue, formState: { errors } } = useFormContext();
    const media: string[] = watch("media", []);
    const formulaireFar7i = watch("formulaire_far7i", true);

    const { user } = useAuth();
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (media.length >= 5) {
            toast.error("Vous avez atteint la limite de 5 photos pour un compte gratuit.");
            return;
        }

        const toastId = toast.loading("Upload de la photo en cours...");
        try {
            setUploading(true);
            const { publicUrl, error: uploadError } = await compressAndUpload(
                file,
                user.id,
                { folder: `${user.id}/venues`, maxWidthOrHeight: 1600 }
            );

            if (uploadError) throw uploadError;

            setValue("media", [...media, publicUrl], { shouldValidate: true, shouldDirty: true });
            toast.success("Photo ajoutée", { id: toastId });
        } catch (error: any) {
            console.error(error);
            toast.error("Erreur d'upload: " + (error.message || "Erreur inconnue"), { id: toastId });
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const removeMedia = (index: number) => {
        setValue("media", media.filter((_, i) => i !== index), { shouldValidate: true, shouldDirty: true });
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-serif font-bold text-[#1E1E1E] flex items-center gap-2">
                        5. Médias & Contact
                    </h2>
                    <GildedButton
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('media-upload-wizard')?.click()}
                        disabled={media.length >= 5 || uploading}
                        className="h-9 text-xs px-3 bg-white"
                    >
                        {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                        Ajouter une photo
                    </GildedButton>
                </div>
                <p className="text-sm text-[#1E1E1E]/60 mb-6">
                    Les futurs mariés choisissent d'abord avec les yeux. Ajoutez <span className="font-bold">entre 1 et 5 photos</span> (couverture, salle, extérieur...).
                </p>

                {errors.media && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-200">{errors.media.message as string}</p>}

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {media.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-2xl border border-[#D4D2CF] overflow-hidden group bg-white">
                            <img src={url} alt={`Media ${idx}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button type="button" onClick={() => removeMedia(idx)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            {idx === 0 && <div className="absolute top-2 left-2 bg-[#B79A63] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">Couverture</div>}
                        </div>
                    ))}
                    {media.length < 5 && (
                        <button
                            type="button"
                            disabled={uploading}
                            onClick={() => document.getElementById('media-upload-wizard')?.click()}
                            className={cn(
                                "aspect-square rounded-2xl border-2 border-dashed border-[#D4D2CF] flex flex-col items-center justify-center gap-2 text-[#1E1E1E]/40 transition-all",
                                uploading ? "opacity-50 cursor-not-allowed" : "hover:text-[#B79A63] hover:border-[#B79A63]/50 hover:bg-[#F8F5F0]"
                            )}
                        >
                            {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Box className="w-6 h-6" />}
                            <span className="text-[10px] uppercase font-bold tracking-widest">{media.length === 0 ? "Couverture" : "Ajouter"}</span>
                        </button>
                    )}
                </div>
                <input type="file" id="media-upload-wizard" className="hidden" accept="image/*" onChange={handleUpload} />

                <div className="mt-4 flex items-center gap-2 text-xs text-[#1E1E1E]/60 bg-[#EBE6DA] p-3 rounded-lg border border-[#B79A63]/20">
                    <AlertCircle className="w-4 h-4 text-[#B79A63]" />
                    <p>La limite est fixée à 5 photos pour la version standard. Une offre Premium sera bientôt disponible pour des galeries illimitées.</p>
                </div>
            </div>

            <div className="pt-8 border-t border-[#D4D2CF] space-y-6">
                <h2 className="text-lg font-serif font-bold text-[#1E1E1E] mb-4">Moyens de Contact</h2>

                <label className={cn(
                    "flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 rounded-2xl border cursor-pointer transition-colors",
                    formulaireFar7i ? "bg-[#1E1E1E] border-[#1E1E1E] text-white" : "bg-white border-[#D4D2CF] text-[#1E1E1E]"
                )}>
                    <div className="flex items-center gap-4 mb-4 sm:mb-0">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", formulaireFar7i ? "bg-[#B79A63]" : "bg-[#F8F5F0]")}>
                            <CheckCircle2 className={cn("w-5 h-5", formulaireFar7i ? "text-white" : "text-[#B79A63]")} />
                        </div>
                        <div>
                            <span className="text-sm font-bold block">Messages Far7i (Recommandé)</span>
                            <span className={cn("text-xs", formulaireFar7i ? "text-white/60" : "text-[#1E1E1E]/60")}>Recevez vos demandes directement via notre messagerie intégrée.</span>
                        </div>
                    </div>
                    {/* Toggle Button Wrapper */}
                    <div className={cn(
                        "w-12 h-6 rounded-full p-1 transition-colors relative",
                        formulaireFar7i ? "bg-[#B79A63]" : "bg-[#D4D2CF]"
                    )}>
                        <input type="checkbox" {...register("formulaire_far7i")} className="hidden" />
                        <div className={cn("bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200", formulaireFar7i ? "translate-x-6" : "")} />
                    </div>
                </label>

                <div className="bg-[#F8F5F0] p-6 rounded-2xl border border-[#D4D2CF]">
                    <Label className="text-sm font-bold text-[#1E1E1E] flex items-center gap-2 mb-2">
                        <Phone className="w-4 h-4 text-[#B79A63]" /> Téléphone direct de réservation
                    </Label>
                    <GildedInput
                        {...register("phone")}
                        placeholder="Ex: 0555 12 34 56"
                        className="max-w-xs bg-white"
                        maxLength={20}
                    />
                    <p className="text-xs text-[#1E1E1E]/50 mt-2">Ce numéro s'affichera publiquement sur votre profil. Laissez vide si vous préférez être contacté uniquement via Far7i.</p>
                </div>
            </div>
        </div>
    );
}
