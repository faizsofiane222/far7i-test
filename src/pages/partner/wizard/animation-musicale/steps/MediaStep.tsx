import React from "react";
import { UseFormReturn } from "react-hook-form";
import { AnimationMusicaleFormValues } from "../schema";
import { Label } from "@/components/ui/label";
import { GildedInput } from "@/components/ui/gilded-input";
import { cn } from "@/lib/utils";
import { Image as ImageIcon, X, Plus, Info, Phone, Shield } from "lucide-react";
import { compressAndUpload } from "@/lib/image-utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface StepProps {
    methods: UseFormReturn<AnimationMusicaleFormValues>;
}

export default function MediaStep({ methods }: StepProps) {
    const { register, watch, setValue, formState: { errors } } = methods;
    const { user } = useAuth();
    const photos = watch("galeriePhotos") || [];
    const useFar7iForm = watch("utiliserFormulaireFar7i");

    const handleAddMedia = async (file: File) => {
        if (!user) return;
        if (photos.length >= 5) {
            toast.error("Maximum 5 photos autorisées");
            return;
        }

        const toastId = toast.loading("Upload de la photo...");
        try {
            const { publicUrl, error } = await compressAndUpload(file, user.id, {
                folder: `provider_music/${user.id}`
            });

            if (error) throw error;

            setValue("galeriePhotos", [...photos, publicUrl], { shouldValidate: true });
            toast.success("Photo ajoutée avec succès", { id: toastId });
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error("Erreur lors de l'upload : " + error.message, { id: toastId });
        }
    };

    const removePhoto = (index: number) => {
        const newPhotos = [...photos];
        newPhotos.splice(index, 1);
        setValue("galeriePhotos", newPhotos, { shouldValidate: true });
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-2">
                <h2 className="text-3xl font-serif text-[#1E1E1E]">Médias & Contact</h2>
                <p className="text-sm font-sans text-[#1E1E1E]/60">Finalisez votre profil avec vos meilleures photos de scène.</p>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-widest text-[#1E1E1E]">Galerie Photos (Max 5) *</Label>
                    <span className="text-[10px] font-bold text-[#B79A63] uppercase bg-[#B79A63]/10 px-2 py-1 rounded-md">
                        {photos.length} / 5
                    </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {photos.map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-2xl border border-[#D4D2CF] overflow-hidden group shadow-sm bg-white">
                            <img src={url} alt={`Gallery ${index}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <button
                                type="button"
                                onClick={() => removePhoto(index)}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                                <X className="w-3 h-3" />
                            </button>
                            {index === 0 && (
                                <div className="absolute bottom-0 left-0 right-0 bg-[#B79A63] text-white text-[8px] font-bold py-1 text-center uppercase tracking-widest">
                                    Principal
                                </div>
                            )}
                        </div>
                    ))}

                    {photos.length < 5 && (
                        <label className="aspect-square rounded-2xl border-2 border-dashed border-[#D4D2CF] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#B79A63] hover:bg-[#FDFCFB] transition-all text-[#1E1E1E]/20 hover:text-[#B79A63] group">
                            <Plus className="w-8 h-8 transition-transform group-hover:scale-110" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Ajouter</span>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleAddMedia(file);
                                    e.target.value = "";
                                }}
                            />
                        </label>
                    )}
                </div>
                {errors.galeriePhotos && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.galeriePhotos.message}</p>}

                <div className="flex gap-3 p-4 bg-white/50 rounded-xl border border-[#D4D2CF]/30">
                    <Info className="w-4 h-4 text-[#B79A63] shrink-0" />
                    <p className="text-[11px] text-[#1E1E1E]/60 italic font-sans leading-relaxed">
                        L'Aide UX : Utilisez des photos de haute qualité de vos platines, de votre orchestre en action ou de l'ambiance lumineuse que vous créez. La première photo sera votre couverture.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6">
                <div className="space-y-6">
                    <Label className="text-xs font-bold uppercase tracking-widest text-[#1E1E1E]">Contact Direct</Label>
                    <div className="space-y-4">
                        <div className="relative group">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B79A63]" />
                            <GildedInput
                                {...register("telephone")}
                                placeholder="Numéro de téléphone (Optionnel)"
                                className="pl-12"
                            />
                        </div>
                        <p className="text-[10px] text-[#1E1E1E]/40 font-sans italic">
                            Aide UX : Ce numéro permettra à l'équipe Far7i de vous contacter plus facilement durant le processus de validation.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <Label className="text-xs font-bold uppercase tracking-widest text-[#1E1E1E]">Réservation Far7i</Label>
                    <div
                        onClick={() => setValue("utiliserFormulaireFar7i", !useFar7iForm)}
                        className={cn(
                            "p-6 rounded-2xl border-2 flex items-center gap-5 transition-all cursor-pointer group",
                            useFar7iForm ? "bg-[#1E1E1E] border-[#1E1E1E] text-white shadow-lg" : "bg-white border-[#D4D2CF] text-[#1E1E1E]/60 hover:border-[#B79A63]"
                        )}
                    >
                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-sm",
                            useFar7iForm ? "bg-[#B79A63]" : "bg-[#F8F5F0] group-hover:bg-white"
                        )}>
                            <Shield className={cn("w-6 h-6", useFar7iForm && "text-white")} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold uppercase text-xs tracking-widest">Activer le formulaire Far7i</span>
                            <span className={cn("text-[10px] font-sans", useFar7iForm ? "text-white/60" : "text-[#1E1E1E]/40")}>Recommandé pour une gestion simplifiée</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
