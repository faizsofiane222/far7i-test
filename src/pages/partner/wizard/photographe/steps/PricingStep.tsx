import React, { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Coins, AlertCircle, MapPin, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Wilaya {
    id: string;
    name: string;
    code: string;
}

export default function PricingStep() {
    const { register, watch, setValue, formState: { errors } } = useFormContext();

    const deplacementPossible = watch("deplacementPossible");
    const wilayasDeplacement = watch("wilayasDeplacement") || [];

    const [wilayas, setWilayas] = useState<Wilaya[]>([]);

    useEffect(() => {
        const fetchWilayas = async () => {
            const { data } = await supabase.from('wilayas').select('id, name, code').eq('active', true).order('code');
            if (data) setWilayas(data);
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
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2 flex items-center gap-2">
                    <Coins className="w-5 h-5 text-[#B79A63]" /> 4. Déplacement & Tarification
                </h2>
                <p className="text-sm text-[#1E1E1E]/80 mb-6">Informez les clients sur vos conditions tarifaires de base.</p>
            </div>

            <div className="bg-[#EBE6DA] border border-[#D4D2CF] rounded-xl p-4 flex items-start gap-3 mb-8">
                <AlertCircle className="w-5 h-5 text-[#B79A63] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#1E1E1E]/80">
                    <strong className="text-[#1E1E1E]">Ce prix est indicatif.</strong> Le prix final peut varier selon la durée, le moment (journée/soirée), la saison, l'urgence et le déplacement.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Prix de base */}
                <div className="bg-white p-6 rounded-2xl border border-[#D4D2CF] shadow-sm relative overflow-hidden group focus-within:border-[#B79A63] transition-colors">
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2 relative z-10">Tarif de base estimatif (À partir de) *</label>
                    <div className="relative z-10">
                        <input
                            type="number"
                            {...register("prixAPartirDeDA", { valueAsNumber: true })}
                            className={cn("w-full h-14 pl-4 pr-16 rounded-xl border bg-[#F8F5F0] text-xl font-bold text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] focus:bg-white transition-all", errors.prixAPartirDeDA ? "border-red-500" : "border-[#D4D2CF]")}
                            placeholder="0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#1E1E1E]/40">DA</span>
                    </div>
                    <p className="text-xs text-[#1E1E1E]/60 mt-2 relative z-10">Votre offre d'appel la plus abordable (ex: Couverture minimale, peu de livrables).</p>
                    {errors.prixAPartirDeDA && <p className="text-red-500 text-xs mt-1 relative z-10">{errors.prixAPartirDeDA.message as string}</p>}
                </div>

                {/* Acompte */}
                <div className="bg-white p-6 rounded-2xl border border-[#D4D2CF] shadow-sm relative overflow-hidden group focus-within:border-[#B79A63] transition-colors">
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2 relative z-10">Acompte / Avance exigée</label>
                    <div className="relative z-10">
                        <input
                            type="number"
                            {...register("acompteMontantDA", { valueAsNumber: true })}
                            className={cn("w-full h-14 pl-4 pr-16 rounded-xl border bg-[#F8F5F0] text-xl font-bold text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] focus:bg-white transition-all", errors.acompteMontantDA ? "border-red-500" : "border-[#D4D2CF]")}
                            placeholder="0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#1E1E1E]/40">DA</span>
                    </div>
                    <p className="text-xs text-[#1E1E1E]/60 mt-2 relative z-10">Pour bloquer la date de la séance ou de l'événement.</p>
                </div>
            </div>

            <div className="pt-8 border-t border-[#D4D2CF]">
                <div
                    className={cn("border p-6 rounded-2xl cursor-pointer transition-all flex flex-col justify-center mb-6", deplacementPossible ? "border-[#B79A63] bg-white shadow-sm" : "border-[#D4D2CF] bg-[#F8F5F0]")}
                    onClick={() => setValue("deplacementPossible", !deplacementPossible, { shouldValidate: true })}
                >
                    <div className="flex items-center gap-3">
                        <input type="checkbox" checked={deplacementPossible} readOnly className="w-5 h-5 accent-[#B79A63] pointer-events-none" />
                        <span className="text-base font-bold text-[#1E1E1E] flex items-center gap-2"><Truck className="w-4 h-4 text-[#B79A63]" /> J'accepte de me déplacer hors de ma wilaya</span>
                    </div>
                </div>

                {deplacementPossible && (
                    <div className="bg-white p-6 rounded-2xl border border-[#B79A63]/50 shadow-sm animate-in slide-in-from-top-4">
                        <h3 className="text-sm font-bold text-[#1E1E1E] flex items-center gap-2 mb-4">
                            <MapPin className="w-4 h-4 text-[#B79A63]" /> Sélectionnez les wilayas couvertes *
                        </h3>
                        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2 max-h-[250px] overflow-y-auto p-2 border border-[#D4D2CF] rounded-xl bg-[#F8F5F0]">
                            {wilayas.map(w => (
                                <button
                                    key={w.id}
                                    type="button"
                                    onClick={() => toggleWilaya(w.id)}
                                    className={cn(
                                        "px-2 py-2 rounded-lg border text-[10px] font-bold transition-all text-left",
                                        wilayasDeplacement.includes(w.id) ? "bg-[#B79A63] text-white border-[#B79A63] shadow-sm" : "bg-white border-[#D4D2CF] text-[#1E1E1E] hover:border-[#B79A63]/50"
                                    )}
                                >
                                    {w.code} - {w.name}
                                </button>
                            ))}
                        </div>
                        {errors.wilayasDeplacement && <p className="text-red-500 text-xs mt-2">{errors.wilayasDeplacement.message as string}</p>}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-[#D4D2CF]">
                <div>
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Délais moyens de livraison</label>
                    <div className="relative">
                        <input
                            type="number"
                            {...register("delaisLivraisonSemaines", { valueAsNumber: true })}
                            className={cn("w-full h-12 pl-4 pr-24 rounded-xl border bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors", errors.delaisLivraisonSemaines ? "border-red-500" : "border-[#D4D2CF]")}
                            min={1}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#1E1E1E]/60 text-sm">Semaines</span>
                    </div>
                    {errors.delaisLivraisonSemaines && <p className="text-red-500 text-xs mt-1">{errors.delaisLivraisonSemaines.message as string}</p>}
                </div>

                <div>
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Politique d'annulation / Modalités de paiement</label>
                    <textarea
                        {...register("politiqueAnnulation")}
                        rows={3}
                        placeholder="Ex: L'acompte n'est pas remboursé..."
                        className="w-full p-4 rounded-xl border border-[#D4D2CF] bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors resize-none text-sm"
                    />
                </div>
            </div>

        </div>
    );
}
