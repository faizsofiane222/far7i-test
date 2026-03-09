import React, { useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Image as ImageIcon, X, UploadCloud, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function MediaStep() {
    const { register, watch, setValue, formState: { errors } } = useFormContext();
    const mediaList = watch("media") || [];
    const formulaire_far7i = watch("formulaire_far7i");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    // Mock Upload Logic
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        if (mediaList.length + files.length > 5) {
            toast.error("Vous ne pouvez télécharger que 5 photos maximum (Freemium).");
            return;
        }

        setUploading(true);
        // Simulate upload delay and mock image generation
        setTimeout(() => {
            const newMedia = Array.from(files).map(file => URL.createObjectURL(file));
            setValue("media", [...mediaList, ...newMedia], { shouldValidate: true });
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }, 1000);
    };

    const removeMedia = (indexToRemove: number) => {
        const updated = mediaList.filter((_: any, idx: number) => idx !== indexToRemove);
        setValue("media", updated, { shouldValidate: true });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-lato">
            <div className="mb-6">
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-[#B79A63]" /> 5. Médias & Contact
                </h2>
                <p className="text-sm text-[#1E1E1E]/80 mb-6">Ajoutez des photos attrayantes de votre salle pour donner envie aux mariés.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#D4D2CF] shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-bold text-[#1E1E1E]">Galerie Photos (Minimum 1, Maximum 5)</label>
                    <span className="text-xs font-bold px-3 py-1 bg-[#1E1E1E]/5 text-[#1E1E1E] rounded-full">
                        {mediaList.length} / 5
                    </span>
                </div>

                {errors.media && <p className="text-red-500 text-xs mb-4 p-3 bg-red-50 rounded-lg border border-red-200">{errors.media.message as string}</p>}

                {/* Grid Gallery */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {mediaList.map((url: string, idx: number) => (
                        <div key={idx} className={cn("relative group rounded-xl overflow-hidden bg-[#F8F5F0] border border-[#D4D2CF] aspect-[4/3]", idx === 0 && "col-span-2 row-span-2 aspect-auto h-full")}>
                            <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            {idx === 0 && (
                                <div className="absolute top-2 left-2 bg-[#B79A63] text-white text-[10px] uppercase font-bold px-2 py-1 rounded shadow-sm">
                                    Photo Principale
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => removeMedia(idx)}
                                className="absolute top-2 right-2 w-8 h-8 bg-red-500/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-sm"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    {mediaList.length < 5 && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={cn("border-2 border-dashed border-[#D4D2CF] rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer hover:border-[#B79A63] hover:bg-[#B79A63]/5 transition-all text-[#1E1E1E]/40 hover:text-[#B79A63] aspect-[4/3]", uploading && "opacity-50 pointer-events-none")}
                        >
                            {uploading ? (
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current" />
                            ) : (
                                <>
                                    <UploadCloud className="w-8 h-8 mb-2" />
                                    <span className="text-xs font-bold text-center">Ajouter une photo</span>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                />

                <p className="text-xs text-[#1E1E1E]/60 text-center">La version Freemium vous permet de publier jusqu'à 5 photos de haute qualité.</p>
            </div>

            <div className="pt-8 border-t border-[#D4D2CF]">
                <h3 className="text-lg font-serif font-bold text-[#1E1E1E] mb-4 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-[#B79A63]" /> Contacts & Réservations
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-[#D4D2CF] p-6 rounded-2xl bg-white focus-within:border-[#B79A63] transition-all">
                        <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Numéro de téléphone public (Optionnel)</label>
                        <input
                            type="tel"
                            {...register("phone")}
                            placeholder="05 XX XX XX XX"
                            className="w-full h-12 px-4 rounded-xl border border-[#D4D2CF] bg-[#F8F5F0] text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] focus:bg-white transition-colors font-bold"
                        />
                        <p className="text-xs text-[#1E1E1E]/60 mt-2">S'il n'est pas rempli, les utilisateurs utiliseront uniquement la messagerie Far7i.</p>
                    </div>

                    <div className={cn("border p-6 rounded-2xl cursor-pointer transition-all flex flex-col justify-center", formulaire_far7i ? "border-[#B79A63] bg-[#B79A63]/5" : "border-[#D4D2CF] bg-white")} onClick={() => setValue("formulaire_far7i", !formulaire_far7i)}>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" checked={formulaire_far7i} readOnly className="w-5 h-5 accent-[#B79A63] pointer-events-none" />
                            <span className="text-sm font-bold text-[#1E1E1E]">Activer le formulaire de réservation intégré Far7i</span>
                        </div>
                        <p className="text-xs text-[#1E1E1E]/80 mt-2 ml-8">Hautement recommandé pour suivre vos demandes et votre trésorerie depuis l'application.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
