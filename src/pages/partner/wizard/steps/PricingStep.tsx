import React from "react";
import { useFormContext } from "react-hook-form";
import { Coins, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const PLAGES_HORAIRES = [
    { id: "matinee", label: "Matinée (08h - 13h)" },
    { id: "apres_midi", label: "Après-midi (14h - 19h)" },
    { id: "soiree", label: "Soirée (20h - 02h)" },
    { id: "journee_complete", label: "Journée Complète (08h - 00h)" }
];

export default function PricingStep() {
    const { register, watch, setValue, formState: { errors } } = useFormContext();
    const plages = watch("plages_horaires") || [];

    const handlePlageToggle = (id: string) => {
        if (plages.includes(id)) {
            setValue("plages_horaires", plages.filter((p: string) => p !== id), { shouldValidate: true });
        } else {
            setValue("plages_horaires", [...plages, id], { shouldValidate: true });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-lato">
            <div className="mb-6">
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2 flex items-center gap-2">
                    <Coins className="w-5 h-5 text-[#B79A63]" /> 4. Tarification & Conditions
                </h2>
                <p className="text-sm text-[#1E1E1E]/80 mb-6">Configurez votre prix de base et vos conditions de réservation.</p>
            </div>

            <div className="bg-[#EBE6DA] border border-[#D4D2CF] rounded-xl p-4 flex items-start gap-3 mb-8">
                <AlertCircle className="w-5 h-5 text-[#B79A63] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#1E1E1E]/80">
                    <strong className="text-[#1E1E1E]">Le prix final peut varier</strong> selon le type d'événement, la saison, le nombre d'invités ou si le client choisit des options supplémentaires lors des négociations. Ce prix indique une base (À partir de).
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Prix de base */}
                <div className="bg-white p-6 rounded-2xl border border-[#D4D2CF] shadow-sm relative overflow-hidden group focus-within:border-[#B79A63] transition-colors">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#B79A63]/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-focus-within:scale-110" />
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2 relative z-10">Prix de base (À partir de) *</label>
                    <div className="relative z-10">
                        <input
                            type="number"
                            {...register("prixAPartirDeDA", { valueAsNumber: true })}
                            className={cn("w-full h-14 pl-4 pr-16 rounded-xl border bg-[#F8F5F0] text-xl font-bold text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] focus:bg-white transition-all", errors.prixAPartirDeDA ? "border-red-500" : "border-[#D4D2CF]")}
                            placeholder="0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#1E1E1E]/40">DA</span>
                    </div>
                    {errors.prixAPartirDeDA && <p className="text-red-500 text-xs mt-1 relative z-10">{errors.prixAPartirDeDA.message as string}</p>}
                </div>

                {/* Acompte */}
                <div className="bg-white p-6 rounded-2xl border border-[#D4D2CF] shadow-sm relative overflow-hidden group focus-within:border-[#B79A63] transition-colors">
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2 relative z-10">Montant de l'acompte *</label>
                    <div className="relative z-10">
                        <input
                            type="number"
                            {...register("acompteMontantDA", { valueAsNumber: true })}
                            className={cn("w-full h-14 pl-4 pr-16 rounded-xl border bg-[#F8F5F0] text-xl font-bold text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] focus:bg-white transition-all", errors.acompteMontantDA ? "border-red-500" : "border-[#D4D2CF]")}
                            placeholder="0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#1E1E1E]/40">DA</span>
                    </div>
                    <p className="text-xs text-[#1E1E1E]/60 mt-2 relative z-10">Montant fixe exigé pour bloquer la date (réservation ferme).</p>
                    {errors.acompteMontantDA && <p className="text-red-500 text-xs mt-1 relative z-10">{errors.acompteMontantDA.message as string}</p>}
                </div>
            </div>

            <div className="pt-8 border-t border-[#D4D2CF]">
                <h3 className="text-lg font-serif font-bold text-[#1E1E1E] mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#B79A63]" /> Plages horaires de location
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {PLAGES_HORAIRES.map(plage => {
                        const isSelected = plages.includes(plage.id);
                        return (
                            <div
                                key={plage.id}
                                onClick={() => handlePlageToggle(plage.id)}
                                className={cn(
                                    "px-4 py-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 text-sm font-bold",
                                    isSelected
                                        ? "border-[#B79A63] bg-[#B79A63]/5"
                                        : "border-[#D4D2CF] bg-[#F8F5F0] hover:border-[#B79A63]/50"
                                )}
                            >
                                <input type="checkbox" checked={isSelected} readOnly className="w-5 h-5 accent-[#B79A63] pointer-events-none" />
                                <span className={isSelected ? "text-[#B79A63]" : "text-[#1E1E1E]"}>{plage.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-[#D4D2CF]">
                <div>
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Politique d'annulation</label>
                    <textarea
                        {...register("politique_annulation")}
                        rows={4}
                        placeholder="Ex: Remboursement intégral si annulation 30 jours avant..."
                        className="w-full p-4 rounded-xl border border-[#D4D2CF] bg-[#F8F5F0] text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] focus:bg-white transition-colors resize-none text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Règles et Contraintes du lieu</label>
                    <textarea
                        {...register("contraintes")}
                        rows={4}
                        placeholder="Ex: Interdiction de fumer à l'intérieur, nuisances sonores limitées après 2h..."
                        className="w-full p-4 rounded-xl border border-[#D4D2CF] bg-[#F8F5F0] text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] focus:bg-white transition-colors resize-none text-sm"
                    />
                </div>
            </div>
        </div>
    );
}
