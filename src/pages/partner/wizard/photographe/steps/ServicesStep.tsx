import React from "react";
import { useFormContext } from "react-hook-form";
import { PackageOpen, Camera, Video, Plus, Minus, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ServicesStep() {
    const { register, watch, setValue, formState: { errors } } = useFormContext();

    const isPhotographe = watch("isPhotographe");
    const isVideaste = watch("isVideaste");
    const optionsTechniques = watch("optionsTechniques") || [];

    const livrables = watch("livrables");

    const handleTechToggle = (id: string) => {
        if (optionsTechniques.includes(id)) {
            setValue("optionsTechniques", optionsTechniques.filter((v: string) => v !== id), { shouldValidate: true });
        } else {
            setValue("optionsTechniques", [...optionsTechniques, id], { shouldValidate: true });
        }
    };

    const updateQuantity = (field: string, delta: number, min: number = 1) => {
        const current = livrables[field] || min;
        const next = Math.max(min, current + delta);
        setValue(`livrables.${field}`, next, { shouldValidate: true });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-lato">
            <div className="mb-6">
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2 flex items-center gap-2">
                    <PackageOpen className="w-5 h-5 text-[#B79A63]" /> 3. Services & Livrables
                </h2>
                <p className="text-sm text-[#1E1E1E]/80 mb-6">Que recevront vos clients concrètement après l'événement ?</p>
            </div>

            {/* SERVICES PHOTOGRAPHE */}
            {isPhotographe && (
                <div className="bg-white p-6 rounded-2xl border border-[#B79A63]/50 shadow-sm mb-8 animate-in slide-in-from-top-4">
                    <h3 className="text-sm font-bold text-[#1E1E1E] mb-6 flex items-center gap-2">
                        <Camera className="w-5 h-5 text-[#B79A63]" /> Livrables Photographiques
                    </h3>

                    <div className="space-y-4">
                        {/* ALBUM PRINCIPAL */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl bg-[#F8F5F0] transition-colors focus-within:border-[#B79A63]">
                            <label className="flex items-center gap-3 cursor-pointer mb-3 sm:mb-0 w-full sm:w-auto">
                                <input type="checkbox" {...register("livrables.hasAlbums")} className="w-5 h-5 accent-[#B79A63] rounded" />
                                <span className="text-sm font-bold text-[#1E1E1E]">Album photo / Photobook (Principal)</span>
                            </label>
                            {livrables.hasAlbums && (
                                <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-[#D4D2CF] shadow-inner ml-8 sm:ml-0">
                                    <button type="button" onClick={() => updateQuantity('quantiteAlbums', -1)} className="w-8 h-8 flex items-center justify-center bg-[#F8F5F0] rounded-md hover:bg-[#D4D2CF] transition-colors text-[#1E1E1E]"><Minus className="w-4 h-4" /></button>
                                    <span className="w-8 text-center font-bold text-sm">{livrables.quantiteAlbums}</span>
                                    <button type="button" onClick={() => updateQuantity('quantiteAlbums', 1)} className="w-8 h-8 flex items-center justify-center bg-[#F8F5F0] rounded-md hover:bg-[#D4D2CF] transition-colors text-[#1E1E1E]"><Plus className="w-4 h-4" /></button>
                                </div>
                            )}
                        </div>
                        {(errors.livrables as any)?.quantiteAlbums && <p className="text-red-500 text-xs ml-4">{(errors.livrables as any).quantiteAlbums.message}</p>}

                        {/* ALBUM SUPP */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl bg-[#F8F5F0] transition-colors focus-within:border-[#B79A63]">
                            <label className="flex items-center gap-3 cursor-pointer mb-3 sm:mb-0 w-full sm:w-auto">
                                <input type="checkbox" {...register("livrables.hasAlbumsSupp")} className="w-5 h-5 accent-[#B79A63] rounded" />
                                <span className="text-sm font-bold text-[#1E1E1E]">Albums parents / Mini-albums</span>
                            </label>
                            {livrables.hasAlbumsSupp && (
                                <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-[#D4D2CF] shadow-inner ml-8 sm:ml-0">
                                    <button type="button" onClick={() => updateQuantity('quantiteAlbumsSupp', -1)} className="w-8 h-8 flex items-center justify-center bg-[#F8F5F0] rounded-md hover:bg-[#D4D2CF] transition-colors text-[#1E1E1E]"><Minus className="w-4 h-4" /></button>
                                    <span className="w-8 text-center font-bold text-sm">{livrables.quantiteAlbumsSupp}</span>
                                    <button type="button" onClick={() => updateQuantity('quantiteAlbumsSupp', 1)} className="w-8 h-8 flex items-center justify-center bg-[#F8F5F0] rounded-md hover:bg-[#D4D2CF] transition-colors text-[#1E1E1E]"><Plus className="w-4 h-4" /></button>
                                </div>
                            )}
                        </div>

                        {/* TIRAGES PAPIER */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl bg-[#F8F5F0] transition-colors focus-within:border-[#B79A63]">
                            <div>
                                <label className="flex items-center gap-3 cursor-pointer w-full sm:w-auto">
                                    <input type="checkbox" {...register("livrables.hasTirages")} className="w-5 h-5 accent-[#B79A63] rounded" />
                                    <span className="text-sm font-bold text-[#1E1E1E]">Tirages papier classiques</span>
                                </label>
                            </div>
                            {livrables.hasTirages && (
                                <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-[#D4D2CF] shadow-inner ml-8 mt-3 sm:mt-0 sm:ml-0">
                                    <button type="button" onClick={() => updateQuantity('quantiteTirages', -10, 10)} className="w-8 h-8 flex items-center justify-center bg-[#F8F5F0] rounded-md hover:bg-[#D4D2CF] transition-colors text-[#1E1E1E]"><Minus className="w-4 h-4" /></button>
                                    <span className="w-12 text-center font-bold text-sm">{livrables.quantiteTirages}</span>
                                    <button type="button" onClick={() => updateQuantity('quantiteTirages', 10, 10)} className="w-8 h-8 flex items-center justify-center bg-[#F8F5F0] rounded-md hover:bg-[#D4D2CF] transition-colors text-[#1E1E1E]"><Plus className="w-4 h-4" /></button>
                                </div>
                            )}
                        </div>

                        {/* CADRES */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl bg-[#F8F5F0] transition-colors focus-within:border-[#B79A63]">
                            <label className="flex items-center gap-3 cursor-pointer mb-3 sm:mb-0 w-full sm:w-auto">
                                <input type="checkbox" {...register("livrables.hasCadres")} className="w-5 h-5 accent-[#B79A63] rounded" />
                                <span className="text-sm font-bold text-[#1E1E1E]">Cadres Photo (Agrandissements)</span>
                            </label>
                            {livrables.hasCadres && (
                                <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-[#D4D2CF] shadow-inner ml-8 sm:ml-0">
                                    <button type="button" onClick={() => updateQuantity('quantiteCadres', -1)} className="w-8 h-8 flex items-center justify-center bg-[#F8F5F0] rounded-md hover:bg-[#D4D2CF] transition-colors text-[#1E1E1E]"><Minus className="w-4 h-4" /></button>
                                    <span className="w-8 text-center font-bold text-sm">{livrables.quantiteCadres}</span>
                                    <button type="button" onClick={() => updateQuantity('quantiteCadres', 1)} className="w-8 h-8 flex items-center justify-center bg-[#F8F5F0] rounded-md hover:bg-[#D4D2CF] transition-colors text-[#1E1E1E]"><Plus className="w-4 h-4" /></button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* SERVICES VIDEASTE */}
            {isVideaste && (
                <div className="bg-white p-6 rounded-2xl border border-[#1E1E1E]/20 shadow-sm mb-8 animate-in slide-in-from-top-4">
                    <h3 className="text-sm font-bold text-[#1E1E1E] mb-6 flex items-center gap-2">
                        <Video className="w-5 h-5 text-[#1E1E1E]" /> Options Vidéo & Réalisation
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <label className={cn("flex flex-col p-4 rounded-xl border cursor-pointer transition-all", livrables.filmLong ? "border-[#B79A63] bg-[#B79A63]/5 shadow-sm" : "border-[#D4D2CF] bg-[#F8F5F0] hover:border-[#B79A63]")}>
                            <div className="flex items-center gap-3 mb-2">
                                <input type="checkbox" {...register("livrables.filmLong")} className="w-5 h-5 accent-[#B79A63] rounded" />
                                <span className="text-sm font-bold text-[#1E1E1E]">Film Long (Intégral)</span>
                            </div>
                            <span className="text-xs text-[#1E1E1E]/60 ml-8">Montage de +45 minutes retraçant tout l'événement.</span>
                        </label>

                        <label className={cn("flex flex-col p-4 rounded-xl border cursor-pointer transition-all", livrables.filmCourt ? "border-[#B79A63] bg-[#B79A63]/5 shadow-sm" : "border-[#D4D2CF] bg-[#F8F5F0] hover:border-[#B79A63]")}>
                            <div className="flex items-center gap-3 mb-2">
                                <input type="checkbox" {...register("livrables.filmCourt")} className="w-5 h-5 accent-[#B79A63] rounded" />
                                <span className="text-sm font-bold text-[#1E1E1E]">Film Court (Teaser/Highlight)</span>
                            </div>
                            <span className="text-xs text-[#1E1E1E]/60 ml-8">Clip dynamique de 3 à 5 minutes (Idéal réseaux sociaux).</span>
                        </label>

                        <div
                            onClick={() => handleTechToggle('drone')}
                            className={cn("flex flex-col p-4 rounded-xl border cursor-pointer transition-all", optionsTechniques.includes('drone') ? "border-[#B79A63] bg-[#B79A63]/5 shadow-sm" : "border-[#D4D2CF] bg-[#F8F5F0] hover:border-[#B79A63]")}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <input type="checkbox" checked={optionsTechniques.includes('drone')} readOnly className="w-5 h-5 accent-[#B79A63] rounded pointer-events-none" />
                                <span className="text-sm font-bold text-[#1E1E1E]">Prises de vue par Drone</span>
                            </div>
                            <span className="text-xs text-[#1E1E1E]/60 ml-8">Captations aériennes du lieu et de l'extérieur.</span>
                        </div>
                    </div>
                </div>
            )}

            {/* SERVICES GENERAUX */}
            <div className="pt-6 border-t border-[#D4D2CF]">
                <h3 className="text-sm font-bold text-[#1E1E1E] mb-4">Support & Options générales</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* CLES USB */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl bg-white transition-colors focus-within:border-[#B79A63]">
                        <label className="flex items-center gap-3 cursor-pointer mb-3 sm:mb-0 w-full sm:w-auto">
                            <input type="checkbox" {...register("livrables.hasClesUSB")} className="w-5 h-5 accent-[#B79A63] rounded" />
                            <span className="text-sm font-bold text-[#1E1E1E]">Rendu sur Clé USB personnalisée</span>
                        </label>
                        {livrables.hasClesUSB && (
                            <div className="flex items-center gap-3 bg-[#F8F5F0] p-1 rounded-lg border border-[#D4D2CF] shadow-inner ml-8 sm:ml-0">
                                <button type="button" onClick={() => updateQuantity('quantiteClesUSB', -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-md hover:bg-[#D4D2CF] transition-colors text-[#1E1E1E]"><Minus className="w-4 h-4" /></button>
                                <span className="w-8 text-center font-bold text-sm">{livrables.quantiteClesUSB}</span>
                                <button type="button" onClick={() => updateQuantity('quantiteClesUSB', 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-md hover:bg-[#D4D2CF] transition-colors text-[#1E1E1E]"><Plus className="w-4 h-4" /></button>
                            </div>
                        )}
                    </div>

                    <label className={cn("flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all", livrables.livraisonExpress ? "border-[#B79A63] bg-white shadow-sm" : "border-[#D4D2CF] bg-[#F8F5F0] hover:border-[#B79A63]")}>
                        <input type="checkbox" {...register("livrables.livraisonExpress")} className="w-5 h-5 accent-[#B79A63] rounded" />
                        <span className="text-sm font-bold text-[#1E1E1E]">Livraison Rapide / Express (Prioritaire)</span>
                    </label>

                    <label className={cn("flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all", optionsTechniques.includes('heures_sup') ? "border-[#B79A63] bg-white shadow-sm" : "border-[#D4D2CF] bg-[#F8F5F0] hover:border-[#B79A63]")}>
                        <input type="checkbox" checked={optionsTechniques.includes('heures_sup')} onChange={() => handleTechToggle('heures_sup')} className="w-5 h-5 accent-[#B79A63] rounded" />
                        <span className="text-sm font-bold text-[#1E1E1E]">Heures supplémentaires facturables</span>
                    </label>
                </div>
            </div>

        </div>
    );
}
