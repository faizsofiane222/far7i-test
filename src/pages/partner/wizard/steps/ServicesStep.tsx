import React from "react";
import { useFormContext } from "react-hook-form";
import { Sparkles, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

const SERVICES_INCLUS = [
    { id: 'serveurs', label: 'Serveurs hommes' },
    { id: 'serveuses', label: 'Serveuses femmes' },
    { id: 'nettoyage', label: 'Nettoyage inclus' },
    { id: 'securite', label: 'Agent de sécurité' },
    { id: 'piste_danse', label: 'Piste de danse' },
    { id: 'mobilier', label: 'Mobilier (tables, chaises)' },
    { id: 'nappes', label: 'Nappes & Housses' },
    { id: 'climatisation', label: 'Climatisation' },
    { id: 'chauffage', label: 'Chauffage' },
    { id: 'ventilation', label: 'Ventilation' },
    { id: 'acces_pmr', label: 'Accès PMR (Handicapés)' },
    { id: 'sonorisation', label: 'Sonorisation de base' },
    { id: 'jeux_lumiere', label: 'Jeux de lumière' },
    { id: 'videoprojecteur', label: 'Vidéoprojecteur / Écran' },
    { id: 'dj', label: 'DJ inclus' },
    { id: 'animateur', label: 'Animateur (MC)' },
    { id: 'valet', label: 'Service Voiturier / Valet' },
    { id: 'cameras', label: 'Caméras de surveillance' },
];

export default function ServicesStep() {
    const { register, watch, setValue } = useFormContext();
    const traiteurType = watch("traiteur_type", "libre");

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-lato">
            <div className="mb-6">
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#B79A63]" /> 3. Services & Équipements
                </h2>
                <p className="text-sm text-[#1E1E1E]/80 mb-6">Sélectionnez les prestations incluses dans la location de votre espace.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SERVICES_INCLUS.map(service => {
                    const isChecked = watch(service.id, false);
                    return (
                        <div
                            key={service.id}
                            className={cn(
                                "border rounded-xl p-3 cursor-pointer transition-all flex items-center gap-3",
                                isChecked ? "border-[#B79A63] bg-white shadow-sm" : "border-[#D4D2CF] bg-[#F8F5F0] hover:border-[#1E1E1E]/30"
                            )}
                            onClick={() => setValue(service.id, !isChecked, { shouldValidate: true })}
                        >
                            <input
                                type="checkbox"
                                checked={isChecked}
                                readOnly
                                className="w-4 h-4 accent-[#B79A63] pointer-events-none"
                            />
                            <span className="text-sm font-bold text-[#1E1E1E] leading-tight">{service.label}</span>
                        </div>
                    )
                })}
            </div>

            <div className="pt-8 border-t border-[#D4D2CF]">
                <h3 className="text-lg font-serif font-bold text-[#1E1E1E] mb-4 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-[#B79A63]" /> Restauration & Cuisine
                </h3>

                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    {[
                        { id: 'impose', label: 'Traiteur Imposé', desc: "Les clients doivent utiliser votre service traiteur exclusif." },
                        { id: 'libre', label: 'Traiteur Libre', desc: "Les clients peuvent ramener le traiteur de leur choix." },
                        { id: 'aucun', label: 'Pas de Traiteur', desc: "Vous n'offrez/n'acceptez pas de service de restauration." }
                    ].map(type => (
                        <div
                            key={type.id}
                            onClick={() => setValue("traiteur_type", type.id)}
                            className={cn(
                                "flex-1 border rounded-xl p-4 cursor-pointer transition-all",
                                traiteurType === type.id ? "border-[#B79A63] bg-white shadow-md relative overflow-hidden" : "border-[#D4D2CF] bg-[#F8F5F0]"
                            )}
                        >
                            {traiteurType === type.id && <div className="absolute top-0 left-0 w-full h-1 bg-[#B79A63]" />}
                            <div className="flex items-start gap-3">
                                <input type="radio" checked={traiteurType === type.id} readOnly className="mt-1 w-4 h-4 accent-[#B79A63]" />
                                <div>
                                    <p className="font-bold text-sm text-[#1E1E1E]">{type.label}</p>
                                    <p className="text-xs text-[#1E1E1E]/80 mt-1">{type.desc}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Conditional Infrastructure Checkboxes */}
                {(traiteurType === 'libre' || traiteurType === 'aucun') && (
                    <div className="bg-[#EBE6DA] p-6 rounded-2xl border border-[#D4D2CF] animate-in slide-in-from-top-2">
                        <p className="text-sm font-bold text-[#1E1E1E] mb-4">Infrastructure disponible pour les clients (ou leur traiteur) :</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { id: 'cuisine_equipee', label: 'Cuisine équipée' },
                                { id: 'vaisselle', label: 'Vaisselle disponible' },
                                { id: 'boissons', label: 'Boissons incluses (Eau, Café, Thé)' }
                            ].map(infra => {
                                const isChecked = watch(infra.id);
                                return (
                                    <label key={infra.id} className="flex items-center gap-3 cursor-pointer p-3 border border-[#D4D2CF] bg-[#F8F5F0] rounded-xl hover:border-[#B79A63] transition-colors focus-within:bg-white focus-within:border-[#B79A63]">
                                        <input type="checkbox" {...register(infra.id)} className="w-5 h-5 accent-[#B79A63] rounded" />
                                        <span className="text-sm font-bold text-[#1E1E1E]">{infra.label}</span>
                                    </label>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
