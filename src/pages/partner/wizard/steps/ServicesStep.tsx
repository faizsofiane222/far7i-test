import React from "react";
import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import {
    Users,
    ShieldCheck,
    Wind,
    Flame,
    Accessibility,
    Speaker,
    Disc,
    Video,
    CheckCircle2,
    Utensils
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ServicesStep() {
    const { register, watch } = useFormContext();
    const traiteurType = watch("traiteur_type", "libre");

    const toggleServices = [
        { key: 'serveurs_mixte', label: 'Serveurs (Mixte)', icon: <Users className="w-4 h-4" /> },
        { key: 'serveuses_femmes', label: 'Serveuses (Femmes)', icon: <Users className="w-4 h-4" /> },
        { key: 'nettoyage_inclus', label: 'Nettoyage inclus', icon: <CheckCircle2 className="w-4 h-4" /> },
        { key: 'securite_incluse', label: 'Sécurité incluse', icon: <ShieldCheck className="w-4 h-4" /> },
        { key: 'climatisation', label: 'Climatisation', icon: <Wind className="w-4 h-4" /> },
        { key: 'chauffage', label: 'Chauffage central', icon: <Flame className="w-4 h-4" /> },
        { key: 'acces_pmr', label: 'Accès PMR', icon: <Accessibility className="w-4 h-4" /> },
        { key: 'sonorisation_base', label: 'Sonorisation', icon: <Speaker className="w-4 h-4" /> },
        { key: 'piste_danse', label: 'Piste de danse', icon: <Disc className="w-4 h-4" /> },
        { key: 'videoprojecteur', label: 'Vidéoprojecteur', icon: <Video className="w-4 h-4" /> },
    ];

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div>
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2 flex items-center gap-2">
                    3. Services & Équipements
                </h2>
                <p className="text-sm text-[#1E1E1E]/60 mb-6">
                    Cochez les services inclus d'office dans la location de votre salle.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {toggleServices.map(it => {
                        const isChecked = watch(it.key);
                        return (
                            <label
                                key={it.key}
                                className={cn(
                                    "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                                    isChecked
                                        ? "bg-[#1E1E1E] border-[#1E1E1E] text-white shadow-md"
                                        : "bg-[#F8F5F0] border-[#D4D2CF] hover:border-[#B79A63] text-[#1E1E1E]"
                                )}
                            >
                                <input type="checkbox" {...register(it.key)} className="hidden" />
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                    isChecked ? "bg-[#B79A63]" : "bg-white text-[#1E1E1E]"
                                )}>
                                    {it.icon}
                                </div>
                                <span className="text-sm font-bold uppercase tracking-wide">{it.label}</span>
                            </label>
                        );
                    })}
                </div>
            </div>

            <div className="pt-8 border-t border-[#D4D2CF]">
                <h2 className="text-lg font-serif font-bold text-[#1E1E1E] mb-4 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-[#B79A63]" /> Restauration & Traiteur
                </h2>

                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    {[
                        { id: 'libre', label: 'Traiteur libre' },
                        { id: 'impose', label: 'Traiteur imposé' },
                        { id: 'aucun', label: 'Pas de traiteur (Client se débrouille)' }
                    ].map(opt => (
                        <label
                            key={opt.id}
                            className={cn(
                                "flex-1 text-center py-4 rounded-xl border cursor-pointer text-sm font-bold transition-all",
                                traiteurType === opt.id
                                    ? "bg-[#B79A63] border-[#B79A63] text-white"
                                    : "bg-[#F8F5F0] border-[#D4D2CF] text-[#1E1E1E]/60 hover:border-[#1E1E1E]/20"
                            )}
                        >
                            <input type="radio" {...register("traiteur_type")} value={opt.id} className="hidden" />
                            {opt.label}
                        </label>
                    ))}
                </div>

                {/* Additional catering options unless Traiteur is Imposé */}
                {traiteurType !== "impose" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-top-2">
                        <label className="flex items-center gap-3 cursor-pointer group p-4 border border-[#D4D2CF] bg-[#F8F5F0] rounded-xl hover:border-[#B79A63] transition-colors">
                            <input type="checkbox" {...register("cuisine_equipee")} className="w-5 h-5 accent-[#B79A63] rounded border-[#D4D2CF]" />
                            <span className="text-sm font-bold text-[#1E1E1E]">Cuisine équipée exploitable</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group p-4 border border-[#D4D2CF] bg-[#F8F5F0] rounded-xl hover:border-[#B79A63] transition-colors">
                            <input type="checkbox" {...register("vaisselle_incluse")} className="w-5 h-5 accent-[#B79A63] rounded border-[#D4D2CF]" />
                            <span className="text-sm font-bold text-[#1E1E1E]">Vaisselle fournie</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group p-4 border border-[#D4D2CF] bg-[#F8F5F0] rounded-xl hover:border-[#B79A63] transition-colors">
                            <input type="checkbox" {...register("boissons_incluses")} className="w-5 h-5 accent-[#B79A63] rounded border-[#D4D2CF]" />
                            <span className="text-sm font-bold text-[#1E1E1E]">Boissons chaudes/froides incluses</span>
                        </label>
                    </div>
                )}
            </div>
        </div>
    );
}
