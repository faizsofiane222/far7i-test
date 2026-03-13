import React from "react";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Music, Mic2, Speaker, Settings } from "lucide-react";

const ANIMATION_OPTIONS = [
    "Machine à fumée",
    "Jeux de lumières",
    "Animation micro",
    "Karaoké",
    "Projection vidéo",
    "Danseurs / Shows",
];

const EQUIPMENT_OPTIONS = [
    "Système son complet",
    "Platines DJ",
    "Instruments de musique",
    "Micro sans fil",
    "Scène / Podiums",
];

export default function SpecialtiesStep() {
    const { register, watch, setValue, formState: { errors } } = useFormContext();
    const isDj = watch("is_dj");
    const isOrchestra = watch("is_orchestra");
    const animOptions = watch("animation_options") || [];
    const equipOptions = watch("equipment_options") || [];

    const toggleOption = (field: "animation_options" | "equipment_options", value: string) => {
        const current = watch(field) || [];
        if (current.includes(value)) {
            setValue(field, current.filter((v: string) => v !== value), { shouldValidate: true });
        } else {
            setValue(field, [...current, value], { shouldValidate: true });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-lato">
            <div className="mb-6">
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2">2. Spécialités & Équipement</h2>
                <p className="text-sm text-[#1E1E1E]/80 mb-6 font-lato">Précisez votre type de prestation et votre matériel.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                    onClick={() => setValue("is_dj", !isDj, { shouldValidate: true })}
                    className={cn(
                        "p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-4 text-center",
                        isDj ? "border-[#B79A63] bg-[#F8F5F0]" : "border-[#D4D2CF] bg-white hover:border-[#B79A63]"
                    )}
                >
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", isDj ? "bg-[#B79A63] text-white" : "bg-[#F8F5F0] text-[#B79A63]")}>
                        <Music className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-[#1E1E1E]">DJ</h3>
                        <p className="text-xs text-[#1E1E1E]/60">Mixage, platines, playlists variées</p>
                    </div>
                </div>

                <div
                    onClick={() => setValue("is_orchestra", !isOrchestra, { shouldValidate: true })}
                    className={cn(
                        "p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-4 text-center",
                        isOrchestra ? "border-[#B79A63] bg-[#F8F5F0]" : "border-[#D4D2CF] bg-white hover:border-[#B79A63]"
                    )}
                >
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", isOrchestra ? "bg-[#B79A63] text-white" : "bg-[#F8F5F0] text-[#B79A63]")}>
                        <Mic2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-[#1E1E1E]">Orchestre</h3>
                        <p className="text-xs text-[#1E1E1E]/60">Musiciens en direct, chanteurs</p>
                    </div>
                </div>
            </div>
            {errors.is_dj && <p className="text-red-500 text-xs text-center">{errors.is_dj.message as string}</p>}

            <div className="space-y-6 bg-[#EBE6DA] p-6 rounded-2xl border border-[#D4D2CF]/50">
                <div>
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-4">Options d'animation</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ANIMATION_OPTIONS.map(opt => {
                            const isSelected = animOptions.includes(opt);
                            return (
                                <div
                                    key={opt}
                                    onClick={() => toggleOption("animation_options", opt)}
                                    className={cn(
                                        "px-4 py-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 text-sm font-bold",
                                        isSelected ? "border-[#B79A63] bg-[#F8F5F0]" : "border-[#D4D2CF] bg-white hover:border-[#B79A63]"
                                    )}
                                >
                                    <div className={cn("w-4 h-4 border rounded bg-white flex items-center justify-center flex-shrink-0", isSelected ? "border-[#B79A63] bg-[#B79A63]" : "border-[#D4D2CF]")}>
                                        {isSelected && <div className="w-2 h-2 rounded-[1px] bg-white" />}
                                    </div>
                                    <span>{opt}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="pt-6 border-t border-[#D4D2CF]/50">
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-4">Équipement disponible</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {EQUIPMENT_OPTIONS.map(opt => {
                            const isSelected = equipOptions.includes(opt);
                            return (
                                <div
                                    key={opt}
                                    onClick={() => toggleOption("equipment_options", opt)}
                                    className={cn(
                                        "px-4 py-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 text-sm font-bold",
                                        isSelected ? "border-[#B79A63] bg-[#F8F5F0]" : "border-[#D4D2CF] bg-white hover:border-[#B79A63]"
                                    )}
                                >
                                    <div className={cn("w-4 h-4 border rounded bg-white flex items-center justify-center flex-shrink-0", isSelected ? "border-[#B79A63] bg-[#B79A63]" : "border-[#D4D2CF]")}>
                                        {isSelected && <div className="w-2 h-2 rounded-[1px] bg-white" />}
                                    </div>
                                    <span>{opt}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
