import React from "react";
import { useFormContext } from "react-hook-form";
import { Truck, Users, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LogisticsStep() {
    const { register, watch, setValue } = useFormContext();

    const livraisonPossible = watch("livraisonPossible");
    const serviceSurPlace = watch("serviceSurPlace");

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-lato">
            <div className="mb-6">
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-[#B79A63]" /> 3. Logistique & Équipements
                </h2>
                <p className="text-sm text-[#1E1E1E]/80 mb-6">Précisez comment vous intervenez et quel matériel vous pouvez fournir.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                    className={cn("border p-6 rounded-2xl cursor-pointer transition-all flex flex-col justify-center", livraisonPossible ? "border-[#B79A63] bg-white shadow-md relative overflow-hidden" : "border-[#D4D2CF] bg-[#F8F5F0]")}
                    onClick={() => setValue("livraisonPossible", !livraisonPossible)}
                >
                    {livraisonPossible && <div className="absolute top-0 left-0 w-1 h-full bg-[#B79A63]" />}
                    <div className="flex items-center gap-3">
                        <input type="checkbox" checked={livraisonPossible} readOnly className="w-5 h-5 accent-[#B79A63] pointer-events-none" />
                        <span className="text-base font-bold text-[#1E1E1E]">Livraison Possible</span>
                    </div>
                    <p className="text-xs text-[#1E1E1E]/80 mt-2 ml-8">Vous déposez les plats sur le lieu de réception.</p>
                </div>

                <div
                    className={cn("border p-6 rounded-2xl cursor-pointer transition-all flex flex-col justify-center", serviceSurPlace ? "border-[#B79A63] bg-[#B79A63]/5 shadow-md relative overflow-hidden" : "border-[#D4D2CF] bg-[#F8F5F0]")}
                    onClick={() => setValue("serviceSurPlace", !serviceSurPlace)}
                >
                    {serviceSurPlace && <div className="absolute top-0 left-0 w-1 h-full bg-[#B79A63]" />}
                    <div className="flex items-center gap-3">
                        <input type="checkbox" checked={serviceSurPlace} readOnly className="w-5 h-5 accent-[#B79A63] pointer-events-none" />
                        <span className="text-base font-bold text-[#1E1E1E]">Service sur place</span>
                    </div>
                    <p className="text-xs text-[#1E1E1E]/80 mt-2 ml-8">Vous gérez la présentation, le service ou la cuisine durant l'événement.</p>
                </div>
            </div>

            {serviceSurPlace && (
                <div className="bg-white p-6 rounded-2xl border border-[#B79A63]/50 space-y-6 animate-in slide-in-from-top-4">
                    <h3 className="text-sm font-bold text-[#1E1E1E] flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#B79A63]" /> Options de service sur place
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Personnel */}
                        <div>
                            <p className="text-xs font-bold text-[#1E1E1E]/60 uppercase tracking-wider mb-3">Personnel</p>
                            <label className="flex items-center gap-3 cursor-pointer p-3 border border-[#D4D2CF] bg-[#F8F5F0] rounded-xl hover:border-[#B79A63] transition-colors mb-3">
                                <input type="checkbox" {...register("personnelDeService")} className="w-5 h-5 accent-[#B79A63] rounded" />
                                <span className="text-sm font-bold text-[#1E1E1E]">Personnel de service (Serveurs)</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer p-3 border border-[#D4D2CF] bg-[#F8F5F0] rounded-xl hover:border-[#B79A63] transition-colors">
                                <input type="checkbox" {...register("maitreDHotel")} className="w-5 h-5 accent-[#B79A63] rounded" />
                                <span className="text-sm font-bold text-[#1E1E1E]">Maître d'hôtel / Chef de salle</span>
                            </label>
                        </div>

                        {/* Mise en place */}
                        <div>
                            <p className="text-xs font-bold text-[#1E1E1E]/60 uppercase tracking-wider mb-3">Mise en place</p>
                            <label className="flex items-center gap-3 cursor-pointer p-3 border border-[#D4D2CF] bg-[#F8F5F0] rounded-xl hover:border-[#B79A63] transition-colors mb-3">
                                <input type="checkbox" {...register("dressageTables")} className="w-5 h-5 accent-[#B79A63] rounded" />
                                <span className="text-sm font-bold text-[#1E1E1E]">Dressage des tables complet</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer p-3 border border-[#D4D2CF] bg-[#F8F5F0] rounded-xl hover:border-[#B79A63] transition-colors">
                                <input type="checkbox" {...register("decorationSimple")} className="w-5 h-5 accent-[#B79A63] rounded" />
                                <span className="text-sm font-bold text-[#1E1E1E]">Décoration florale/bougies (simple)</span>
                            </label>
                        </div>

                        {/* Après événement */}
                        <div>
                            <p className="text-xs font-bold text-[#1E1E1E]/60 uppercase tracking-wider mb-3">Après événement</p>
                            <label className="flex items-center gap-3 cursor-pointer p-3 border border-[#D4D2CF] bg-[#F8F5F0] rounded-xl hover:border-[#B79A63] transition-colors">
                                <input type="checkbox" {...register("nettoyage")} className="w-5 h-5 accent-[#B79A63] rounded" />
                                <span className="text-sm font-bold text-[#1E1E1E]">Nettoyage (Espace traiteur / Tables)</span>
                            </label>
                        </div>
                    </div>
                </div>
            )}

            <div className="pt-8 border-t border-[#D4D2CF]">
                <h3 className="text-lg font-serif font-bold text-[#1E1E1E] mb-4 flex items-center gap-2">
                    <LayoutList className="w-5 h-5 text-[#B79A63]" /> Location de Matériel (Même sans service)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    {[
                        { id: 'locationVaisselle', label: 'Fourniture de Vaisselle' },
                        { id: 'locationCouverts', label: 'Fourniture de Couverts / Verres' },
                        { id: 'locationNappes', label: 'Fourniture de Nappes et Serviettes' }
                    ].map(mat => {
                        const isChecked = watch(mat.id);
                        return (
                            <label key={mat.id} className={cn("flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all", isChecked ? "border-[#B79A63] bg-white shadow-sm" : "border-[#D4D2CF] bg-[#F8F5F0] hover:border-[#B79A63]")}>
                                <input type="checkbox" {...register(mat.id)} className="w-5 h-5 accent-[#B79A63] rounded" />
                                <span className="text-sm font-bold text-[#1E1E1E]">{mat.label}</span>
                            </label>
                        )
                    })}
                </div>
            </div>

            <div className="pt-6 border-t border-[#D4D2CF]">
                <div
                    className={cn("border p-6 rounded-2xl cursor-pointer transition-all flex flex-col justify-center", watch("gestionAllergies") ? "border-[#B79A63] bg-white shadow-sm" : "border-[#D4D2CF] bg-[#F8F5F0]")}
                    onClick={() => setValue("gestionAllergies", !watch("gestionAllergies"))}
                >
                    <div className="flex items-center gap-3">
                        <input type="checkbox" checked={watch("gestionAllergies")} readOnly className="w-5 h-5 accent-[#B79A63] pointer-events-none" />
                        <span className="text-sm font-bold text-[#1E1E1E]">Gestion des allergies et régimes spécifiques</span>
                    </div>
                    <p className="text-xs text-[#1E1E1E]/80 mt-2 ml-8">Cochez si vous pouvez adapter un menu sans gluten, sans arachide, végétarien, diabétique...</p>
                </div>
            </div>

        </div>
    );
}
