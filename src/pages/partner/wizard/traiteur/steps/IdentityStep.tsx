import React, { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { MapPin, Info, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const EVENT_TYPES = [
    { id: "mariage", label: "Mariage" },
    { id: "fiancailles", label: "Fiançailles" },
    { id: "khetba", label: "Khetba" },
    { id: "soutenance", label: "Soutenance" },
    { id: "circoncision", label: "Circoncision (Thara)" },
    { id: "anniversaire", label: "Anniversaire" },
    { id: "professionnel", label: "Événement d'entreprise" },
];

interface Wilaya {
    id: string;
    name: string;
    code: string;
}

export default function IdentityStep() {
    const { register, watch, setValue, formState: { errors } } = useFormContext();
    const events = watch("evenementsAccepte") || [];
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

    const handleEventToggle = (id: string) => {
        if (events.includes(id)) {
            setValue("evenementsAccepte", events.filter((e: string) => e !== id), { shouldValidate: true });
        } else {
            setValue("evenementsAccepte", [...events, id], { shouldValidate: true });
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
                        {...register("nom")}
                        placeholder="Ex: Les Délices de Safia"
                        className={cn("w-full h-12 px-4 rounded-xl border bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors", errors.nom ? "border-red-500" : "border-[#D4D2CF]")}
                    />
                    <p className="text-xs text-[#1E1E1E]/80 mt-2">Le nom sous lequel les clients vous trouveront sur la plateforme.</p>
                    {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom.message as string}</p>}
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
                    <input
                        type="text"
                        {...register("adresse")}
                        placeholder="Ex: 15 Rue de l'Émir Abdelkader..."
                        className={cn("w-full h-12 px-4 rounded-xl border bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors mb-4", errors.adresse ? "border-red-500" : "border-[#D4D2CF]")}
                    />

                    {/* Mock Google Maps Picker */}
                    <div className="w-full h-48 bg-[#F8F5F0] border border-[#D4D2CF] rounded-xl relative overflow-hidden flex flex-col items-center justify-center">
                        <div className="absolute inset-0 opacity-20 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=algiers&zoom=12&size=600x300&key=MOCK')] bg-cover bg-center"></div>
                        <MapPin className="w-8 h-8 text-[#B79A63] mb-2 z-10" />
                        <p className="text-sm font-bold text-[#1E1E1E] z-10">Cliquer pour placer le repère</p>
                        <p className="text-xs text-[#1E1E1E]/80 z-10 mt-1">Sert uniquement à rassurer vos futurs clients sur votre localisation.</p>
                    </div>
                </div>

                <div className="pt-4 border-t border-[#D4D2CF]">
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-4">Événements couverts par vos services *</label>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {EVENT_TYPES.map(event => {
                            const isSelected = events.includes(event.id);
                            return (
                                <div
                                    key={event.id}
                                    onClick={() => handleEventToggle(event.id)}
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
                        })}
                    </div>
                    {errors.evenementsAccepte && <p className="text-red-500 text-xs mt-2">{errors.evenementsAccepte.message as string}</p>}
                </div>

                <div className="pt-4 border-t border-[#D4D2CF]">
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Présentation globale</label>
                    <textarea
                        {...register("description")}
                        rows={5}
                        className="w-full p-4 rounded-xl border border-[#D4D2CF] bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors resize-none"
                        placeholder="Racontez votre histoire, votre passion pour la gastronomie, votre approche des ingrédients naturels..."
                    />
                    <p className="text-xs text-[#1E1E1E]/80 mt-2 flex items-center gap-1">
                        <Info className="w-4 h-4 text-[#B79A63] flex-shrink-0" /> Détaillez ce qui fait votre différence (expérience, certification halal stricte, originalité...).
                    </p>
                </div>
            </div>
        </div>
    );
}
