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
    const isInstallationPossibe = watch("installationSurLieu") || false;
    const isLivraisonPossible = watch("livraisonPossible") || false;
    const wilayasLivraison = watch("wilayasLivraison") || [];

    const [wilayas, setWilayas] = useState<Wilaya[]>([]);
    const [loadingWilayas, setLoadingWilayas] = useState(true);

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

    const handleWilayaToggle = (code: string) => {
        if (wilayasLivraison.includes(code)) {
            setValue("wilayasLivraison", wilayasLivraison.filter((w: string) => w !== code), { shouldValidate: true });
        } else {
            setValue("wilayasLivraison", [...wilayasLivraison, code], { shouldValidate: true });
        }
    };

    const handleSelectAllWilayas = () => {
        if (wilayasLivraison.length === wilayas.length) {
            setValue("wilayasLivraison", [], { shouldValidate: true });
        } else {
            setValue("wilayasLivraison", wilayas.map(w => w.code), { shouldValidate: true });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-lato">
            <div className="mb-6">
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2">3. Services & Logistique</h2>
                <p className="text-sm text-[#1E1E1E]/80 mb-6 font-lato">Définissez vos modalités d'installation et de livraison pour vos créations.</p>
            </div>

            <div className="space-y-6 bg-[#EBE6DA] p-6 rounded-2xl border border-[#D4D2CF]/50">

                {/* Installation sur lieu */}
                <div>
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Installation / mise en place sur le lieu</label>
                    <p className="text-xs text-[#1E1E1E]/80 mb-4">Assurez-vous l'installation de la pièce montée directement sur le lieu de réception ?</p>
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                            <input
                                type="checkbox"
                                {...register("installationSurLieu")}
                                className="sr-only"
                            />
                            <div className={cn("block w-14 h-8 rounded-full transition-colors", isInstallationPossibe ? "bg-[#B79A63]" : "bg-[#D4D2CF]")}></div>
                            <div className={cn("absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform", isInstallationPossibe ? "translate-x-6" : "translate-x-0")}></div>
                        </div>
                        <span className="text-sm font-bold text-[#1E1E1E]">{isInstallationPossibe ? 'Oui' : 'Non'}</span>
                    </label>
                </div>

                {/* Livraison Possible */}
                <div className="pt-4 border-t border-[#D4D2CF]/50">
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Livraison possible ?</label>
                    <p className="text-xs text-[#1E1E1E]/80 mb-4">Proposez-vous un service de livraison pour vos clients ?</p>
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                            <input
                                type="checkbox"
                                {...register("livraisonPossible")}
                                className="sr-only"
                            />
                            <div className={cn("block w-14 h-8 rounded-full transition-colors", isLivraisonPossible ? "bg-[#B79A63]" : "bg-[#D4D2CF]")}></div>
                            <div className={cn("absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform", isLivraisonPossible ? "translate-x-6" : "translate-x-0")}></div>
                        </div>
                        <span className="text-sm font-bold text-[#1E1E1E]">{isLivraisonPossible ? 'Oui, je propose la livraison' : 'Non, retrait en boutique uniquement'}</span>
                    </label>

                    {/* Wilayas de livraison */}
                    {isLivraisonPossible && (
                        <div className="mt-6 pt-4 border-t border-[#D4D2CF]/50 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center justify-between mb-4">
                                <label className="block text-sm font-bold text-[#1E1E1E]">Zones de livraison (Wilayas) *</label>
                                <button
                                    type="button"
                                    onClick={handleSelectAllWilayas}
                                    className="text-xs font-bold text-[#B79A63] hover:text-[#1E1E1E] transition-colors uppercase tracking-widest"
                                >
                                    {wilayasLivraison.length === wilayas.length ? "Tout désélectionner" : "58 Wilayas"}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                {loadingWilayas ? (
                                    <div className="col-span-full flex justify-center py-4">
                                        <Loader2 className="w-5 h-5 animate-spin text-[#B79A63]" />
                                    </div>
                                ) : (
                                    wilayas.map((wilaya) => {
                                        const isSelected = wilayasLivraison.includes(wilaya.code);
                                        return (
                                            <div
                                                key={wilaya.id}
                                                onClick={() => handleWilayaToggle(wilaya.code)}
                                                className={cn(
                                                    "px-3 py-2 text-xs font-bold rounded-lg border cursor-pointer transition-all truncate text-center",
                                                    isSelected
                                                        ? "bg-[#B79A63] text-white border-[#B79A63]"
                                                        : "bg-white text-[#1E1E1E]/60 border-[#D4D2CF] hover:border-[#B79A63]"
                                                )}
                                                title={`${wilaya.code} - ${wilaya.name}`}
                                            >
                                                {wilaya.code} - {wilaya.name}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            {errors.wilayasLivraison && (
                                <p className="text-red-500 text-xs mt-2">{errors.wilayasLivraison.message as string}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
