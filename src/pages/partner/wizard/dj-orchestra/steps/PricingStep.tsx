import React from "react";
import { useFormContext } from "react-hook-form";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PricingStep() {
    const { register, formState: { errors } } = useFormContext();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-lato">
            <div className="mb-6">
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2">4. Tarification & Conditions</h2>
                <p className="text-sm text-[#1E1E1E]/80 mb-6 font-lato">Soyez transparent sur vos tarifs.</p>
            </div>

            <div className="space-y-6 bg-[#EBE6DA] p-6 rounded-2xl border border-[#D4D2CF]/50">
                <div className="flex items-start gap-3 bg-[#F8F5F0] p-4 rounded-xl border border-[#D4D2CF]">
                    <Info className="w-5 h-5 text-[#B79A63] flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-bold text-[#1E1E1E]/80 font-lato">Le prix final peut varier selon la durée, la date et le matériel nécessaire.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Prix à partir de (DA) *</label>
                        <div className="relative">
                            <input
                                type="number"
                                {...register("prixAPartirDeDA")}
                                placeholder="0"
                                className={cn("w-full h-12 pl-4 pr-12 rounded-xl border bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors font-bold", errors.prixAPartirDeDA ? "border-red-500" : "border-[#D4D2CF]")}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1E1E1E]/50 font-bold text-sm">DA</span>
                        </div>
                        {errors.prixAPartirDeDA && <p className="text-red-500 text-xs mt-1">{errors.prixAPartirDeDA.message as string}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Acompte demandé (DA) Optionnel</label>
                        <div className="relative">
                            <input
                                type="number"
                                {...register("acompteMontantDA")}
                                placeholder="0"
                                className={cn("w-full h-12 pl-4 pr-12 rounded-xl border bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors font-bold", errors.acompteMontantDA ? "border-red-500" : "border-[#D4D2CF]")}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1E1E1E]/50 font-bold text-sm">DA</span>
                        </div>
                        {errors.acompteMontantDA && <p className="text-red-500 text-xs mt-1">{errors.acompteMontantDA.message as string}</p>}
                    </div>
                </div>

                <div className="pt-4 border-t border-[#D4D2CF]/50">
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Politique d'annulation (Optionnel)</label>
                    <textarea
                        {...register("politiqueAnnulation")}
                        rows={3}
                        className={cn("w-full p-4 rounded-xl border bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors resize-none", errors.politiqueAnnulation ? "border-red-500" : "border-[#D4D2CF]")}
                        placeholder="Ex: L'acompte n'est pas remboursé en cas d'annulation moins de 15 jours avant..."
                    />
                </div>
            </div>
        </div>
    );
}
