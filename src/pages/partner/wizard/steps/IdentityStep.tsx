import React, { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { MapPin, Info, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useEventTypes } from "@/hooks/useEventTypes";
import { useWilayas } from "@/hooks/useWilayas";
import { Label } from "@/components/ui/label";


interface Wilaya {
    id: string;
    name: string;
    code: string;
}

export default function IdentityStep() {
    const { register, watch, setValue, formState: { errors } } = useFormContext();
    const { wilayas, loading: loadingWilayas } = useWilayas();
    const { eventTypes, loading: loadingEvents } = useEventTypes();
    const selectedEvents = watch("evenementsAccepte") || [];

    const toggleEvent = (slug: string) => {
        if (selectedEvents.includes(slug)) {
            setValue("evenementsAccepte", selectedEvents.filter((e: string) => e !== slug), { shouldValidate: true });
        } else {
            setValue("evenementsAccepte", [...selectedEvents, slug], { shouldValidate: true });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-lato">
            <div className="mb-6">
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2">1. Identité de l'établissement</h2>
                <p className="text-sm text-[#1E1E1E]/80">Commencez par les informations de base de votre salle des fêtes.</p>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Nom de l'établissement *</label>
                    <input
                        type="text"
                        {...register("commercial_name")}
                        placeholder="Ex: Salle des fêtes El Wouroud"
                        className={cn("w-full h-12 px-4 rounded-xl border bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors", errors.commercial_name ? "border-red-500" : "border-[#D4D2CF]")}
                    />
                    {errors.commercial_name && <p className="text-red-500 text-xs mt-1">{errors.commercial_name.message as string}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Catégorie *</label>
                        <select
                            {...register("category_slug")}
                            className="w-full h-12 px-4 rounded-xl border bg-white border-[#D4D2CF] text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors"
                        >
                            <option value="lieu_de_reception">Salle des fêtes (Lieu de réception)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Wilaya *</label>
                        <select
                            {...register("wilaya_id")}
                            className={cn("w-full h-12 px-4 rounded-xl border bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors", errors.wilaya_id ? "border-red-500" : "border-[#D4D2CF]")}
                            disabled={loadingWilayas}
                        >
                            <option value="">{loadingWilayas ? "Chargement des wilayas..." : "Sélectionnez une wilaya"}</option>
                            {wilayas.map(w => (
                                <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
                            ))}
                        </select>
                        {errors.wilaya_id && <p className="text-red-500 text-xs mt-1">{errors.wilaya_id.message as string}</p>}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Adresse exacte *</label>
                    <input
                        type="text"
                        {...register("address")}
                        placeholder="Ex: 15 Rue de l'Émir Abdelkader..."
                        className={cn("w-full h-12 px-4 rounded-xl border bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors mb-4", errors.address ? "border-red-500" : "border-[#D4D2CF]")}
                    />

                    {/* Mock Google Maps Picker */}
                    <div className="w-full h-48 bg-[#F8F5F0] border border-[#D4D2CF] rounded-xl relative overflow-hidden flex flex-col items-center justify-center">
                        <div className="absolute inset-0 opacity-20 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=algiers&zoom=12&size=600x300&key=MOCK')] bg-cover bg-center"></div>
                        <MapPin className="w-8 h-8 text-[#B79A63] mb-2 z-10" />
                        <p className="text-sm font-bold text-[#1E1E1E] z-10">Cliquer pour placer le repère</p>
                        <p className="text-xs text-[#1E1E1E]/80 z-10 mt-1">La précision aide vos clients à vous trouver via GPS</p>
                    </div>
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message as string}</p>}
                </div>

                <div className="space-y-4">
                    <Label className="text-xs font-bold uppercase tracking-widest text-[#1E1E1E]">Types d'événements couverts *</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {loadingEvents ? (
                            <div className="col-span-full flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-[#B79A63]" />
                            </div>
                        ) : (
                            eventTypes.map(event => (
                                <button
                                    key={event.id}
                                    type="button"
                                    onClick={() => toggleEvent(event.slug)}
                                    className={cn(
                                        "p-4 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all text-center",
                                        selectedEvents.includes(event.slug)
                                            ? "bg-[#1E1E1E] border-[#1E1E1E] text-white"
                                            : "bg-white border-[#D4D2CF] text-[#1E1E1E]/40 hover:border-[#B79A63]"
                                    )}
                                >
                                    {event.label}
                                </button>
                            ))
                        )}
                    </div>
                    {errors.evenementsAccepte && <p className="text-red-500 text-xs mt-2">{errors.evenementsAccepte.message as string}</p>}
                </div>

                <div className="pt-4 border-t border-[#D4D2CF]">
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Description / Présentation du lieu</label>
                    <p className="text-xs text-[#1E1E1E]/80 mb-3"><Info className="inline w-3 h-3 mr-1" /> Indiquez vos points forts, l'ambiance, ou tout ce qui rend votre salle unique.</p>
                    <textarea
                        {...register("bio")}
                        rows={4}
                        className="w-full p-4 rounded-xl border border-[#D4D2CF] bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors resize-none"
                        placeholder="Présentez votre établissement en quelques lignes..."
                    />
                </div>
            </div>
        </div>
    );
}
