import React from "react";
import { useFormContext } from "react-hook-form";
import { Coins, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PricingStep() {
    const { register, formState: { errors } } = useFormContext();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-lato">
            <div className="mb-6">
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2 flex items-center gap-2">
                    <Coins className="w-5 h-5 text-[#B79A63]" /> 4. Tarification & Conditions
                </h2>
                <p className="text-sm text-[#1E1E1E]/80 mb-6">Configurez votre tarification de base par invité pour aiguiller les mariés.</p>
            </div>

            <div className="bg-[#EBE6DA] border border-[#D4D2CF] rounded-xl p-4 flex items-start gap-3 mb-8">
                <AlertCircle className="w-5 h-5 text-[#B79A63] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#1E1E1E]/80">
                    <strong className="text-[#1E1E1E]">Ce prix est indicatif.</strong> Le tarif final peut varier selon le type d'événement, le nombre d'invités, le menu choisi, le service inclus, la date et l'urgence.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Prix de base Par Personne */}
                <div className="bg-white p-6 rounded-2xl border border-[#D4D2CF] shadow-sm relative overflow-hidden group focus-within:border-[#B79A63] transition-colors">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#B79A63]/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-focus-within:scale-110" />
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2 relative z-10">Prix de base (À partir de) *</label>
                    <div className="relative z-10">
                        <input
                            type="number"
                            {...register("prixAPartirDeParPersonneDA", { valueAsNumber: true })}
                            className={cn("w-full h-14 pl-4 pr-32 rounded-xl border bg-[#F8F5F0] text-xl font-bold text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] focus:bg-white transition-all", errors.prixAPartirDeParPersonneDA ? "border-red-500" : "border-[#D4D2CF]")}
                            placeholder="0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#1E1E1E]/40">DA / personne</span>
                    </div>
                    {errors.prixAPartirDeParPersonneDA && <p className="text-red-500 text-xs mt-1 relative z-10">{errors.prixAPartirDeParPersonneDA.message as string}</p>}
                </div>

                {/* Acompte */}
                <div className="bg-white p-6 rounded-2xl border border-[#D4D2CF] shadow-sm relative overflow-hidden group focus-within:border-[#B79A63] transition-colors">
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2 relative z-10">Acompte / Avance exigée</label>
                    <div className="relative z-10">
                        <input
                            type="number"
                            {...register("acompteMontantDA", { valueAsNumber: true })}
                            className={cn("w-full h-14 pl-4 pr-16 rounded-xl border bg-[#F8F5F0] text-xl font-bold text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] focus:bg-white transition-all", errors.acompteMontantDA ? "border-red-500" : "border-[#D4D2CF]")}
                            placeholder="0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#1E1E1E]/40">DA</span>
                    </div>
                    <p className="text-xs text-[#1E1E1E]/60 mt-2 relative z-10">Montant fixe moyen demandé pour bloquer une date fermement.</p>
                </div>
            </div>

            <div className="pt-8 border-t border-[#D4D2CF]">
                <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Politique d'annulation / Modalités de paiement</label>
                <textarea
                    {...register("politiqueAnnulation")}
                    rows={4}
                    placeholder="Ex: L'acompte n'est pas remboursé si l'annulation intervient à moins de 15 jours de l'événement. Le solde doit être réglé le jour de la prestation."
                    className="w-full p-4 rounded-xl border border-[#D4D2CF] bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors resize-none text-sm"
                />
            </div>

        </div>
    );
}
