import React from "react";
import { useFormContext } from "react-hook-form";
import { Camera, Video, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const COVERAGE_OPTIONS = [
    { id: 'preparatifs', label: 'Préparatifs' },
    { id: 'reception', label: 'Réception' },
    { id: 'cortege', label: 'Cortège' },
    { id: 'ceremonie', label: 'Cérémonie' },
    { id: 'soiree', label: 'Soirée' },
    { id: 'shooting', label: 'Shooting hors jour J' },
];

export default function SpecialtiesStep() {
    const { register, watch, setValue, formState: { errors } } = useFormContext();

    const isPhotographe = watch("isPhotographe");
    const isVideaste = watch("isVideaste");
    const couverture = watch("couverture") || [];

    const handleCouvertureToggle = (id: string) => {
        if (couverture.includes(id)) {
            setValue("couverture", couverture.filter((v: string) => v !== id), { shouldValidate: true });
        } else {
            setValue("couverture", [...couverture, id], { shouldValidate: true });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-lato">
            <div className="mb-6">
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#B79A63]" /> 2. Cœur de métier
                </h2>
                <p className="text-sm text-[#1E1E1E]/80 mb-6">Définissez très précisément le type de service que vous proposez.</p>
            </div>

            <div className="space-y-6">
                <h3 className="text-sm font-bold text-[#1E1E1E]">Type de prestation (Cochez ce qui s'applique) *</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div
                        className={cn("border p-6 rounded-2xl cursor-pointer transition-all flex flex-col justify-center", isPhotographe ? "border-[#B79A63] bg-white shadow-md relative overflow-hidden" : "border-[#D4D2CF] bg-[#F8F5F0]")}
                        onClick={() => setValue("isPhotographe", !isPhotographe, { shouldValidate: true })}
                    >
                        {isPhotographe && <div className="absolute top-0 left-0 w-1 h-full bg-[#B79A63]" />}
                        <div className="flex items-center gap-4">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", isPhotographe ? "bg-[#B79A63]" : "bg-white")}>
                                <Camera className={cn("w-6 h-6", isPhotographe ? "text-white" : "text-[#1E1E1E]")} />
                            </div>
                            <div>
                                <span className="text-base font-bold text-[#1E1E1E] block">Photographie</span>
                                <input type="checkbox" checked={isPhotographe} readOnly className="hidden" />
                                <span className="text-xs text-[#1E1E1E]/60">Captures fixes, retouches et albums</span>
                            </div>
                        </div>
                    </div>

                    <div
                        className={cn("border p-6 rounded-2xl cursor-pointer transition-all flex flex-col justify-center", isVideaste ? "border-[#B79A63] bg-white shadow-md relative overflow-hidden" : "border-[#D4D2CF] bg-[#F8F5F0]")}
                        onClick={() => setValue("isVideaste", !isVideaste, { shouldValidate: true })}
                    >
                        {isVideaste && <div className="absolute top-0 left-0 w-1 h-full bg-[#B79A63]" />}
                        <div className="flex items-center gap-4">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", isVideaste ? "bg-[#B79A63]" : "bg-white")}>
                                <Video className={cn("w-6 h-6", isVideaste ? "text-white" : "text-[#1E1E1E]")} />
                            </div>
                            <div>
                                <span className="text-base font-bold text-[#1E1E1E] block">Vidéographie</span>
                                <input type="checkbox" checked={isVideaste} readOnly className="hidden" />
                                <span className="text-xs text-[#1E1E1E]/60">Montage vidéo, clips et drones</span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Zod superRefine Error catch */}
                {errors.isPhotographe && <p className="text-red-500 text-sm font-bold mt-2">{errors.isPhotographe.message as string}</p>}
            </div>

            <div className="pt-8 border-t border-[#D4D2CF]">
                <h3 className="text-sm font-bold text-[#1E1E1E] mb-6">Couverture d'événement possible</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {COVERAGE_OPTIONS.map(item => {
                        const isChecked = couverture.includes(item.id);
                        return (
                            <label key={item.id} className={cn("flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all", isChecked ? "border-[#B79A63] bg-[#B79A63]/5 shadow-sm" : "border-[#D4D2CF] bg-white hover:border-[#B79A63]")}>
                                <input type="checkbox" checked={isChecked} onChange={() => handleCouvertureToggle(item.id)} className="w-5 h-5 accent-[#B79A63] rounded" />
                                <span className="text-sm font-bold text-[#1E1E1E]">{item.label}</span>
                            </label>
                        )
                    })}
                </div>
            </div>

        </div>
    );
}
