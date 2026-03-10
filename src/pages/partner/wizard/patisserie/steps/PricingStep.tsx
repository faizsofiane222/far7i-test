import React from "react";
import { useFormContext } from "react-hook-form";
import { Tag, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PricingStep() {
    const { register, formState: { errors } } = useFormContext();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-lato">
            <div className="mb-6">
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2">4. Tarification & Conditions</h2>
                <p className="text-sm text-[#1E1E1E]/80 mb-6 font-lato">Indiquez vos prix de base et vos conditions de réservation.</p>
            </div>

            {/* Alert Box in Muted Cream */}
            <div className="bg-[#EBE6DA] border-l-4 border-[#B79A63] p-4 rounded-r-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#B79A63] shrink-0 mt-0.5" />
                <p className="text-sm font-bold text-[#1E1E1E]/80 font-lato leading-relaxed">
                    Le prix final peut varier selon la taille, le nombre de parts, le niveau de personnalisation, l'urgence et la livraison.
                </p>
            </div>

            <div className="space-y-6 bg-[#EBE6DA] p-6 rounded-2xl border border-[#D4D2CF]/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Prix à partir de (DA / pièce) *</label>
                        <div className="relative">
                            <input
                                type="number"
                                {...register("prixAPartirDeDAParPiece")}
                                placeholder="0"
                                className={cn("w-full h-12 pl-10 pr-16 rounded-xl border bg-white text-[#1E1E1E] font-bold focus:outline-none focus:border-[#B79A63] transition-colors", errors.prixAPartirDeDAParPiece ? "border-red-500" : "border-[#D4D2CF]")}
                            />
                            <Tag className="w-5 h-5 text-[#B79A63] absolute left-3 top-1/2 -translate-y-1/2" />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#1E1E1E]/40">DA/pièce</span>
                        </div>
                        {errors.prixAPartirDeDAParPiece && <p className="text-red-500 text-xs mt-1">{errors.prixAPartirDeDAParPiece.message as string}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Montant de l'acompte (DA)</label>
                        <div className="relative">
                            <input
                                type="number"
                                {...register("acompteMontantDA")}
                                placeholder="0"
                                className={cn("w-full h-12 pl-4 pr-12 rounded-xl border bg-white text-[#1E1E1E] font-bold focus:outline-none focus:border-[#B79A63] transition-colors", errors.acompteMontantDA ? "border-red-500" : "border-[#D4D2CF]")}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#1E1E1E]/40">DA</span>
                        </div>
                        <p className="text-xs text-[#1E1E1E]/80 mt-2">Montant fixe pour valider la commande (Optionnel).</p>
                        {errors.acompteMontantDA && <p className="text-red-500 text-xs mt-1">{errors.acompteMontantDA.message as string}</p>}
                    </div>
                </div>

                <div className="pt-4 border-t border-[#D4D2CF]/50">
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Politique d'annulation / Modification (Optionnel)</label>
                    <textarea
                        {...register("politiqueAnnulation")}
                        rows={3}
                        className="w-full p-4 rounded-xl border border-[#D4D2CF] bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors resize-none"
                        placeholder="Ex: Toute commande est définitive 72h avant la livraison. L'acompte est non-remboursable..."
                    />
                </div>
            </div>
        </div>
    );
}
