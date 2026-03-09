import React from "react";
import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { GildedInput } from "@/components/ui/gilded-input";
import { Users, Info, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CapacityStep() {
    const { register, watch, setValue, formState: { errors } } = useFormContext();

    const maxCap = watch("capacity_max", 0);
    const separated = watch("separated_spaces", false);
    const femmesCap = watch("salle_femmes_cap", 0);
    const hommesCap = watch("salle_hommes_cap", 0);
    const salleDinatoire = watch("salle_dinatoire", false);

    // Derived values
    const currentTotalSeparated = (Number(femmesCap) || 0) + (Number(hommesCap) || 0);
    const remainingToDistribute = Math.max(0, (Number(maxCap) || 0) - currentTotalSeparated);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div>
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2 flex items-center gap-2">
                    2. Capacité Globale
                </h2>
                <p className="text-sm text-[#1E1E1E]/60 mb-6">
                    Définissez le nombre maximum de personnes que votre établissement peut accueillir.
                </p>

                <div className="bg-[#F8F5F0] p-6 rounded-2xl border border-[#D4D2CF] max-w-sm">
                    <Label className="text-sm font-bold text-[#1E1E1E] flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-[#B79A63]" /> Capacité Maximale *
                    </Label>
                    <GildedInput
                        type="number"
                        {...register("capacity_max", { valueAsNumber: true })}
                        placeholder="Ex: 400 personnes"
                        className={cn("text-lg", errors.capacity_max && "border-red-500")}
                    />
                    {errors.capacity_max && <p className="text-red-500 text-xs mt-1">{errors.capacity_max.message as string}</p>}
                </div>
            </div>

            <div className="pt-8 border-t border-[#D4D2CF]">
                <h2 className="text-lg font-serif font-bold text-[#1E1E1E] mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#B79A63]" /> Configuration de la salle
                </h2>

                <div className="flex flex-col md:flex-row gap-6 mb-8">
                    <label
                        className="flex items-center gap-3 cursor-pointer group p-4 border rounded-xl flex-1 transition-all hover:border-[#B79A63]"
                        style={{ borderColor: !separated ? "#B79A63" : "#D4D2CF", backgroundColor: !separated ? "#F8F5F0" : "transparent" }}
                        onClick={() => setValue("separated_spaces", false)}
                    >
                        <input
                            type="radio"
                            readOnly
                            checked={!separated}
                            className="w-5 h-5 accent-[#B79A63] cursor-pointer"
                        />
                        <div>
                            <span className="text-sm font-bold text-[#1E1E1E] block">Salle unique</span>
                            <span className="text-xs text-[#1E1E1E]/60">Événement mixte</span>
                        </div>
                    </label>

                    <label
                        className="flex items-center gap-3 cursor-pointer group p-4 border rounded-xl flex-1 transition-all hover:border-[#B79A63]"
                        style={{ borderColor: separated ? "#B79A63" : "#D4D2CF", backgroundColor: separated ? "#F8F5F0" : "transparent" }}
                        onClick={() => setValue("separated_spaces", true)}
                    >
                        <input
                            type="radio"
                            readOnly
                            checked={separated}
                            className="w-5 h-5 accent-[#B79A63] cursor-pointer"
                        />
                        <div>
                            <span className="text-sm font-bold text-[#1E1E1E] block">Salles séparées</span>
                            <span className="text-xs text-[#1E1E1E]/60">Femmes / Hommes</span>
                        </div>
                    </label>
                </div>

                {/* Conditional Rendering based on separated spaces */}
                {separated ? (
                    <div className="bg-[#1E1E1E]/5 p-6 rounded-2xl border border-[#D4D2CF] space-y-4">
                        <div className="flex justify-between items-center bg-[#F8F5F0] px-4 py-2 rounded-lg border border-[#D4D2CF]">
                            <span className="text-sm font-bold text-[#1E1E1E]">Places restantes à répartir :</span>
                            <span className={cn("font-bold text-lg", remainingToDistribute === 0 ? "text-green-600" : "text-[#B79A63]")}>
                                {remainingToDistribute}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-[#1E1E1E]">Capacité Femmes</Label>
                                <GildedInput type="number" {...register("salle_femmes_cap", { valueAsNumber: true })} placeholder="0" className={cn(errors.salle_femmes_cap && "border-red-500")} />
                                {errors.salle_femmes_cap && <p className="text-red-500 text-xs mt-1">{errors.salle_femmes_cap.message as string}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-[#1E1E1E]">Capacité Hommes</Label>
                                <GildedInput type="number" {...register("salle_hommes_cap", { valueAsNumber: true })} placeholder="0" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#1E1E1E]/5 p-6 rounded-2xl border border-[#D4D2CF] space-y-4 opacity-70">
                        <Label className="text-sm font-bold text-[#1E1E1E]">Capacité Globale Mixte (Miroir)</Label>
                        <GildedInput type="number" value={maxCap} disabled className="bg-[#F8F5F0]" />
                        <p className="text-xs text-[#1E1E1E]/60"><Info className="inline w-3 h-3 mr-1" /> Cette valeur reprend automatiquement la capacité maximale.</p>
                    </div>
                )}
            </div>

            {/* Annex Spaces */}
            <div className="pt-8 border-t border-[#D4D2CF]">
                <h2 className="text-lg font-serif font-bold text-[#1E1E1E] mb-4">Espaces Annexes</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Salle Dinatoire */}
                    <div className="border border-[#D4D2CF] rounded-xl p-4 transition-colors focus-within:border-[#B79A63]">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" {...register("salle_dinatoire")} className="w-5 h-5 accent-[#B79A63] rounded border-[#D4D2CF]" />
                            <span className="text-sm font-bold text-[#1E1E1E]">Salle dinatoire séparée</span>
                        </label>
                        {salleDinatoire && (
                            <div className="mt-4 pt-4 border-t border-[#D4D2CF] animate-in slide-in-from-top-2">
                                <Label className="text-xs text-[#1E1E1E]/60 mb-1 block">Couverts par service (Max {maxCap})</Label>
                                <GildedInput type="number" {...register("couverts_par_service", { valueAsNumber: true })} placeholder="Ex: 150" className={cn("h-10 text-sm", errors.couverts_par_service && "border-red-500")} />
                                {errors.couverts_par_service && <p className="text-red-500 text-xs mt-1">{errors.couverts_par_service.message as string}</p>}
                            </div>
                        )}
                    </div>

                    {/* Espaces Exterieurs (Jardin / Terrasse / Piscine) */}
                    {['jardin', 'terrasse', 'piscine', 'salle_attente'].map((space) => {
                        const labels: Record<string, string> = {
                            jardin: "Jardin",
                            terrasse: "Terrasse / Rooftop",
                            piscine: "Piscine",
                            salle_attente: "Salle d'attente",
                        };
                        return (
                            <div key={space} className="border border-[#D4D2CF] rounded-xl p-4 flex items-center transition-colors">
                                <label className="flex items-center gap-3 cursor-pointer w-full">
                                    <input type="checkbox" {...register(space)} className="w-5 h-5 accent-[#B79A63] rounded border-[#D4D2CF]" />
                                    <span className="text-sm font-bold text-[#1E1E1E]">{labels[space]}</span>
                                </label>
                            </div>
                        );
                    })}

                    {/* Parking & Loges (with dynamic fields) */}
                    {/* Parking */}
                    <div className="border border-[#D4D2CF] rounded-xl p-4 transition-colors focus-within:border-[#B79A63]">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" {...register("parking")} className="w-5 h-5 accent-[#B79A63] rounded border-[#D4D2CF]" />
                            <span className="text-sm font-bold text-[#1E1E1E]">Parking</span>
                        </label>
                        {watch("parking") && (
                            <div className="mt-4 pt-4 border-t border-[#D4D2CF] animate-in slide-in-from-top-2">
                                <Label className="text-xs text-[#1E1E1E]/60 mb-1 block">Places disponibles</Label>
                                <GildedInput type="number" {...register("parking_places", { valueAsNumber: true })} placeholder="100" className="h-10 text-sm" />
                            </div>
                        )}
                    </div>

                    {/* Loges */}
                    {['loge_maries', 'loge_invites'].map((loge) => {
                        const label = loge === 'loge_maries' ? "Loge Mariés" : "Loge Invités";
                        const fieldName = `${loge}_nb`;
                        const isChecked = watch(loge);

                        return (
                            <div key={loge} className="border border-[#D4D2CF] rounded-xl p-4 transition-colors focus-within:border-[#B79A63]">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" {...register(loge)} className="w-5 h-5 accent-[#B79A63] rounded border-[#D4D2CF]" />
                                    <span className="text-sm font-bold text-[#1E1E1E]">{label}</span>
                                </label>
                                {isChecked && (
                                    <div className="mt-4 pt-4 border-t border-[#D4D2CF] animate-in slide-in-from-top-2">
                                        <Label className="text-xs text-[#1E1E1E]/60 mb-1 block">Quantité</Label>
                                        <GildedInput type="number" {...register(fieldName, { valueAsNumber: true })} placeholder="1" className="h-10 text-sm" />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
