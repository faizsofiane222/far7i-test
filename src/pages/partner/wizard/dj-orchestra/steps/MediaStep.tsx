import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Copy, Phone, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MediaStep() {
    const { register, setValue, formState: { errors } } = useFormContext();

    const formulaire_far7i = useWatch({ name: "formulaire_far7i" });
    const photos = useWatch({ name: "media" }) || [];

    const handleMockUpload = () => {
        if (photos.length >= 5) return;
        const mockUrl = `https://picsum.photos/800/600?random=${Math.random()}`;
        setValue("media", [...photos, mockUrl], { shouldValidate: true });
    };

    const handleRemovePhoto = (index: number) => {
        const newPhotos = [...photos];
        newPhotos.splice(index, 1);
        setValue("media", newPhotos, { shouldValidate: true });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-lato">
            <div className="mb-6">
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2">5. Médias & Contact</h2>
                <p className="text-sm text-[#1E1E1E]/80 mb-6 font-lato">Montrez votre univers musical (5 photos max).</p>
            </div>

            <div className="space-y-6 bg-[#EBE6DA] p-6 rounded-2xl border border-[#D4D2CF]/50">
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <label className="block text-sm font-bold text-[#1E1E1E]">Galerie Photos ({photos.length}/5) *</label>
                        {photos.length < 5 && (
                            <button
                                type="button"
                                onClick={handleMockUpload}
                                className="text-xs font-bold text-[#B79A63] hover:text-[#B79A63]/80 flex items-center gap-1 bg-[#B79A63]/10 px-3 py-1.5 rounded-lg"
                            >
                                <Plus className="w-3 h-3" /> Ajouter
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {photos.map((url: string, index: number) => (
                            <div key={index} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-[#D4D2CF] group">
                                <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                                {index === 0 && (
                                    <div className="absolute top-2 left-2 bg-[#B79A63] text-white text-[10px] font-bold px-2 py-1 rounded-md">
                                        Principale
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleRemovePhoto(index)}
                                    className="absolute inset-x-0 bottom-0 bg-red-500/90 text-white text-xs py-2 opacity-0 group-hover:opacity-100 transition-opacity font-bold text-center"
                                >
                                    Supprimer
                                </button>
                            </div>
                        ))}

                        {photos.length === 0 && (
                            <div className="col-span-full h-32 border-2 border-dashed border-[#B79A63]/30 rounded-xl flex flex-col items-center justify-center bg-[#F8F5F0]">
                                <span className="text-[#1E1E1E]/60 text-sm font-bold">Aucune photo pour le moment</span>
                            </div>
                        )}
                    </div>
                    {errors.media && <p className="text-red-500 text-xs mt-2">{errors.media.message as string}</p>}
                </div>

                <div className="pt-4 border-t border-[#D4D2CF]/50 space-y-6">
                    <h3 className="text-lg font-serif font-bold text-[#1E1E1E]">Contact</h3>

                    <div className="flex items-center justify-between p-4 bg-white border border-[#D4D2CF] rounded-xl hover:border-[#B79A63] transition-colors cursor-pointer"
                        onClick={() => setValue("formulaire_far7i", !formulaire_far7i, { shouldValidate: true })}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#F8F5F0] flex items-center justify-center flex-shrink-0">
                                <Copy className="w-5 h-5 text-[#B79A63]" />
                            </div>
                            <div>
                                <span className="block font-bold text-sm text-[#1E1E1E]">Demandes via Far7i</span>
                                <span className="text-xs text-[#1E1E1E]/70 font-lato mt-1 block">Les clients peuvent vous contacter par formulaire</span>
                            </div>
                        </div>
                        <div className={cn("w-12 h-6 rounded-full transition-colors relative flex-shrink-0", formulaire_far7i ? "bg-[#B79A63]" : "bg-[#D4D2CF]/80")}>
                            <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all", formulaire_far7i ? "left-7" : "left-1")} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Téléphone supplémentaire (Optionnel)</label>
                        <div className="relative">
                            <input
                                type="text"
                                {...register("phone")}
                                placeholder="05XX XX XX XX"
                                className={cn("w-full h-12 pl-12 pr-4 rounded-xl border bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors", errors.phone ? "border-red-500" : "border-[#D4D2CF]")}
                            />
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B79A63]" />
                        </div>
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message as string}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
