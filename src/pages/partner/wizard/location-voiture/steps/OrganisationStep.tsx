import React from "react";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";

export default function OrganisationStep() {
    const { watch, setValue, formState: { errors } } = useFormContext();
    const organisation = watch("organisation");
    const servicesComplementaires = watch("servicesComplementaires") || [];

    const handleServiceToggle = (service: string) => {
        if (servicesComplementaires.includes(service)) {
            setValue("servicesComplementaires", servicesComplementaires.filter((s: string) => s !== service));
        } else {
            setValue("servicesComplementaires", [...servicesComplementaires, service]);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-lato">
            <div className="mb-6">
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2">3. Organisation & Services</h2>
                <p className="text-sm text-[#1E1E1E]/80 mb-6 font-lato">Comment mettez-vous à disposition vos véhicules et quels extras proposez-vous ?</p>
            </div>

            <div className="space-y-6 bg-[#EBE6DA] p-6 rounded-2xl border border-[#D4D2CF]/50">

                <div>
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-4">Formats de mise à disposition (Au moins 1 requis) *</label>
                    <div className="flex flex-col gap-3">
                        <div
                            onClick={() => setValue("organisation.dispoHeure", !organisation.dispoHeure, { shouldValidate: true })}
                            className={cn(
                                "min-h-[48px] px-4 py-2 rounded-xl border cursor-pointer transition-all flex items-center gap-3 text-sm font-bold",
                                organisation.dispoHeure
                                    ? "border-[#B79A63] bg-[#F8F5F0] text-[#1E1E1E]"
                                    : "border-[#D4D2CF] bg-white text-[#1E1E1E]/70 hover:border-[#B79A63]"
                            )}
                        >
                            <div className={cn("w-4 h-4 border rounded bg-white flex items-center justify-center flex-shrink-0", organisation.dispoHeure ? "border-[#B79A63] bg-[#B79A63]" : "border-[#D4D2CF]")}>
                                {organisation.dispoHeure && <div className="w-2 h-2 rounded-[1px] bg-white" />}
                            </div>
                            <span className="leading-tight">À l'heure (Cortège uniquement, mairie...)</span>
                        </div>
                        <div
                            onClick={() => setValue("organisation.dispoDemiJournee", !organisation.dispoDemiJournee, { shouldValidate: true })}
                            className={cn(
                                "min-h-[48px] px-4 py-2 rounded-xl border cursor-pointer transition-all flex items-center gap-3 text-sm font-bold",
                                organisation.dispoDemiJournee
                                    ? "border-[#B79A63] bg-[#F8F5F0] text-[#1E1E1E]"
                                    : "border-[#D4D2CF] bg-white text-[#1E1E1E]/70 hover:border-[#B79A63]"
                            )}
                        >
                            <div className={cn("w-4 h-4 border rounded bg-white flex items-center justify-center flex-shrink-0", organisation.dispoDemiJournee ? "border-[#B79A63] bg-[#B79A63]" : "border-[#D4D2CF]")}>
                                {organisation.dispoDemiJournee && <div className="w-2 h-2 rounded-[1px] bg-white" />}
                            </div>
                            <span className="leading-tight">Demi-journée (Soirée ou après-midi)</span>
                        </div>
                        <div
                            onClick={() => setValue("organisation.dispoJournee", !organisation.dispoJournee, { shouldValidate: true })}
                            className={cn(
                                "min-h-[48px] px-4 py-2 rounded-xl border cursor-pointer transition-all flex items-center gap-3 text-sm font-bold",
                                organisation.dispoJournee
                                    ? "border-[#B79A63] bg-[#F8F5F0] text-[#1E1E1E]"
                                    : "border-[#D4D2CF] bg-white text-[#1E1E1E]/70 hover:border-[#B79A63]"
                            )}
                        >
                            <div className={cn("w-4 h-4 border rounded bg-white flex items-center justify-center flex-shrink-0", organisation.dispoJournee ? "border-[#B79A63] bg-[#B79A63]" : "border-[#D4D2CF]")}>
                                {organisation.dispoJournee && <div className="w-2 h-2 rounded-[1px] bg-white" />}
                            </div>
                            <span className="leading-tight">À la journée (Du matin jusqu'à la fin de la fête)</span>
                        </div>
                    </div>
                    {errors.organisation && (
                        <p className="text-red-500 text-xs mt-2">{errors.organisation.message as string}</p>
                    )}
                </div>

                <div className="pt-4 border-t border-[#D4D2CF]/50">
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-4">Logistique de la voiture</label>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#D4D2CF]">
                            <div>
                                <label className="font-bold text-[#1E1E1E]">Prise en charge au lieu choisi par le client</label>
                                <p className="text-xs text-[#1E1E1E]/80 mt-1">Vous amenez et récupérez la voiture là où le client le souhaite.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    onChange={(e) => setValue("organisation.priseEnChargeLieuChoisi", e.target.checked)}
                                    checked={watch("organisation.priseEnChargeLieuChoisi")}
                                />
                                <div className="w-11 h-6 bg-[#D4D2CF] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B79A63]"></div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-[#D4D2CF]/50">
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-4">Services complémentaires (Optionnels)</label>
                    <div className="flex flex-col gap-3">
                        {["Décoration du véhicule (Fleurs, nœuds...)", "Présence prolongée (Heures sup' le jour J)", "Véhicule de remplacement (En cas de panne)"].map((service) => {
                            const isSelected = servicesComplementaires.includes(service);
                            return (
                                <div
                                    key={service}
                                    onClick={() => handleServiceToggle(service)}
                                    className={cn(
                                        "min-h-[40px] px-4 py-2 rounded-xl border cursor-pointer transition-all flex items-center gap-3 text-sm font-bold",
                                        isSelected
                                            ? "border-[#B79A63] bg-[#F8F5F0] text-[#1E1E1E]"
                                            : "border-[#D4D2CF] bg-white text-[#1E1E1E]/70 hover:border-[#B79A63]"
                                    )}
                                >
                                    <div className={cn("w-4 h-4 border rounded bg-white flex items-center justify-center flex-shrink-0", isSelected ? "border-[#B79A63] bg-[#B79A63]" : "border-[#D4D2CF]")}>
                                        {isSelected && <div className="w-2 h-2 rounded-[1px] bg-white" />}
                                    </div>
                                    <span className="leading-tight">{service}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}
