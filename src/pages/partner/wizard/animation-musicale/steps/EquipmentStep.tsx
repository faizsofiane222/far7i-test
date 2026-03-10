import React from "react";
import { UseFormReturn } from "react-hook-form";
import { AnimationMusicaleFormValues } from "../schema";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Speaker, Mic2, Sparkles, Check, Info } from "lucide-react";

interface StepProps {
    methods: UseFormReturn<AnimationMusicaleFormValues>;
}

const EQUIPMENT_OPTIONS = [
    { key: "sonorisation", label: "Sonorisation", icon: Speaker },
    { key: "micros", label: "Micro(s) HF / Filaire", icon: Mic2 },
    { key: "jeux_lumiere", label: "Jeux de lumière & Effets", icon: Sparkles },
];

const ANIMATION_OPTIONS = [
    { key: "animation_micro", label: "Animation Micro (MC)", description: "Prise de parole, jeux, présentation." },
    { key: "sans_micro", label: "Prestation Musicale Seule", description: "Musique continue sans intervention micro." },
    { key: "mixte", label: "Animation Mixte", description: "Équilibre entre musique et animation." },
];

export default function EquipmentStep({ methods }: StepProps) {
    const { watch, setValue } = methods;
    const selectedEquip = watch("equipements") || [];
    const selectedAnim = watch("optionsAnimation") || [];

    const toggleItem = (field: "equipements" | "optionsAnimation", key: string) => {
        const current = [...watch(field) || []];
        const index = current.indexOf(key);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(key);
        }
        setValue(field, current, { shouldValidate: true });
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-2">
                <h2 className="text-3xl font-serif text-[#1E1E1E]">Matériel & Ambiance</h2>
                <p className="text-sm font-sans text-[#1E1E1E]/60">Précisez vos capacités techniques et votre style d'animation.</p>
            </div>

            <div className="space-y-6">
                <Label className="text-xs font-bold uppercase tracking-widest text-[#1E1E1E]">Équipements inclus</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {EQUIPMENT_OPTIONS.map(opt => (
                        <button
                            key={opt.key}
                            type="button"
                            onClick={() => toggleItem("equipements", opt.key)}
                            className={cn(
                                "flex flex-col items-center gap-5 p-10 rounded-2xl border-2 transition-all relative group",
                                selectedEquip.includes(opt.key)
                                    ? "bg-[#1E1E1E] border-[#1E1E1E] text-white"
                                    : "bg-white border-[#D4D2CF] text-[#1E1E1E]/60 hover:border-[#B79A63]"
                            )}
                        >
                            <div className={cn(
                                "w-16 h-16 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                                selectedEquip.includes(opt.key) ? "bg-[#B79A63]" : "bg-[#F8F5F0] group-hover:bg-white"
                            )}>
                                <opt.icon className={cn("w-8 h-8", selectedEquip.includes(opt.key) && "text-white")} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-center">{opt.label}</span>
                            {selectedEquip.includes(opt.key) && <div className="absolute top-4 right-4"><Check className="w-5 h-5 text-[#B79A63]" /></div>}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                <Label className="text-xs font-bold uppercase tracking-widest text-[#1E1E1E]">Styles d'Animation</Label>
                <div className="grid grid-cols-1 gap-4">
                    {ANIMATION_OPTIONS.map(opt => (
                        <button
                            key={opt.key}
                            type="button"
                            onClick={() => toggleItem("optionsAnimation", opt.key)}
                            className={cn(
                                "flex items-center gap-6 p-6 rounded-2xl border-2 transition-all text-left relative group",
                                selectedAnim.includes(opt.key)
                                    ? "bg-[#1E1E1E] border-[#1E1E1E] text-white"
                                    : "bg-white border-[#D4D2CF] text-[#1E1E1E]/60 hover:border-[#B79A63]"
                            )}
                        >
                            <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-sm",
                                selectedAnim.includes(opt.key) ? "bg-[#B79A63]" : "bg-[#F8F5F0] group-hover:bg-white"
                            )}>
                                <Check className={cn("w-6 h-6 transparency", selectedAnim.includes(opt.key) ? "opacity-100 text-white" : "opacity-20")} />
                            </div>
                            <div className="flex flex-col">
                                <span className={cn("text-xs font-bold uppercase tracking-widest mb-1", selectedAnim.includes(opt.key) ? "text-[#B79A63]" : "text-[#1E1E1E]")}>{opt.label}</span>
                                <span className={cn("text-xs font-sans", selectedAnim.includes(opt.key) ? "text-white/60" : "text-[#1E1E1E]/40")}>{opt.description}</span>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="flex gap-3 p-4 bg-white/50 rounded-xl border border-[#D4D2CF]/30 mt-4">
                    <Info className="w-4 h-4 text-[#B79A63] shrink-0" />
                    <p className="text-[11px] text-[#1E1E1E]/60 italic">
                        L'Aide UX : Précisez ici si vous vous contentez de passer la musique ou si vous créez une vraie interaction avec les invités.
                    </p>
                </div>
            </div>
        </div>
    );
}
