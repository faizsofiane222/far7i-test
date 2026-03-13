import React, { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { MapPin, Info, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

import { useEventTypes } from "@/hooks/useEventTypes";
import GoogleMapsLocator from "@/components/ui/GoogleMapsLocator";

interface Wilaya {
    id: string;
    name: string;
    code: string;
}

export default function IdentityStep() {
    const { register, watch, setValue, formState: { errors } } = useFormContext();
    const selectedEvents = watch("events_accepted") || [];
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

    const toggleEvent = (slug: string) => {
        if (selectedEvents.includes(slug)) {
            setValue("events_accepted", selectedEvents.filter((e: string) => e !== slug), { shouldValidate: true });
        } else {
            setValue("events_accepted", [...selectedEvents, slug], { shouldValidate: true });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-lato">
            <div className="mb-6">
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2">1. Identité & Présentation</h2>
                <p className="text-sm text-[#1E1E1E]/80 mb-6">Faites briller votre service. Comment souhaitez-vous être présenté(e) ?</p>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Nom du traiteur / Établissement *</label>
                    <input
                        type="text"
                        {...register("commercial_name")}
                        placeholder="Ex: Traiteur D'Or"
                        className={cn("w-full h-12 px-4 rounded-xl border bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors", errors.commercial_name ? "border-red-500" : "border-[#D4D2CF]")}
                    />
                    <p className="text-xs text-[#1E1E1E]/80 mt-2">Le nom sous lequel les clients vous trouveront sur la plateforme.</p>
                    {errors.commercial_name && <p className="text-red-500 text-xs mt-1">{errors.commercial_name.message as string}</p>}
                </div>

                <div>
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Zone d'activité principale (Wilaya) *</label>
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
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Adresse de votre local / cuisine (Optionnel)</label>
                    <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-[#D4D2CF] mb-4">
                        <GoogleMapsLocator
                            value={typeof watch("address") === 'string' ? { address: watch("address"), lat: null, lng: null } : watch("address")}
                            onChange={(location) => setValue("address", location, { shouldValidate: true })}
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-[#D4D2CF]">
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-4">Événements couverts par vos services *</label>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {loadingEvents ? (
                            <div className="col-span-full flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-[#B79A63]" />
                            </div>
                        ) : (
                            eventTypes.map(event => {
                                const isSelected = selectedEvents.includes(event.slug);
                                return (
                                    <div
                                        key={event.id}
                                        onClick={() => toggleEvent(event.slug)}
                                        className={cn(
                                            "px-4 py-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-sm font-bold",
                                            isSelected
                                                ? "border-[#B79A63] bg-[#B79A63]/10 text-[#B79A63]"
                                                : "border-[#D4D2CF] bg-white text-[#1E1E1E] hover:border-[#B79A63]"
                                        )}
                                    >
                                        <span>{event.label}</span>
                                        {isSelected && <Check className="w-4 h-4" />}
                                    </div>
                                );
                            })
                        )}
                    </div>
                    {errors.events_accepted && <p className="text-red-500 text-xs mt-2">{errors.events_accepted.message as string}</p>}
                </div>

                <div className="pt-4 border-t border-[#D4D2CF]">
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Description / Présentation du service</label>
                    <p className="text-xs text-[#1E1E1E]/80 mb-3"><Info className="inline w-3 h-3 mr-1" /> Parlez de vos menus phares et de votre expérience.</p>
                    <textarea
                        {...register("bio")}
                        rows={4}
                        className="w-full p-4 rounded-xl border border-[#D4D2CF] bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors resize-none"
                        placeholder="Présentez votre service en quelques lignes..."
                    />
                </div>
            </div>
        </div>
    );
}
