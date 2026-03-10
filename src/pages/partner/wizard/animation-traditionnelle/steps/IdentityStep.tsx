import React, { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useEventTypes } from "@/hooks/useEventTypes";

interface Wilaya {
    id: string;
    name: string;
    code: string;
}

export default function IdentityStep() {
    const { register, watch, setValue, formState: { errors } } = useFormContext();
    const events = watch("evenementsAccepte") || [];
    const { eventTypes, loading: loadingEvents } = useEventTypes();
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

    const handleEventToggle = (slug: string) => {
        if (events.includes(slug)) {
            setValue("evenementsAccepte", events.filter((e: string) => e !== slug), { shouldValidate: true });
        } else {
            setValue("evenementsAccepte", [...events, slug], { shouldValidate: true });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-lato">
            <div className="mb-6">
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2">1. Identité & Présentation</h2>
                <p className="text-sm text-[#1E1E1E]/80 mb-6 font-lato">Faites connaître votre groupe et votre attachement aux traditions.</p>
            </div>

            <div className="space-y-6 bg-[#EBE6DA] p-6 rounded-2xl border border-[#D4D2CF]/50">
                <div>
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Nom du groupe / artiste *</label>
                    <input
                        type="text"
                        {...register("nom")}
                        placeholder="Ex: Troupe El Assala"
                        className={cn("w-full h-12 px-4 rounded-xl border bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors", errors.nom ? "border-red-500" : "border-[#D4D2CF]")}
                    />
                    <p className="text-xs text-[#1E1E1E]/80 mt-2">Le nom historique ou commercial sous lequel on vous sollicite.</p>
                    {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom.message as string}</p>}
                </div>

                <div>
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Wilaya d'origine *</label>
                    <div className="relative">
                        <select
                            {...register("wilaya_id")}
                            className={cn("w-full h-12 pl-4 pr-10 rounded-xl border bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors appearance-none", errors.wilaya_id ? "border-red-500" : "border-[#D4D2CF]")}
                            disabled={loadingWilayas}
                        >
                            <option value="">{loadingWilayas ? "Chargement des wilayas..." : "Sélectionnez une wilaya"}</option>
                            {wilayas.map(w => (
                                <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
                            ))}
                        </select>
                        {loadingWilayas && <Loader2 className="w-4 h-4 animate-spin text-[#B79A63] flex-shrink-0 absolute right-4 top-1/2 -translate-y-1/2" />}
                    </div>
                    {errors.wilaya_id && <p className="text-red-500 text-xs mt-1">{errors.wilaya_id.message as string}</p>}
                </div>

                <div>
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Localisation d'attache</label>
                    <input
                        type="text"
                        {...register("adresse")}
                        placeholder="Ex: Casbah, Alger"
                        className={cn("w-full h-12 px-4 rounded-xl border bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors mb-4", errors.adresse ? "border-red-500" : "border-[#D4D2CF]")}
                    />

                    {/* Mock Google Maps Picker */}
                    <div className="w-full h-32 bg-[#F8F5F0] border border-[#D4D2CF] rounded-xl relative overflow-hidden flex flex-col items-center justify-center">
                        <MapPin className="w-6 h-6 text-[#B79A63] mb-1 z-10" />
                        <p className="text-xs font-bold text-[#1E1E1E] z-10">Cliquer pour marquer la position (Mock Google Maps)</p>
                    </div>
                </div>

                <div className="pt-4 border-t border-[#D4D2CF]/50">
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-4">Types d’événements acceptés (Cochez minimum 1) *</label>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {loadingEvents ? (
                            <div className="col-span-full flex items-center justify-center py-8">
                                <Loader2 className="w-4 h-4 animate-spin text-[#B79A63]" />
                            </div>
                        ) : (
                            eventTypes.map(event => {
                                const isSelected = events.includes(event.slug);
                                return (
                                    <div
                                        key={event.id}
                                        onClick={() => handleEventToggle(event.slug)}
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
                                        <span className="leading-tight">{event.label}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    {errors.evenementsAccepte && <p className="text-red-500 text-xs mt-2">{errors.evenementsAccepte.message as string}</p>}
                </div>

                <div className="pt-4 border-t border-[#D4D2CF]/50">
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Description du groupe</label>
                    <textarea
                        {...register("description")}
                        rows={4}
                        className="w-full p-4 rounded-xl border border-[#D4D2CF] bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors resize-none"
                        placeholder="Racontez votre histoire, l'héritage de votre musique, la composition de votre troupe..."
                    />
                </div>
            </div>
        </div>
    );
}
