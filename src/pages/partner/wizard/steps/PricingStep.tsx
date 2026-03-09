import React from "react";
import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { GildedInput } from "@/components/ui/gilded-input";
import { DollarSign, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PricingStep() {
    const { register, watch, formState: { errors } } = useFormContext();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div>
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2 flex items-center gap-2">
                    4. Tarification & Conditions
                </h2>
                <p className="text-sm text-[#1E1E1E]/60 mb-6">
                    Définissez vos prix de base et vos conditions de réservation.
                </p>

                <div className="bg-[#EBE6DA] p-4 rounded-xl text-sm text-[#1E1E1E]/80 flex items-start gap-3 border border-[#B79A63]/30 mb-8">
                    <AlertCircle className="w-5 h-5 text-[#B79A63] shrink-0 mt-0.5" />
                    <p>Le prix final peut varier selon le type d'événement, la saison et le nombre d'invités. Les tarifs indiqués ici donnent une estimation claire à vos futurs clients.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Tarifs */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-[#1E1E1E] flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-[#B79A63]" /> Prix à partir de *
                            </Label>
                            <div className="relative">
                                <GildedInput
                                    type="number"
                                    className={cn("pr-16 text-lg", errors.base_price && "border-red-500")}
                                    {...register("base_price", { valueAsNumber: true })}
                                    placeholder="Ex: 150000"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#1E1E1E]/40">DZD</span>
                            </div>
                            {errors.base_price && <p className="text-red-500 text-xs mt-1">{errors.base_price.message as string}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-[#1E1E1E] flex items-center gap-2">
                                Montant de l'acompte (Fixe) *
                            </Label>
                            <div className="relative">
                                <GildedInput
                                    type="number"
                                    className={cn("pr-16", errors.acompte_montant && "border-red-500")}
                                    {...register("acompte_montant", { valueAsNumber: true })}
                                    placeholder="Ex: 50000"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#1E1E1E]/40">DZD</span>
                            </div>
                            {errors.acompte_montant && <p className="text-red-500 text-xs mt-1">{errors.acompte_montant.message as string}</p>}
                            <p className="text-xs text-[#1E1E1E]/60 mt-1">Montant forfaitaire demandé pour bloquer la réservation.</p>
                        </div>
                    </div>

                    {/* Textiles / Plages */}
                    <div className="space-y-6">
                        <div>
                            <Label className="text-sm font-bold text-[#1E1E1E] flex items-center gap-2 mb-3">
                                <Clock className="w-4 h-4 text-[#B79A63]" /> Plages Horaires Possibles
                            </Label>
                            <div className="flex flex-col gap-3">
                                {[
                                    { key: 'horaires_journee', label: 'Journée (ex: 12h - 18h)' },
                                    { key: 'horaires_soiree', label: 'Soirée (ex: 18h - 00h)' },
                                    { key: 'horaires_nuit', label: 'Nuit / Complète (ex: 18h - 05h)' },
                                ].map(h => (
                                    <label key={h.key} className="flex items-center gap-3 cursor-pointer p-3 border border-[#D4D2CF] bg-[#F8F5F0] rounded-xl hover:border-[#B79A63] transition-colors focus-within:border-[#B79A63]">
                                        <input type="checkbox" {...register(h.key)} className="w-5 h-5 accent-[#B79A63] rounded border-[#D4D2CF]" />
                                        <span className="text-sm font-bold text-[#1E1E1E]">{h.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-8 border-t border-[#D4D2CF] grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <Label className="text-sm font-bold text-[#1E1E1E]">Politique d'annulation</Label>
                    <textarea
                        {...register("politique_annulation")}
                        className="w-full h-32 rounded-xl border border-[#D4D2CF] bg-[#F8F5F0] p-4 text-sm focus:ring-1 focus:ring-[#B79A63] outline-none resize-none"
                        placeholder="Ex: L'acompte n'est pas remboursé en cas d'annulation à moins de 30 jours de l'événement."
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-bold text-[#1E1E1E]">Contraintes spécifiques</Label>
                    <textarea
                        {...register("contraintes_regles")}
                        className="w-full h-32 rounded-xl border border-[#D4D2CF] bg-[#F8F5F0] p-4 text-sm focus:ring-1 focus:ring-[#B79A63] outline-none resize-none"
                        placeholder="Ex: Bruit modéré après 2h du matin, feux d'artifice interdits..."
                    />
                </div>
            </div>
        </div>
    );
}
