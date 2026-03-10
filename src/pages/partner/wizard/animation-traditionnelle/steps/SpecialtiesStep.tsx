import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";

export default function SpecialtiesStep() {
    const { register, setValue, formState: { errors } } = useFormContext();

    // Watch boolean fields
    const hasZorna = useWatch({ name: "hasZorna" });
    const hasKarkabou = useWatch({ name: "hasKarkabou" });
    const hasBendir = useWatch({ name: "hasBendir" });
    const hasAutre = useWatch({ name: "hasAutre" });

    const handleToggle = (field: string, currentValue: boolean) => {
        setValue(field, !currentValue, { shouldValidate: true });
    };

    const hasAnimationError = errors.hasZorna;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-lato">
            <div className="mb-6">
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2">2. Spécialités & Animation</h2>
                <p className="text-sm text-[#1E1E1E]/80 mb-6 font-lato">Quels instruments et styles traditionnels proposez-vous lors d'une prestation ?</p>
            </div>

            <div className="space-y-6 bg-[#EBE6DA] p-6 rounded-2xl border border-[#D4D2CF]/50">
                <div className="space-y-4">
                    <label className="block text-sm font-bold text-[#1E1E1E]">Types d'animation (Min 1 requis) *</label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { id: "hasZorna", label: "Zorna (Ghaïta & Tbel)", val: hasZorna },
                            { id: "hasKarkabou", label: "Karkabou (Diwan / Gnawa)", val: hasKarkabou },
                            { id: "hasBendir", label: "Bendir (Medaha / Assalas)", val: hasBendir },
                            { id: "hasAutre", label: "Autre spécialité locale", val: hasAutre },
                        ].map((anim) => (
                            <div
                                key={anim.id}
                                onClick={() => handleToggle(anim.id, anim.val)}
                                className={cn(
                                    "flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                                    anim.val
                                        ? "border-[#B79A63] bg-[#F8F5F0] text-[#1E1E1E]"
                                        : "border-[#D4D2CF] bg-white text-[#1E1E1E]/70 hover:border-[#B79A63]"
                                )}
                            >
                                <div className={cn("w-5 h-5 border rounded bg-white flex items-center justify-center flex-shrink-0", anim.val ? "border-[#B79A63] bg-[#B79A63]" : "border-[#D4D2CF]")}>
                                    {anim.val && <div className="w-2.5 h-2.5 rounded-[2px] bg-white" />}
                                </div>
                                <span className="font-bold text-sm">{anim.label}</span>
                            </div>
                        ))}
                    </div>
                    {hasAnimationError && <p className="text-red-500 text-xs mt-2">{hasAnimationError.message as string}</p>}
                </div>

                {hasAutre && (
                    <div className="pt-4 border-t border-[#D4D2CF]/50 animate-in fade-in zoom-in-95 duration-300">
                        <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Précisez votre style (ex: Issawa, Tbel particulier...) *</label>
                        <input
                            type="text"
                            {...register("autreAnimationSpecifiez")}
                            placeholder="Votre spécialité en quelques mots..."
                            className={cn("w-full h-12 px-4 rounded-xl border bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors", errors.autreAnimationSpecifiez ? "border-red-500" : "border-[#D4D2CF]")}
                        />
                        {errors.autreAnimationSpecifiez && <p className="text-red-500 text-xs mt-1">{errors.autreAnimationSpecifiez.message as string}</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
