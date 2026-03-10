import React from "react";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";

const PRODUITS = [
    { label: "Pièce montée", value: "piece_montee" },
    { label: "Tartes", value: "tartes" }
];

const OPTIONS_PERSONNALISATION = [
    { label: "Thème sur mesure", value: "theme_sur_mesure" },
    { label: "Choix des couleurs", value: "choix_couleurs" },
    { label: "Message personnalisé", value: "message_personnalise" },
    { label: "Nombre d’étages / Portions modulables", value: "portions_modulables" }
];

export default function SpecialtiesStep() {
    const { register, watch, setValue, formState: { errors } } = useFormContext();
    const produits = watch("produitsProposes") || [];
    const isPersonnalisationPossible = watch("personnalisationPossible") || false;
    const optionsChoisies = watch("optionsPersonnalisation") || [];

    const handleProduitToggle = (value: string) => {
        if (produits.includes(value)) {
            setValue("produitsProposes", produits.filter((p: string) => p !== value), { shouldValidate: true });
        } else {
            setValue("produitsProposes", [...produits, value], { shouldValidate: true });
        }
    };

    const handleOptionToggle = (value: string) => {
        if (optionsChoisies.includes(value)) {
            setValue("optionsPersonnalisation", optionsChoisies.filter((o: string) => o !== value), { shouldValidate: true });
        } else {
            setValue("optionsPersonnalisation", [...optionsChoisies, value], { shouldValidate: true });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-lato">
            <div className="mb-6">
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2">2. Spécialités & Personnalisation</h2>
                <p className="text-sm text-[#1E1E1E]/80 mb-6 font-lato">Détaillez les produits que vous proposez et vos options de personnalisation.</p>
            </div>

            <div className="space-y-6 bg-[#EBE6DA] p-6 rounded-2xl border border-[#D4D2CF]/50">
                <div>
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-4">Produits proposés (Cochez minimum 1) *</label>
                    <div className="flex flex-col gap-3">
                        {PRODUITS.map(produit => {
                            const isSelected = produits.includes(produit.value);
                            return (
                                <div
                                    key={produit.value}
                                    onClick={() => handleProduitToggle(produit.value)}
                                    className={cn(
                                        "min-h-[48px] px-4 py-2 rounded-xl border cursor-pointer transition-all flex items-center gap-3 text-sm font-bold",
                                        isSelected
                                            ? "border-[#B79A63] bg-[#F8F5F0] text-[#1E1E1E]"
                                            : "border-[#D4D2CF] bg-white text-[#1E1E1E]/70 hover:border-[#B79A63]"
                                    )}
                                >
                                    <div className={cn("w-4 h-4 border rounded bg-white flex items-center justify-center flex-shrink-0", isSelected ? "border-[#B79A63] bg-[#B79A63]" : "border-[#D4D2CF]")}>
                                        {isSelected && <div className="w-2 h-2 rounded-[1px] bg-white" />}
                                    </div>
                                    <span className="leading-tight">{produit.label}</span>
                                </div>
                            );
                        })}
                    </div>
                    {errors.produitsProposes && (
                        <p className="text-red-500 text-xs mt-2">{errors.produitsProposes.message as string}</p>
                    )}
                </div>

                <div className="pt-4 border-t border-[#D4D2CF]/50">
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Personnalisation possible ?</label>
                    <p className="text-xs text-[#1E1E1E]/80 mb-4">Proposez-vous à vos clients de personnaliser leurs gâteaux ?</p>
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                            <input
                                type="checkbox"
                                {...register("personnalisationPossible")}
                                className="sr-only"
                            />
                            <div className={cn("block w-14 h-8 rounded-full transition-colors", isPersonnalisationPossible ? "bg-[#B79A63]" : "bg-[#D4D2CF]")}></div>
                            <div className={cn("absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform", isPersonnalisationPossible ? "translate-x-6" : "translate-x-0")}></div>
                        </div>
                        <span className="text-sm font-bold text-[#1E1E1E]">{isPersonnalisationPossible ? 'Oui, personnalisation possible' : 'Non'}</span>
                    </label>

                    {isPersonnalisationPossible && (
                        <div className="mt-6 pt-4 border-t border-[#D4D2CF]/50 animate-in fade-in slide-in-from-top-2">
                            <label className="block text-sm font-bold text-[#1E1E1E] mb-4">Options de personnalisation</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {OPTIONS_PERSONNALISATION.map(option => {
                                    const isSelected = optionsChoisies.includes(option.value);
                                    return (
                                        <div
                                            key={option.value}
                                            onClick={() => handleOptionToggle(option.value)}
                                            className={cn(
                                                "min-h-[48px] px-4 py-2 rounded-xl border cursor-pointer transition-all flex items-center gap-3 text-sm font-bold",
                                                isSelected
                                                    ? "border-[#B79A63] bg-[#F8F5F0] text-[#1E1E1E]"
                                                    : "border-[#D4D2CF] bg-white text-[#1E1E1E]/70 hover:border-[#B79A63]"
                                            )}
                                        >
                                            <div className={cn("w-4 h-4 border rounded bg-white flex items-center justify-center flex-shrink-0", isSelected ? "border-[#B79A63] bg-[#B79A63]" : "border-[#D4D2CF]")}>
                                                {isSelected && <div className="w-2 h-2 rounded-[1px] bg-white" />}
                                            </div>
                                            <span className="leading-tight">{option.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
