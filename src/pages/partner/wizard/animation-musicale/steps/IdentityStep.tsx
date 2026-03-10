import React from "react";
import { UseFormReturn } from "react-hook-form";
import { AnimationMusicaleFormValues } from "../schema";
import { GildedInput } from "@/components/ui/gilded-input";
import { Label } from "@/components/ui/label";
import { useWilayas } from "@/hooks/useWilayas";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

interface StepProps {
    methods: UseFormReturn<AnimationMusicaleFormValues>;
}

const EVENT_TYPES = [
    { id: "mariage", label: "Mariage" },
    { id: "fiancailles", label: "Fiançailles" },
    { id: "naissance", label: "Naissance" },
    { id: "circoncision", label: "Circoncision" },
    { id: "anniversaire", label: "Anniversaire" },
    { id: "reussite", label: "Fête de réussite" },
    { id: "soutenance", label: "Soutenance" },
    { id: "entreprise", label: "Événement pro" },
];

export default function IdentityStep({ methods }: StepProps) {
    const { register, watch, setValue, formState: { errors } } = methods;
    const { wilayas } = useWilayas();
    const selectedEvents = watch("evenementsAccepte") || [];

    const toggleEvent = (id: string) => {
        const current = [...selectedEvents];
        const index = current.indexOf(id);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(id);
        }
        setValue("evenementsAccepte", current, { shouldValidate: true });
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-2">
                <h2 className="text-3xl font-serif text-[#1E1E1E]">Parlez-nous de vous</h2>
                <p className="text-sm font-sans text-[#1E1E1E]/60">Commençons par les bases de votre activité musicale.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <Label className="text-xs font-bold uppercase tracking-widest text-[#1E1E1E]">Nom de scène / Groupe *</Label>
                    <GildedInput
                        {...register("nom")}
                        placeholder="Ex: DJ Amine, Orchestre El Fen..."
                        className={cn(errors.nom && "border-red-500 focus:ring-red-500/20")}
                    />
                    {errors.nom && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.nom.message}</p>}
                </div>

                <div className="space-y-4">
                    <Label className="text-xs font-bold uppercase tracking-widest text-[#1E1E1E]">Wilaya de base *</Label>
                    <select
                        {...register("wilaya_id")}
                        className={cn(
                            "w-full h-12 rounded-xl border border-[#D4D2CF] bg-white px-4 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#B79A63]/30 focus:border-[#B79A63] transition-all appearance-none cursor-pointer",
                            errors.wilaya_id && "border-red-500 focus:ring-red-500/20"
                        )}
                    >
                        <option value="">Sélectionnez une wilaya</option>
                        {wilayas.map(w => (
                            <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
                        ))}
                    </select>
                    {errors.wilaya_id && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.wilaya_id.message}</p>}
                </div>
            </div>

            <div className="space-y-4">
                <Label className="text-xs font-bold uppercase tracking-widest text-[#1E1E1E]">Types d'événements couverts *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {EVENT_TYPES.map(event => (
                        <button
                            key={event.id}
                            type="button"
                            onClick={() => toggleEvent(event.id)}
                            className={cn(
                                "p-4 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all text-center",
                                selectedEvents.includes(event.id)
                                    ? "bg-[#1E1E1E] border-[#1E1E1E] text-white"
                                    : "bg-white border-[#D4D2CF] text-[#1E1E1E]/40 hover:border-[#B79A63]"
                            )}
                        >
                            {event.label}
                        </button>
                    ))}
                </div>
                {errors.evenementsAccepte && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.evenementsAccepte.message}</p>}

                <div className="flex gap-3 p-4 bg-white/50 rounded-xl border border-[#D4D2CF]/30 mt-2">
                    <Info className="w-4 h-4 text-[#B79A63] shrink-0" />
                    <p className="text-[11px] text-[#1E1E1E]/60 italic">
                        L'Aide UX : Sélectionnez uniquement les types de fêtes pour lesquels vous avez un répertoire adapté.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <Label className="text-xs font-bold uppercase tracking-widest text-[#1E1E1E]">Description (Optionnel)</Label>
                <textarea
                    {...register("description")}
                    placeholder="Présentez votre style, votre expérience, l'ambiance que vous créez..."
                    className="w-full h-32 rounded-xl border border-[#D4D2CF] bg-white p-4 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#B79A63]/30 focus:border-[#B79A63] transition-all resize-none"
                />
            </div>
        </div>
    );
}
