import React, { useRef } from "react";
import { useFormContext } from "react-hook-form";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

export default function MediaStep() {
    const { register, watch, setValue, formState: { errors } } = useFormContext();
    const photos = watch("media") || [];
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (photos.length + files.length > 5) {
            toast.error("Vous ne pouvez télécharger que 5 photos maximum.");
            return;
        }

        const newPhotos = files.map(file => URL.createObjectURL(file));
        setValue("media", [...photos, ...newPhotos], { shouldValidate: true });

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const removePhoto = (index: number) => {
        const newPhotos = [...photos];
        newPhotos.splice(index, 1);
        setValue("media", newPhotos, { shouldValidate: true });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-lato">
            <div className="mb-6">
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2">5. Médias & Contact</h2>
                <p className="text-sm text-[#1E1E1E]/80 mb-6 font-lato">Illustrez votre talent de maquilleuse ou coiffeuse et confirmez vos contacts.</p>
            </div>

            <div className="space-y-6 bg-[#EBE6DA] p-6 rounded-2xl border border-[#D4D2CF]/50">
                {/* Galerie Photos (Mock Upload) */}
                <div>
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Galerie Photos (Max 5) *</label>
                    <p className="text-xs text-[#1E1E1E]/80 mb-4">La première photo sera utilisée comme photo principale de votre profil.</p>

                    <div className="bg-white border-2 border-dashed border-[#D4D2CF] rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-colors hover:border-[#B79A63]">
                        <div className="w-16 h-16 bg-[#F8F5F0] rounded-full flex items-center justify-center mb-4 text-[#B79A63]">
                            <Upload className="w-8 h-8" />
                        </div>
                        <p className="font-bold text-[#1E1E1E] mb-2">Glissez-déposez vos photos ici</p>
                        <p className="text-sm text-[#1E1E1E]/60 mb-6">ou</p>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={photos.length >= 5}
                            className="px-6 py-3 bg-[#1E1E1E] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#B79A63] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Parcourir les fichiers
                        </button>
                    </div>

                    {errors.media && (
                        <p className="text-red-500 text-xs mt-2">{errors.media.message as string}</p>
                    )}

                    {photos.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                            {photos.map((url: string, index: number) => (
                                <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-[#D4D2CF]">
                                    <img src={url} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={() => removePhoto(index)}
                                            className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {index === 0 && (
                                        <div className="absolute top-2 left-2 bg-[#B79A63] text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded">
                                            Principale
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="pt-6 border-t border-[#D4D2CF]/50 space-y-6">
                    {/* Contact Far7i */}
                    <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-[#D4D2CF]">
                        <div className="mt-1">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    {...register("formulaire_far7i")}
                                />
                                <div className="w-11 h-6 bg-[#D4D2CF] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B79A63]"></div>
                            </label>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[#1E1E1E] mb-1 cursor-pointer" onClick={() => setValue("formulaire_far7i", !watch("formulaire_far7i"))}>
                                Utiliser le formulaire de contact Far7i (Recommandé)
                            </label>
                            <p className="text-xs text-[#1E1E1E]/80">Les clients pourront vous contacter directement via la plateforme pour réserver une mise en beauté.</p>
                        </div>
                    </div>

                    {/* Telephone */}
                    <div>
                        <label className="block text-sm font-bold text-[#1E1E1E] mb-2 flex items-center gap-2">
                            Numéro de téléphone
                            <span className="text-[10px] bg-[#EBE6DA] text-[#1E1E1E]/60 px-2 py-0.5 rounded uppercase tracking-widest">Optionnel</span>
                        </label>
                        <input
                            type="tel"
                            {...register("phone")}
                            placeholder="05 XX XX XX XX"
                            className="w-full h-12 px-4 rounded-xl border border-[#D4D2CF] bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors"
                        />
                        <p className="text-xs text-[#1E1E1E]/80 mt-2">Pour que les clients puissent vous appeler directement.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
