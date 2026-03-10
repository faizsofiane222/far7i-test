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
                <p className="text-sm text-[#1E1E1E]/80 mb-6 font-lato">Définissez vos tarifs de base et conditions de réservation.</p>
            </div>

            <div className="space-y-6 bg-[#EBE6DA] p-6 rounded-2xl border border-[#D4D2CF]/50">

                <div className="bg-[#F8F5F0] border-l-4 border-[#B79A63] p-4 rounded-r-xl flex gap-3 text-sm text-[#1E1E1E]/80">
                    <Info className="w-5 h-5 text-[#B79A63] flex-shrink-0" />
                    <p>
                        <strong>Note :</strong> Le prix final peut varier selon le type de prestation, le nombre de personnes, la durée et le déplacement.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Prix à partir de (DA) *</label>
                        <div className="relative">
                            <input
                                type="number"
                                {...register("prixAPartirDeDA")}
                                placeholder="0"
                                className={cn("w-full h-12 px-4 pr-12 rounded-xl border bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors", errors.prixAPartirDeDA ? "border-red-500" : "border-[#D4D2CF]")}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1E1E1E]/40 font-bold text-sm">DA</span>
                        </div>
                        <p className="text-xs text-[#1E1E1E]/80 mt-2">Le tarif minimum pour votre prestation la moins chère.</p>
                        {errors.prixAPartirDeDA && <p className="text-red-500 text-xs mt-1">{errors.prixAPartirDeDA.message as string}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Acompte demandé (DA)</label>
                        <div className="relative">
                            <input
                                type="number"
                                {...register("acompteMontantDA")}
                                placeholder="0"
                                className={cn("w-full h-12 px-4 pr-12 rounded-xl border bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors", errors.acompteMontantDA ? "border-red-500" : "border-[#D4D2CF]")}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1E1E1E]/40 font-bold text-sm">DA</span>
                        </div>
                        <p className="text-xs text-[#1E1E1E]/80 mt-2">Pour bloquer la date (Optionnel).</p>
                    </div>
                </div>

                <div className="pt-4 border-t border-[#D4D2CF]/50">
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Politique d'annulation</label>
                    <textarea
                        {...register("politiqueAnnulation")}
                        rows={3}
                        className="w-full p-4 rounded-xl border border-[#D4D2CF] bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors resize-none mb-1"
                        placeholder="Ex: Acompte non remboursable si annulation à moins de 7 jours..."
                    />
                    <p className="text-xs text-[#1E1E1E]/80 mt-1">Quelles sont vos conditions en cas d'annulation de la cliente ? (Optionnel)</p>
                </div>
            </div>
        </div>
    );
}
