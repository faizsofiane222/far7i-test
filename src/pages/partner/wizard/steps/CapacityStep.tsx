import React from "react";
import { useFormContext } from "react-hook-form";
import { Info, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CapacityStep() {
    const { register, watch, setValue, formState: { errors } } = useFormContext();

    const capaciteMaximale = watch("capaciteMaximale", 0);
    const separated = watch("separated_spaces", false);
    const femmesCap = watch("capaciteFemmes", 0);
    const hommesCap = watch("capaciteHommes", 0);

    const salleDinatoire = watch("salle_dinatoire", false);
    const parking = watch("parking", false);
    const logeMaries = watch("loge_maries", false);
    const logeInvites = watch("loge_invites", false);

    const TotalSeparated = (Number(femmesCap) || 0) + (Number(hommesCap) || 0);
    const remainingToDistribute = Math.max(0, (Number(capaciteMaximale) || 0) - TotalSeparated);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-lato">
            <div className="mb-6">
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2 flex items-center gap-2">2. Capacités & Espaces</h2>
                <p className="text-sm text-[#1E1E1E]/80 mb-6">Définissez vos jauges d'accueil et les configurations possibles.</p>
            </div>

            <div className="bg-[#F8F5F0] p-6 rounded-2xl border border-[#D4D2CF] max-w-sm mb-8">
                <label className="text-sm font-bold text-[#1E1E1E] flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-[#B79A63]" /> Capacité Totale Maximale *
                </label>
                <input
                    type="number"
                    {...register("capaciteMaximale")}
                    placeholder="Ex: 400"
                    className={cn("w-full h-12 px-4 rounded-xl border bg-white focus:outline-none focus:border-[#B79A63] text-lg font-bold text-[#1E1E1E] transition-colors", errors.capaciteMaximale ? "border-red-500" : "border-[#D4D2CF]")}
                />
                {errors.capaciteMaximale && <p className="text-red-500 text-xs mt-1">{errors.capaciteMaximale.message as string}</p>}

                <p className="text-xs text-[#1E1E1E]/80 mt-3 flex items-start gap-1">
                    <Info className="min-w-4 w-4 h-4 text-[#B79A63]" />
                    <span>Ceci est la jauge maximale absolue de votre établissement, tous blocs et étages confondus.</span>
                </p>
            </div>

            <div className="pt-6 border-t border-[#D4D2CF]">
                <h3 className="text-sm font-bold text-[#1E1E1E] mb-4">Configuration des Salles de Fête</h3>

                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div
                        onClick={() => setValue("separated_spaces", false)}
                        className={cn("flex-1 p-4 border rounded-xl cursor-pointer transition-all flex items-start gap-3", !separated ? "border-[#B79A63] bg-[#B79A63]/5" : "border-[#D4D2CF] bg-white")}
                    >
                        <input type="radio" checked={!separated} readOnly className="mt-1 w-4 h-4 accent-[#B79A63] pointer-events-none" />
                        <div>
                            <p className="font-bold text-sm text-[#1E1E1E]">Salle Unique Mixte</p>
                            <p className="text-xs text-[#1E1E1E]/80">Un seul grand espace pour tous vos convives.</p>
                        </div>
                    </div>

                    <div
                        onClick={() => setValue("separated_spaces", true)}
                        className={cn("flex-1 p-4 border rounded-xl cursor-pointer transition-all flex items-start gap-3", separated ? "border-[#B79A63] bg-[#B79A63]/5" : "border-[#D4D2CF] bg-white")}
                    >
                        <input type="radio" checked={separated} readOnly className="mt-1 w-4 h-4 accent-[#B79A63] pointer-events-none" />
                        <div>
                            <p className="font-bold text-sm text-[#1E1E1E]">Salles Séparées (F/H)</p>
                            <p className="text-xs text-[#1E1E1E]/80">Deux espaces communicants ou séparés pour hommes et femmes.</p>
                        </div>
                    </div>
                </div>

                {separated ? (
                    <div className="bg-white p-6 rounded-2xl border border-[#D4D2CF] space-y-6">
                        <div className="flex justify-between items-center bg-[#F8F5F0] px-4 py-3 rounded-xl border border-[#D4D2CF]">
                            <span className="text-sm font-bold text-[#1E1E1E]">Places restantes à répartir :</span>
                            <span className={cn("font-bold text-xl", remainingToDistribute === 0 ? "text-green-600" : remainingToDistribute < 0 ? "text-red-500" : "text-[#B79A63]")}>
                                {remainingToDistribute}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Capacité Femmes</label>
                                <input type="number" {...register("capaciteFemmes")} className={cn("w-full h-10 px-3 rounded-lg border bg-[#F8F5F0] focus:outline-none focus:border-[#B79A63]", errors.capaciteFemmes ? "border-red-500" : "border-[#D4D2CF]")} placeholder="0" />
                                {errors.capaciteFemmes && <p className="text-red-500 text-xs mt-1">{errors.capaciteFemmes.message as string}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Capacité Hommes</label>
                                <input type="number" {...register("capaciteHommes")} className="w-full h-10 px-3 rounded-lg border bg-[#F8F5F0] border-[#D4D2CF] focus:outline-none focus:border-[#B79A63]" placeholder="0" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#F8F5F0] p-6 rounded-2xl border border-[#D4D2CF] opacity-60 pointer-events-none">
                        <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Capacité Globale Mixte</label>
                        <input type="number" value={capaciteMaximale} disabled className="w-full h-10 px-3 rounded-lg border border-[#D4D2CF] bg-[#EBE6DA] text-[#1E1E1E]/60 font-bold" />
                        <p className="text-xs text-[#1E1E1E]/80 mt-2">Cette valeur reprend automatiquement la capacité totale maximale.</p>
                    </div>
                )}
            </div>

            <div className="pt-8 border-t border-[#D4D2CF]">
                <h3 className="text-sm font-bold text-[#1E1E1E] mb-4">Espaces Annexes & Commodités</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Salle Dinatoire */}
                    <div className={cn("border rounded-xl p-4 transition-all", salleDinatoire ? "border-[#B79A63] bg-white" : "border-[#D4D2CF] bg-[#F8F5F0]")}>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" {...register("salle_dinatoire")} className="w-5 h-5 accent-[#B79A63]" />
                            <span className="text-sm font-bold text-[#1E1E1E]">Salle dînatoire séparée</span>
                        </label>
                        {salleDinatoire && (
                            <div className="mt-4 pt-4 border-t border-[#D4D2CF]">
                                <label className="block text-xs font-bold text-[#1E1E1E]/80 mb-2">Couverts par service (Max {capaciteMaximale})</label>
                                <input type="number" {...register("couvertsParService")} placeholder="Ex: 150" className={cn("w-full h-10 px-3 rounded-lg border focus:outline-none focus:border-[#B79A63] bg-white", errors.couvertsParService ? "border-red-500" : "border-[#D4D2CF]")} />
                                {errors.couvertsParService && <p className="text-red-500 text-xs mt-1">{errors.couvertsParService.message as string}</p>}
                            </div>
                        )}
                    </div>

                    {/* Parking */}
                    <div className={cn("border rounded-xl p-4 transition-all", parking ? "border-[#B79A63] bg-white" : "border-[#D4D2CF] bg-[#F8F5F0]")}>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" {...register("parking")} className="w-5 h-5 accent-[#B79A63]" />
                            <span className="text-sm font-bold text-[#1E1E1E]">Parking privé</span>
                        </label>
                        {parking && (
                            <div className="mt-4 pt-4 border-t border-[#D4D2CF]">
                                <label className="block text-xs font-bold text-[#1E1E1E]/80 mb-2">Places disponibles</label>
                                <input type="number" {...register("placesParking")} placeholder="Ex: 50" className="w-full h-10 px-3 rounded-lg border border-[#D4D2CF] bg-white focus:outline-none focus:border-[#B79A63]" />
                            </div>
                        )}
                    </div>

                    {/* Loges */}
                    {[
                        { id: 'loge_maries', label: 'Loge Mariés', isChecked: logeMaries, fieldName: 'loge_maries_nb' },
                        { id: 'loge_invites', label: 'Loges Invités', isChecked: logeInvites, fieldName: 'loge_invites_nb' }
                    ].map(loge => (
                        <div key={loge.id} className={cn("border rounded-xl p-4 transition-all", loge.isChecked ? "border-[#B79A63] bg-white" : "border-[#D4D2CF] bg-[#F8F5F0]")}>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" {...register(loge.id)} className="w-5 h-5 accent-[#B79A63]" />
                                <span className="text-sm font-bold text-[#1E1E1E]">{loge.label}</span>
                            </label>
                            {loge.isChecked && (
                                <div className="mt-4 pt-4 border-t border-[#D4D2CF]">
                                    <label className="block text-xs font-bold text-[#1E1E1E]/80 mb-2">Quantité</label>
                                    <input type="number" {...register(loge.fieldName)} placeholder="1" className="w-full h-10 px-3 rounded-lg border border-[#D4D2CF] bg-white focus:outline-none focus:border-[#B79A63]" />
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Simple checkboxes */}
                    {[
                        { id: 'jardin', label: 'Jardin / Espace vert' },
                        { id: 'terrasse', label: 'Terrasse / Rooftop' },
                        { id: 'piscine', label: 'Piscine' },
                        { id: 'salle_attente', label: "Salle d'attente d'accueil" }
                    ].map(item => (
                        <div key={item.id} className="border border-[#D4D2CF] bg-[#F8F5F0] rounded-xl p-4 transition-all hover:border-[#B79A63] focus-within:bg-white focus-within:border-[#B79A63]">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" {...register(item.id)} className="w-5 h-5 accent-[#B79A63]" />
                                <span className="text-sm font-bold text-[#1E1E1E]">{item.label}</span>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
