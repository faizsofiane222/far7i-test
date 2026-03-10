import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Upload, X, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function MediaStep() {
    const { register, watch, setValue, formState: { errors } } = useFormContext();
    const photos = watch("galeriePhotos") || [];
    const utiliserFormulaireFar7i = watch("utiliserFormulaireFar7i") !== false; // Default to true

    const [isDragging, setIsDragging] = useState(false);

    // MOCK UPLOAD LOGIC
    const handleMockUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const filesArray = Array.from(e.target.files);
            const remainingSlots = 5 - photos.length;

            if (filesArray.length > remainingSlots) {
                toast.error(`Vous ne pouvez ajouter que ${remainingSlots} photo(s) supplémentaire(s).`);
            }

            const filesToAdd = filesArray.slice(0, remainingSlots);

            // Mock URLs
            const newPhotos = filesToAdd.map((file) => URL.createObjectURL(file));

            setValue("galeriePhotos", [...photos, ...newPhotos], { shouldValidate: true });

            // Reset input
            e.target.value = "";
        }
    };

    const removePhoto = (index: number) => {
        const newPhotos = [...photos];
        newPhotos.splice(index, 1);
        setValue("galeriePhotos", newPhotos, { shouldValidate: true });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-lato">
            <div className="mb-6">
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2">5. Médias & Contact</h2>
                <p className="text-sm text-[#1E1E1E]/80 mb-6 font-lato">Ajoutez vos plus belles créations et configurez vos moyens de contact.</p>
            </div>

            <div className="space-y-6 bg-[#EBE6DA] p-6 rounded-2xl border border-[#D4D2CF]/50">

                {/* Galerie Photos (MOCK) */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm font-bold text-[#1E1E1E]">Galerie Photos (Maximum 5) *</label>
                        <span className="text-[10px] bg-[#B79A63] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                            Far7i Basic
                        </span>
                    </div>
                    <p className="text-xs text-[#1E1E1E]/80 mb-4">La première image sera votre photo principale.</p>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        {/* Always show Main Photo Slot First */}
                        {photos.map((photo: string, index: number) => (
                            <div key={index} className="aspect-square rounded-xl border-2 border-[#D4D2CF] overflow-hidden relative group bg-white">
                                <img src={photo} alt={`Upload ${index}`} className="w-full h-full object-cover" />
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
                                    <div className="absolute top-2 left-2 bg-[#B79A63] text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md">
                                        Principale
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Upload Button visible if < 5 photos */}
                        {photos.length < 5 && (
                            <label
                                className={cn(
                                    "aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all text-[#1E1E1E]/40 hover:text-[#B79A63] hover:border-[#B79A63] bg-[#F8F5F0]",
                                    isDragging ? "border-[#B79A63] bg-[#B79A63]/5 text-[#B79A63]" : "border-[#D4D2CF]",
                                    photos.length === 0 ? "col-span-2 md:col-span-1" : ""
                                )}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDragging(false);
                                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                        const syntheticEvent = { target: { files: e.dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>;
                                        handleMockUpload(syntheticEvent);
                                    }
                                }}
                            >
                                <Upload className="w-6 h-6 mb-2" />
                                <span className="text-xs font-bold text-center px-2">Ajouter <br />(Mock)</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    multiple
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleMockUpload}
                                />
                            </label>
                        )}
                    </div>
                    {errors.galeriePhotos && <p className="text-red-500 text-xs mt-1">{errors.galeriePhotos.message as string}</p>}
                </div>

                <div className="pt-4 border-t border-[#D4D2CF]/50">
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Utiliser le formulaire Far7i ?</label>
                    <p className="text-xs text-[#1E1E1E]/80 mb-4">Activez cette option pour recevoir les demandes directement sur la plateforme.</p>
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                            <input
                                type="checkbox"
                                {...register("utiliserFormulaireFar7i")}
                                className="sr-only"
                            />
                            <div className={cn("block w-14 h-8 rounded-full transition-colors", utiliserFormulaireFar7i ? "bg-[#B79A63]" : "bg-[#D4D2CF]")}></div>
                            <div className={cn("absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform", utiliserFormulaireFar7i ? "translate-x-6" : "translate-x-0")}></div>
                        </div>
                        <span className="text-sm font-bold text-[#1E1E1E]">{utiliserFormulaireFar7i ? 'Oui, formulaire activé' : 'Non, appel direct uniquement'}</span>
                    </label>
                </div>

                <div className="pt-4 border-t border-[#D4D2CF]/50">
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Numéro de téléphone public (Optionnel)</label>
                    <input
                        type="tel"
                        {...register("telephone")}
                        placeholder="Ex: 0555 12 34 56"
                        className={cn("w-full h-12 px-4 rounded-xl border bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors", errors.telephone ? "border-red-500" : "border-[#D4D2CF]")}
                    />
                    <p className="text-xs text-[#1E1E1E]/80 mt-2">Sera affiché sur votre page pour les appels directs.</p>
                    {errors.telephone && <p className="text-red-500 text-xs mt-1">{errors.telephone.message as string}</p>}
                </div>
            </div>
        </div>
    );
}
