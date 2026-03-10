import React from "react";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";

export default function FleetStep() {
    const { watch, setValue, formState: { errors } } = useFormContext();
    const prestations = watch("prestations");

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-lato">
            <div className="mb-6">
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2">2. Prestations & Flotte</h2>
                <p className="text-sm text-[#1E1E1E]/80 mb-6 font-lato">Proposez-vous des chauffeurs et quels types de véhicules spécifiques avez-vous ?</p>
            </div>

            <div className="space-y-6 bg-[#EBE6DA] p-6 rounded-2xl border border-[#D4D2CF]/50">

                <div>
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-4">Mode de location (Au moins 1 requis) *</label>
                    <div className="flex flex-col gap-3">
                        <div
                            onClick={() => setValue("prestations.locationAvecChauffeur", !prestations.locationAvecChauffeur, { shouldValidate: true })}
                            className={cn(
                                "min-h-[48px] px-4 py-2 rounded-xl border cursor-pointer transition-all flex items-center gap-3 text-sm font-bold",
                                prestations.locationAvecChauffeur
                                    ? "border-[#B79A63] bg-[#F8F5F0] text-[#1E1E1E]"
                                    : "border-[#D4D2CF] bg-white text-[#1E1E1E]/70 hover:border-[#B79A63]"
                            )}
                        >
                            <div className={cn("w-4 h-4 border rounded bg-white flex items-center justify-center flex-shrink-0", prestations.locationAvecChauffeur ? "border-[#B79A63] bg-[#B79A63]" : "border-[#D4D2CF]")}>
                                {prestations.locationAvecChauffeur && <div className="w-2 h-2 rounded-[1px] bg-white" />}
                            </div>
                            <span className="leading-tight">Location avec chauffeur (Le chauffeur conduit les mariés)</span>
                        </div>
                        <div
                            onClick={() => setValue("prestations.locationSansChauffeur", !prestations.locationSansChauffeur, { shouldValidate: true })}
                            className={cn(
                                "min-h-[48px] px-4 py-2 rounded-xl border cursor-pointer transition-all flex items-center gap-3 text-sm font-bold",
                                prestations.locationSansChauffeur
                                    ? "border-[#B79A63] bg-[#F8F5F0] text-[#1E1E1E]"
                                    : "border-[#D4D2CF] bg-white text-[#1E1E1E]/70 hover:border-[#B79A63]"
                            )}
                        >
                            <div className={cn("w-4 h-4 border rounded bg-white flex items-center justify-center flex-shrink-0", prestations.locationSansChauffeur ? "border-[#B79A63] bg-[#B79A63]" : "border-[#D4D2CF]")}>
                                {prestations.locationSansChauffeur && <div className="w-2 h-2 rounded-[1px] bg-white" />}
                            </div>
                            <span className="leading-tight">Location sans chauffeur (Les mariés/proches conduisent la voiture)</span>
                        </div>
                    </div>
                </div>

                {errors.prestations && (
                    <div className="bg-red-50 p-4 rounded-xl border border-red-200 mt-4">
                        <p className="text-red-600 text-xs font-bold w-full">{errors.prestations.message as string}</p>
                    </div>
                )}

                <div className="pt-4 border-t border-[#D4D2CF]/50">
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-4">Types de véhicules spécifiques (Optionnel)</label>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#D4D2CF]">
                            <div>
                                <label className="font-bold text-[#1E1E1E]">Véhicules Vintage / Anciens</label>
                                <p className="text-xs text-[#1E1E1E]/80 mt-1">Vous proposez des véhicules d'époque (ex: Traction, Coccinelle...).</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    onChange={(e) => setValue("prestations.vehiculesVintage", e.target.checked)}
                                    checked={watch("prestations.vehiculesVintage")}
                                />
                                <div className="w-11 h-6 bg-[#D4D2CF] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B79A63]"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#D4D2CF]">
                            <div>
                                <label className="font-bold text-[#1E1E1E]">Véhicules Utilitaires (Logistique)</label>
                                <p className="text-xs text-[#1E1E1E]/80 mt-1">Fourgons ou camions pour le transport de matériel (traiteur, déco...).</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    onChange={(e) => setValue("prestations.vehiculesUtilitaires", e.target.checked)}
                                    checked={watch("prestations.vehiculesUtilitaires")}
                                />
                                <div className="w-11 h-6 bg-[#D4D2CF] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B79A63]"></div>
                            </label>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
