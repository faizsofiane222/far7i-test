import React, { useState, useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Wilaya {
    id: string;
    name: string;
    code: string;
}

export default function LogisticsStep() {
    const { setValue, formState: { errors } } = useFormContext();
    const [wilayas, setWilayas] = useState<Wilaya[]>([]);
    const [loadingWilayas, setLoadingWilayas] = useState(true);

    const deplacementPossible = useWatch({ name: "deplacementPossible" });
    const wilayasDeplacement = useWatch({ name: "wilayasDeplacement" }) || [];

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

    const toggleWilaya = (id: string) => {
        if (wilayasDeplacement.includes(id)) {
            setValue("wilayasDeplacement", wilayasDeplacement.filter((w: string) => w !== id), { shouldValidate: true });
        } else {
            setValue("wilayasDeplacement", [...wilayasDeplacement, id], { shouldValidate: true });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-lato">
            <div className="mb-6">
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2">3. Déplacement & Logistique</h2>
                <p className="text-sm text-[#1E1E1E]/80 mb-6 font-lato">Définissez vos zones d'intervention.</p>
            </div>

            <div className="space-y-6 bg-[#EBE6DA] p-6 rounded-2xl border border-[#D4D2CF]/50">
                <div className="flex items-center justify-between p-4 bg-white border border-[#D4D2CF] rounded-xl hover:border-[#B79A63] transition-colors cursor-pointer"
                    onClick={() => setValue("deplacementPossible", !deplacementPossible, { shouldValidate: true })}>
                    <div>
                        <span className="block font-bold text-sm text-[#1E1E1E]">Déplacements possibles</span>
                        <span className="text-xs text-[#1E1E1E]/70 font-lato mt-1 block">Acceptez-vous de vous déplacer hors de votre wilaya ?</span>
                    </div>
                    <div className={cn("w-12 h-6 rounded-full transition-colors relative flex-shrink-0", deplacementPossible ? "bg-[#B79A63]" : "bg-[#D4D2CF]/80")}>
                        <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all", deplacementPossible ? "left-7" : "left-1")} />
                    </div>
                </div>

                {deplacementPossible && (
                    <div className="pt-4 animate-in fade-in duration-300">
                        <label className="block text-sm font-bold text-[#1E1E1E] mb-4">Wilayas de déplacement (Min 1) *</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {loadingWilayas ? (
                                <div className="col-span-full flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-[#B79A63]" /></div>
                            ) : (
                                wilayas.map((w) => {
                                    const isSelected = wilayasDeplacement.includes(w.id);
                                    return (
                                        <div
                                            key={w.id}
                                            onClick={() => toggleWilaya(w.id)}
                                            className={cn(
                                                "p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3",
                                                isSelected
                                                    ? "border-[#B79A63] bg-[#F8F5F0] text-[#1E1E1E]"
                                                    : "border-[#D4D2CF] bg-white text-[#1E1E1E]/70 hover:border-[#B79A63]"
                                            )}
                                        >
                                            <div className={cn("w-4 h-4 border rounded flex items-center justify-center flex-shrink-0", isSelected ? "border-[#B79A63] bg-[#B79A63]" : "border-[#D4D2CF] bg-white")}>
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <span className="text-xs font-bold whitespace-nowrap overflow-hidden text-ellipsis">{w.code} - {w.name}</span>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                        {errors.wilayasDeplacement && <p className="text-red-500 text-xs mt-2">{errors.wilayasDeplacement.message as string}</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
