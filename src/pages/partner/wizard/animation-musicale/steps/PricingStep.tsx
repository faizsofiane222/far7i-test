import React from "react";
import { UseFormReturn } from "react-hook-form";
import { AnimationMusicaleFormValues } from "../schema";
import { GildedInput } from "@/components/ui/gilded-input";
import { Label } from "@/components/ui/label";
import { useWilayas } from "@/hooks/useWilayas";
import { cn } from "@/lib/utils";
import { MapPin, Check, Info, DollarSign, ShieldCheck } from "lucide-react";

interface StepProps {
    methods: UseFormReturn<AnimationMusicaleFormValues>;
}

const PRICE_REASONS = [
    "Durée de la prestation",
    "Type d'événement",
    "Moment (réception / soirée)",
    "Semaine / week-end",
    "Déplacement",
    "Matériel supplémentaire",
];

export default function PricingStep({ methods }: StepProps) {
    const { register, watch, setValue, formState: { errors } } = methods;
    const { wilayas } = useWilayas();
    const deplacementPossible = watch("deplacementPossible");
    const wilayasDeplacement = watch("wilayasDeplacement") || [];
    const acompteDemande = watch("acompteDemande");
    const cautionDemande = watch("cautionDemande");

    const toggleWilaya = (id: string) => {
        const current = [...wilayasDeplacement];
        const index = current.indexOf(id);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(id);
        }
        setValue("wilayasDeplacement", current, { shouldValidate: true });
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-2">
                <h2 className="text-3xl font-serif text-[#1E1E1E]">Tarifs & Logistique</h2>
                <p className="text-sm font-sans text-[#1E1E1E]/60">Définissez vos prix de base et vos conditions de déplacement.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                    <div className="space-y-4">
                        <Label className="text-xs font-bold uppercase tracking-widest text-[#1E1E1E]">Prix à partir de (DA) *</Label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#B79A63]">DA</span>
                            <GildedInput
                                type="number"
                                {...register("prixAPartirDeDA", { valueAsNumber: true })}
                                placeholder="0"
                                className={cn("pl-12 text-lg font-bold", errors.prixAPartirDeDA && "border-red-500 focus:ring-red-500/20")}
                            />
                        </div>
                        {errors.prixAPartirDeDA && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.prixAPartirDeDA.message}</p>}
                    </div>

                    <div className="p-6 bg-[#1E1E1E] rounded-2xl text-white space-y-4 shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#B79A63] flex items-center justify-center">
                                <Info className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Le prix peut varier selon :</span>
                        </div>
                        <ul className="space-y-2">
                            {PRICE_REASONS.map(reason => (
                                <li key={reason} className="flex items-center gap-3 text-[11px] text-white/50">
                                    <div className="w-1 h-1 rounded-full bg-[#B79A63]" />
                                    {reason}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-[#D4D2CF] flex flex-col items-center justify-center text-center gap-6 shadow-sm">
                    <div className="w-20 h-20 bg-[#F8F5F0] rounded-full flex items-center justify-center border border-[#B79A63]/20">
                        <DollarSign className="w-10 h-10 text-[#B79A63]" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-serif font-bold text-[#1E1E1E]">Tarif Indicatif</h3>
                        <p className="text-xs text-[#1E1E1E]/50 leading-relaxed font-sans">
                            Aide UX : Ce prix sert de base pour les clients. Le devis final sera établi après discussion directe.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                <button
                    type="button"
                    onClick={() => setValue("deplacementPossible", !deplacementPossible)}
                    className={cn(
                        "w-full p-6 rounded-2xl border-2 flex items-center gap-5 transition-all text-left group",
                        deplacementPossible ? "bg-[#1E1E1E] border-[#1E1E1E] text-white shadow-lg" : "bg-white border-[#D4D2CF] text-[#1E1E1E]/60 hover:border-[#B79A63]"
                    )}
                >
                    <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-sm",
                        deplacementPossible ? "bg-[#B79A63]" : "bg-[#F8F5F0] group-hover:bg-white"
                    )}>
                        <MapPin className={cn("w-6 h-6", deplacementPossible && "text-white")} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold uppercase text-xs tracking-widest">Je me déplace dans d'autres wilayas</span>
                        <span className={cn("text-xs font-sans", deplacementPossible ? "text-white/60" : "text-[#1E1E1E]/40")}>Activez pour sélectionner vos zones de couverture</span>
                    </div>
                    {deplacementPossible && <Check className="w-5 h-5 text-[#B79A63] ml-auto" />}
                </button>

                {deplacementPossible && (
                    <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                        <Label className="text-xs font-bold uppercase tracking-widest text-[#1E1E1E]">Wilayas de déplacement *</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-4 bg-white rounded-2xl border border-[#D4D2CF] custom-scrollbar">
                            {wilayas.map(w => (
                                <button
                                    key={w.id}
                                    type="button"
                                    onClick={() => toggleWilaya(w.id)}
                                    className={cn(
                                        "px-2 py-2 rounded-lg border text-[9px] font-bold uppercase transition-all text-center",
                                        wilayasDeplacement.includes(w.id)
                                            ? "bg-[#B79A63] text-white border-[#B79A63]"
                                            : "bg-[#F8F5F0] border-transparent text-[#1E1E1E]/40 hover:border-[#D4D2CF]"
                                    )}
                                >
                                    {w.name}
                                </button>
                            ))}
                        </div>
                        {errors.wilayasDeplacement && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.wilayasDeplacement.message as string}</p>}
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <Label className="text-xs font-bold uppercase tracking-widest text-[#1E1E1E]">Conditions & Réservation</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => setValue("acompteDemande", !acompteDemande)}
                        className={cn(
                            "p-6 rounded-2xl border-2 flex items-center gap-4 transition-all group",
                            acompteDemande ? "bg-[#1E1E1E] border-[#1E1E1E] text-white" : "bg-white border-[#D4D2CF] text-[#1E1E1E]/60 hover:border-[#B79A63]"
                        )}
                    >
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-colors", acompteDemande ? "bg-[#B79A63]" : "bg-[#F8F5F0] group-hover:bg-white")}>
                            <ShieldCheck className={cn("w-6 h-6", acompteDemande && "text-white")} />
                        </div>
                        <span className="font-bold uppercase text-xs tracking-widest">Acompte demandé</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setValue("cautionDemande", !cautionDemande)}
                        className={cn(
                            "p-6 rounded-2xl border-2 flex items-center gap-4 transition-all group",
                            cautionDemande ? "bg-[#1E1E1E] border-[#1E1E1E] text-white" : "bg-white border-[#D4D2CF] text-[#1E1E1E]/60 hover:border-[#B79A63]"
                        )}
                    >
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-colors", cautionDemande ? "bg-[#B79A63]" : "bg-[#F8F5F0] group-hover:bg-white")}>
                            <Check className={cn("w-6 h-6", cautionDemande && "text-white")} />
                        </div>
                        <span className="font-bold uppercase text-xs tracking-widest">Caution demandée</span>
                    </button>
                </div>

                <div className="space-y-4 mt-6">
                    <Label className="text-xs font-bold uppercase tracking-widest text-[#1E1E1E]">Politique d'annulation (Optionnel)</Label>
                    <textarea
                        {...register("politiqueAnnulation")}
                        placeholder="Ex: Remboursement intégral si annulation 1 mois avant..."
                        className="w-full h-32 rounded-xl border border-[#D4D2CF] bg-white p-4 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#B79A63]/30 focus:border-[#B79A63] transition-all resize-none"
                    />
                </div>
            </div>
        </div>
    );
}
