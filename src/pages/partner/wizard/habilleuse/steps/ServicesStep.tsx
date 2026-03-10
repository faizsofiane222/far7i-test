import React from "react";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";

const PRESTATIONS = [
    { label: "Habillage de la mariée", value: "habillage" },
    { label: "Accompagnement pendant l’événement", value: "accompagnement_event" },
    { label: "Coordination avec coiffure & maquillage", value: "coordination_beaute" }
];

const OPTIONS_SERVICES = [
    { label: "Présence prolongée", value: "presence_prolongee" },
    { label: "Assistance famille / proches", value: "assistance_famille" },
    { label: "Gestion des accessoires (bijoux, voiles, ceintures…)", value: "gestion_accessoires" }
];

export default function ServicesStep() {
    const { watch, setValue, formState: { errors } } = useFormContext();
    const prestations = watch("prestationsPrincipales") || [];
    const optionsChoisies = watch("optionsServices") || [];

    const handlePrestationToggle = (value: string) => {
        if (prestations.includes(value)) {
            setValue("prestationsPrincipales", prestations.filter((p: string) => p !== value), { shouldValidate: true });
        } else {
            setValue("prestationsPrincipales", [...prestations, value], { shouldValidate: true });
        }
    };

    const handleOptionToggle = (value: string) => {
        if (optionsChoisies.includes(value)) {
            setValue("optionsServices", optionsChoisies.filter((o: string) => o !== value), { shouldValidate: true });
        } else {
            setValue("optionsServices", [...optionsChoisies, value], { shouldValidate: true });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-lato">
            <div className="mb-6">
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2">2. Prestations & Accompagnement</h2>
                <p className="text-sm text-[#1E1E1E]/80 mb-6 font-lato">Précisez les prestations principales que vous assurez lors de l'événement.</p>
            </div>

            <div className="space-y-6 bg-[#EBE6DA] p-6 rounded-2xl border border-[#D4D2CF]/50">
                <div>
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-4">Prestations principales (Cochez minimum 1) *</label>
                    <div className="flex flex-col gap-3">
                        {PRESTATIONS.map(prestation => {
                            const isSelected = prestations.includes(prestation.value);
                            return (
                                <div
                                    key={prestation.value}
                                    onClick={() => handlePrestationToggle(prestation.value)}
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
                                    <span className="leading-tight">{prestation.label}</span>
                                </div>
                            );
                        })}
                    </div>
                    {errors.prestationsPrincipales && (
                        <p className="text-red-500 text-xs mt-2">{errors.prestationsPrincipales.message as string}</p>
                    )}
                </div>

                <div className="pt-4 border-t border-[#D4D2CF]/50">
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-4">Options et Services complémentaires</label>
                    <div className="flex flex-col gap-3">
                        {OPTIONS_SERVICES.map(option => {
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
            </div>
        </div>
    );
}
