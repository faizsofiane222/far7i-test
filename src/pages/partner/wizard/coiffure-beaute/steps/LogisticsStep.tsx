import React, { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Wilaya {
    id: string;
    name: string;
    code: string;
}

export default function LogisticsStep() {
    const { register, watch, setValue, formState: { errors } } = useFormContext();
    const [wilayas, setWilayas] = useState<Wilaya[]>([]);
    const [loadingWilayas, setLoadingWilayas] = useState(true);

    const organisation = watch("organisation");
    const deplacementPossible = watch("deplacementPossible");
    const wilayasDeplacement: string[] = watch("wilayasDeplacement") || [];

    useEffect(() => {
        const fetchWilayas = async () => {
            try {
                const { data } = await supabase
                    .from('wilayas')
                    .select('id, name, code')
                    .eq('active', true)
                    .order('code');

                if (data) setWilayas(data);
            } catch (error) {
                console.error("Error fetching wilayas:", error);
            } finally {
                setLoadingWilayas(false);
            }
        };

        fetchWilayas();
    }, []);

    const handleWilayaToggle = (wilayaCode: string) => {
        if (wilayasDeplacement.includes(wilayaCode)) {
            setValue("wilayasDeplacement", wilayasDeplacement.filter(w => w !== wilayaCode), { shouldValidate: true });
        } else {
            setValue("wilayasDeplacement", [...wilayasDeplacement, wilayaCode], { shouldValidate: true });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-lato">
            <div className="mb-6">
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2">3. Organisation & Logistique</h2>
                <p className="text-sm text-[#1E1E1E]/80 mb-6 font-lato">Où réalisez-vous vos prestations ?</p>
            </div>

            <div className="space-y-6 bg-[#EBE6DA] p-6 rounded-2xl border border-[#D4D2CF]/50">

                <div>
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-4">Mode d'intervention (Au moins 1 requis) *</label>
                    <div className="flex flex-col gap-3">
                        <div
                            onClick={() => setValue("organisation.prestationSalon", !organisation.prestationSalon, { shouldValidate: true })}
                            className={cn(
                                "min-h-[48px] px-4 py-2 rounded-xl border cursor-pointer transition-all flex items-center gap-3 text-sm font-bold",
                                organisation.prestationSalon
                                    ? "border-[#B79A63] bg-[#F8F5F0] text-[#1E1E1E]"
                                    : "border-[#D4D2CF] bg-white text-[#1E1E1E]/70 hover:border-[#B79A63]"
                            )}
                        >
                            <div className={cn("w-4 h-4 border rounded bg-white flex items-center justify-center flex-shrink-0", organisation.prestationSalon ? "border-[#B79A63] bg-[#B79A63]" : "border-[#D4D2CF]")}>
                                {organisation.prestationSalon && <div className="w-2 h-2 rounded-[1px] bg-white" />}
                            </div>
                            <span className="leading-tight">Prestation en Salon (La cliente se déplace)</span>
                        </div>
                        <div
                            onClick={() => {
                                const newValue = !organisation.prestationSurLieu;
                                setValue("organisation.prestationSurLieu", newValue, { shouldValidate: true });
                                if (!newValue) {
                                    setValue("deplacementPossible", false);
                                    setValue("wilayasDeplacement", []);
                                }
                            }}
                            className={cn(
                                "min-h-[48px] px-4 py-2 rounded-xl border cursor-pointer transition-all flex items-center gap-3 text-sm font-bold",
                                organisation.prestationSurLieu
                                    ? "border-[#B79A63] bg-[#F8F5F0] text-[#1E1E1E]"
                                    : "border-[#D4D2CF] bg-white text-[#1E1E1E]/70 hover:border-[#B79A63]"
                            )}
                        >
                            <div className={cn("w-4 h-4 border rounded bg-white flex items-center justify-center flex-shrink-0", organisation.prestationSurLieu ? "border-[#B79A63] bg-[#B79A63]" : "border-[#D4D2CF]")}>
                                {organisation.prestationSurLieu && <div className="w-2 h-2 rounded-[1px] bg-white" />}
                            </div>
                            <span className="leading-tight">Prestation sur le lieu de l'événement (Salle des fêtes, domicile...)</span>
                        </div>
                    </div>
                    {errors.organisation && (
                        <p className="text-red-500 text-xs mt-2">{errors.organisation.message as string}</p>
                    )}
                </div>

                {organisation.prestationSurLieu && (
                    <div className="pt-4 border-t border-[#D4D2CF]/50 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#D4D2CF] mb-4">
                            <div>
                                <label className="font-bold text-[#1E1E1E]">Déplacement hors de votre wilaya</label>
                                <p className="text-xs text-[#1E1E1E]/80 mt-1">Acceptez-vous de vous déplacer dans d'autres wilayas ?</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    {...register("deplacementPossible")}
                                    onChange={(e) => {
                                        setValue("deplacementPossible", e.target.checked);
                                        if (!e.target.checked) setValue("wilayasDeplacement", []);
                                    }}
                                />
                                <div className="w-11 h-6 bg-[#D4D2CF] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B79A63]"></div>
                            </label>
                        </div>

                        {deplacementPossible && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="block text-sm font-bold text-[#1E1E1E] mb-4">Wilayas couvertes (Cochez minimum 1) *</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {loadingWilayas ? (
                                        <div className="col-span-full flex justify-center py-4">
                                            <Loader2 className="w-5 h-5 animate-spin text-[#B79A63]" />
                                        </div>
                                    ) : (
                                        wilayas.map(wilaya => {
                                            const isSelected = wilayasDeplacement.includes(wilaya.code);
                                            return (
                                                <div
                                                    key={wilaya.id}
                                                    onClick={() => handleWilayaToggle(wilaya.code)}
                                                    className={cn(
                                                        "px-3 py-2 rounded-lg border cursor-pointer transition-all flex items-center gap-2 text-xs font-bold",
                                                        isSelected
                                                            ? "border-[#B79A63] bg-[#F8F5F0] text-[#1E1E1E]"
                                                            : "border-[#D4D2CF] bg-white text-[#1E1E1E]/70 hover:border-[#B79A63]"
                                                    )}
                                                >
                                                    <div className={cn("w-3 h-3 border rounded-sm flex items-center justify-center flex-shrink-0", isSelected ? "border-[#B79A63] bg-[#B79A63]" : "border-[#D4D2CF]")}>
                                                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                                                    </div>
                                                    <span className="truncate">{wilaya.code} - {wilaya.name}</span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                                {errors.wilayasDeplacement && (
                                    <p className="text-red-500 text-xs mt-2">{errors.wilayasDeplacement.message as string}</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
