import React from "react";
import { UseFormReturn } from "react-hook-form";
import { AnimationMusicaleFormValues } from "../schema";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Radio, Users, Check, Music, Mic2 } from "lucide-react";

interface StepProps {
    methods: UseFormReturn<AnimationMusicaleFormValues>;
}

const MUSIC_STYLES = [
    { key: "musique_algerienne", label: "Musique algérienne" },
    { key: "musique_orientale", label: "Musique orientale" },
    { key: "musique_internationale", label: "Musique internationale" },
    { key: "musique_moderne", label: "Musique moderne" },
    { key: "mix_generaliste", label: "Mix généraliste" },
];

export default function SpecialtiesStep({ methods }: StepProps) {
    const { watch, setValue, formState: { errors } } = methods;
    const isDJ = watch("isDJ");
    const isOrchestra = watch("isOrchestra");
    const selectedStyles = watch("stylesMusicaux") || [];

    const toggleStyle = (key: string) => {
        const current = [...selectedStyles];
        const index = current.indexOf(key);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(key);
        }
        setValue("stylesMusicaux", current, { shouldValidate: true });
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-2">
                <h2 className="text-3xl font-serif text-[#1E1E1E]">Votre Spécialité</h2>
                <p className="text-sm font-sans text-[#1E1E1E]/60">Définissez votre type de prestation et votre répertoire.</p>
            </div>

            <div className="space-y-6">
                <Label className="text-xs font-bold uppercase tracking-widest text-[#1E1E1E]">Type de prestation *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <button
                        type="button"
                        onClick={() => setValue("isDJ", !isDJ, { shouldValidate: true })}
                        className={cn(
                            "p-8 rounded-2xl border-2 transition-all text-left flex flex-col items-center gap-4 group relative overflow-hidden",
                            isDJ
                                ? "bg-[#1E1E1E] border-[#1E1E1E] text-white"
                                : "bg-white border-[#D4D2CF] text-[#1E1E1E]/60 hover:border-[#B79A63]"
                        )}
                    >
                        <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors shadow-sm",
                            isDJ ? "bg-[#B79A63]" : "bg-[#FDFCFB]"
                        )}>
                            <Radio className={cn("w-8 h-8", isDJ && "text-white")} />
                        </div>
                        <span className="font-bold uppercase text-xs tracking-widest">DJ (Mix & Platines)</span>
                        {isDJ && <div className="absolute top-4 right-4"><Check className="w-5 h-5 text-[#B79A63]" /></div>}
                    </button>

                    <button
                        type="button"
                        onClick={() => setValue("isOrchestra", !isOrchestra, { shouldValidate: true })}
                        className={cn(
                            "p-8 rounded-2xl border-2 transition-all text-left flex flex-col items-center gap-4 group relative overflow-hidden",
                            isOrchestra
                                ? "bg-[#1E1E1E] border-[#1E1E1E] text-white"
                                : "bg-white border-[#D4D2CF] text-[#1E1E1E]/60 hover:border-[#B79A63]"
                        )}
                    >
                        <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors shadow-sm",
                            isOrchestra ? "bg-[#B79A63]" : "bg-[#FDFCFB]"
                        )}>
                            <Users className={cn("w-8 h-8", isOrchestra && "text-white")} />
                        </div>
                        <span className="font-bold uppercase text-xs tracking-widest">Orchestre / Groupe</span>
                        {isOrchestra && <div className="absolute top-4 right-4"><Check className="w-5 h-5 text-[#B79A63]" /></div>}
                    </button>
                </div>
                {errors.isDJ && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.isDJ.message as string}</p>}
            </div>

            <div className="space-y-6">
                <Label className="text-xs font-bold uppercase tracking-widest text-[#1E1E1E]">Styles Musicaux proposés</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {MUSIC_STYLES.map(style => (
                        <button
                            key={style.key}
                            type="button"
                            onClick={() => toggleStyle(style.key)}
                            className={cn(
                                "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left group",
                                selectedStyles.includes(style.key)
                                    ? "bg-[#1E1E1E] border-[#1E1E1E] text-white"
                                    : "bg-white border-[#D4D2CF] text-[#1E1E1E]/60 hover:border-[#B79A63]"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-colors",
                                selectedStyles.includes(style.key) ? "bg-[#B79A63]" : "bg-[#F8F5F0] group-hover:bg-white"
                            )}>
                                <Music className={cn("w-5 h-5", selectedStyles.includes(style.key) && "text-white")} />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-wider">{style.label}</span>
                            {selectedStyles.includes(style.key) && <Check className="w-4 h-4 ml-auto text-[#B79A63]" />}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
