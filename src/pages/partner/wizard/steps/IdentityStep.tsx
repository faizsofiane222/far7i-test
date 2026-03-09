import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { GildedInput } from "@/components/ui/gilded-input";
import { useWilayas } from "@/hooks/useWilayas";
import { MapPin, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const EVENT_TYPES = [
    { id: "mariage", label: "Mariage" },
    { id: "fiancailles", label: "Fiançailles (khotba)" },
    { id: "naissance", label: "Naissance (z'yada, sbou3)" },
    { id: "circoncision", label: "Circoncision" },
    { id: "anniversaire", label: "Anniversaire" },
    { id: "reussite", label: "Fête de réussite" },
    { id: "soutenance", label: "Soutenance universitaire" },
    { id: "entreprise", label: "Événement professionnel" }
];

export default function IdentityStep() {
    const { register, control, watch, formState: { errors } } = useFormContext();
    const { wilayas } = useWilayas();
    const eventsAccepted = watch("events_accepted", []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div>
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-6 flex items-center gap-2">
                    1. Identité du lieu
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nom */}
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-[#1E1E1E]">Nom commercial *</Label>
                        <GildedInput
                            {...register("commercial_name")}
                            placeholder="Ex: Salle Le Diamant"
                            className={cn(errors.commercial_name && "border-red-500 focus:ring-red-500")}
                        />
                        {errors.commercial_name && <p className="text-red-500 text-xs mt-1">{errors.commercial_name.message as string}</p>}
                    </div>

                    {/* Wilaya */}
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-[#1E1E1E]">Wilaya *</Label>
                        <select
                            {...register("wilaya_id")}
                            className={cn(
                                "w-full h-11 rounded-md border border-[#D4D2CF] bg-[#F8F5F0] px-4 font-lato text-sm outline-none transition-colors",
                                "focus:border-[#B79A63] focus:ring-1 focus:ring-[#B79A63]",
                                errors.wilaya_id && "border-red-500 focus:border-red-500 focus:ring-red-500"
                            )}
                        >
                            <option value="">Sélectionnez</option>
                            {wilayas.map(w => <option key={w.id} value={w.id}>{w.code} - {w.name}</option>)}
                        </select>
                        {errors.wilaya_id && <p className="text-red-500 text-xs mt-1">{errors.wilaya_id.message as string}</p>}
                    </div>

                    {/* Adresse complète */}
                    <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm font-bold text-[#1E1E1E]">Adresse complète *</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1E1E1E]/40" />
                            <GildedInput
                                {...register("address")}
                                className={cn("pl-10", errors.address && "border-red-500 focus:ring-red-500")}
                                placeholder="Numéro, rue, croisement..."
                            />
                        </div>
                        {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message as string}</p>}

                        {/* Mock Map Picker */}
                        <div className="mt-3 bg-[#1E1E1E]/5 rounded-xl border border-[#D4D2CF] border-dashed p-6 text-center text-sm text-[#1E1E1E]/60 flex flex-col items-center gap-2 cursor-pointer hover:bg-[#1E1E1E]/10 transition-colors">
                            <MapPin className="w-6 h-6 text-[#B79A63]" />
                            <p className="font-bold">Définir sur la carte</p>
                            <p className="text-xs">La position précise aide les invités (Simulation)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Events */}
            <div className="pt-6 border-t border-[#D4D2CF]">
                <Label className="text-sm font-bold text-[#1E1E1E] mb-4 block">Événements acceptés *</Label>
                <Controller
                    name="events_accepted"
                    control={control}
                    render={({ field }) => (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {EVENT_TYPES.map((ev) => {
                                const isSelected = field.value.includes(ev.id);
                                return (
                                    <button
                                        type="button"
                                        key={ev.id}
                                        onClick={() => {
                                            const newValue = isSelected
                                                ? field.value.filter((v: string) => v !== ev.id)
                                                : [...field.value, ev.id];
                                            field.onChange(newValue);
                                        }}
                                        className={cn(
                                            "px-3 py-2 rounded-xl border text-xs font-bold transition-all outline-none",
                                            isSelected
                                                ? "border-[#B79A63] bg-[#F8F5F0] text-[#B79A63] ring-1 ring-[#B79A63]"
                                                : "border-[#D4D2CF] text-[#1E1E1E]/60 hover:border-[#1E1E1E]/20"
                                        )}
                                    >
                                        {ev.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                />
                {errors.events_accepted && <p className="text-red-500 text-xs mt-2">{errors.events_accepted.message as string}</p>}
            </div>

            {/* Bio */}
            <div className="pt-6 border-t border-[#D4D2CF] space-y-2">
                <Label className="text-sm font-bold text-[#1E1E1E] flex items-center gap-2">
                    Description de l'établissement <span className="text-[#1E1E1E]/40 font-normal">(Optionnel)</span>
                </Label>
                <textarea
                    {...register("bio")}
                    rows={4}
                    className="w-full h-auto min-h-[100px] rounded-md border border-[#D4D2CF] bg-[#F8F5F0] p-4 text-sm font-lato outline-none transition-colors focus:border-[#B79A63] focus:ring-1 focus:ring-[#B79A63] resize-none"
                    placeholder="Décrivez l'architecture, l'ambiance et les atouts de votre salle..."
                />
            </div>

            <div className="flex flex-row gap-2 mt-4 bg-[#F8F5F0] border border-[#D4D2CF] p-3 rounded-lg items-start">
                <Info className="w-4 h-4 text-[#B79A63] mt-0.5 shrink-0" />
                <p className="text-sm text-[#1E1E1E]/80 font-lato">
                    Les clients accordent 40% de confiance supplémentaire aux lieux qui présentent une adresse géographique et au moins 4 types d'événements distincts.
                </p>
            </div>
        </div>
    );
}
