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

const SERVICES_BOUTIQUE = [
    { label: "Essayage sur place", value: "essayage" },
    { label: "Retouches légères", value: "retouches" },
    { label: "Accessoires proposés (selon disponibilité)", value: "accessoires" }
];

export default function ServicesStep() {
    const { register, watch, setValue, formState: { errors } } = useFormContext();
    const [wilayas, setWilayas] = useState<Wilaya[]>([]);
    const [loadingWilayas, setLoadingWilayas] = useState(true);

    const services = watch("services") || [];
    const livraisonSurPlace = watch("livraisonSurPlace");
    const wilayasLivraison: string[] = watch("wilayasLivraison") || [];

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

    const handleServiceToggle = (value: string) => {
        if (services.includes(value)) {
            setValue("services", services.filter((s: string) => s !== value), { shouldValidate: true });
        } else {
            setValue("services", [...services, value], { shouldValidate: true });
        }
    };

    const handleWilayaToggle = (wilayaCode: string) => {
        if (wilayasLivraison.includes(wilayaCode)) {
            setValue("wilayasLivraison", wilayasLivraison.filter(w => w !== wilayaCode), { shouldValidate: true });
        } else {
            setValue("wilayasLivraison", [...wilayasLivraison, wilayaCode], { shouldValidate: true });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-lato">
            <div className="mb-6">
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2">3. Services & Logistique</h2>
                <p className="text-sm text-[#1E1E1E]/80 mb-6 font-lato">Détaillez les services offerts et vos options de livraison.</p>
            </div>

            <div className="space-y-6 bg-[#EBE6DA] p-6 rounded-2xl border border-[#D4D2CF]/50">

                <div>
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-4">Services en boutique</label>
                    <div className="flex flex-col gap-3">
                        {SERVICES_BOUTIQUE.map(service => {
                            const isSelected = services.includes(service.value);
                            return (
                                <div
                                    key={service.value}
                                    onClick={() => handleServiceToggle(service.value)}
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
                                    <span className="leading-tight">{service.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Livraison Toggle */}
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#D4D2CF] mt-4">
                    <div>
                        <label className="font-bold text-[#1E1E1E]">Livraison sur place</label>
                        <p className="text-xs text-[#1E1E1E]/80 mt-1">Proposez-vous la livraison de la tenue directement sur le lieu de l'événement ?</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            {...register("livraisonSurPlace")}
                            onChange={(e) => {
                                setValue("livraisonSurPlace", e.target.checked);
                                if (!e.target.checked) {
                                    setValue("wilayasLivraison", []);
                                }
                            }}
                        />
                        <div className="w-11 h-6 bg-[#D4D2CF] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B79A63]"></div>
                    </label>
                </div>

                {/* Conditional Wilayas Grid */}
                {livraisonSurPlace && (
                    <div className="pt-4 border-t border-[#D4D2CF]/50 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-sm font-bold text-[#1E1E1E] mb-4">Wilayas couvertes par la livraison (Cochez minimum 1) *</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {loadingWilayas ? (
                                <div className="col-span-full flex justify-center py-4">
                                    <Loader2 className="w-5 h-5 animate-spin text-[#B79A63]" />
                                </div>
                            ) : (
                                wilayas.map(wilaya => {
                                    const isSelected = wilayasLivraison.includes(wilaya.code);
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
                        {errors.wilayasLivraison && (
                            <p className="text-red-500 text-xs mt-2">{errors.wilayasLivraison.message as string}</p>
                        )}
                        <p className="text-xs text-[#1E1E1E]/80 mt-3 italic flex items-center gap-1">
                            <span className="text-[#B79A63]">*</span> Les frais de livraison sont généralement à la charge du client
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
