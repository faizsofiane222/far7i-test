import React from "react";
import { useFormContext } from "react-hook-form";
import { Info, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

const CUISINES = [
    { id: "traditionnelle_dz", label: "Traditionnelle Algérienne" },
    { id: "moderne_dz", label: "Algérienne Moderne Revisitee" },
    { id: "orientale", label: "Orientale (Moyen-Orient/Maghreb)" },
    { id: "internationale", label: "Internationale / Française" },
    { id: "asiatique", label: "Asiatique" },
    { id: "autre", label: "Autre spécialité" },
];

const SALEES = [
    { id: "buffet", label: "Buffet / Présentoirs" },
    { id: "cocktail", label: "Cocktail dînatoire (Bouchées)" },
    { id: "table", label: "Repas complet servi à table" },
];

const SUCREES = [
    { id: "desserts", label: "Desserts & Verrines" },
    { id: "patisserie", label: "Pâtisserie fine européenne" },
    { id: "gateaux_trad", label: "Gâteaux traditionnels" },
];

export default function CapacityStep() {
    const { register, watch, setValue, formState: { errors } } = useFormContext();

    const typeCuisine = watch("typeCuisine") || [];
    const restaurationSalee = watch("restaurationSalee") || [];
    const restaurationSucree = watch("restaurationSucree") || [];

    const handleCheckboxArrayToggle = (field: string, values: string[], id: string) => {
        if (values.includes(id)) {
            setValue(field, values.filter((v) => v !== id), { shouldValidate: true });
        } else {
            setValue(field, [...values, id], { shouldValidate: true });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-lato">
            <div className="mb-6">
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2 flex items-center gap-2">
                    2. Capacités & Spécialités
                </h2>
                <p className="text-sm text-[#1E1E1E]/80 mb-6">Précisez vos capacités de production et votre style culinaire.</p>
            </div>

            <div className="bg-[#white] p-6 rounded-2xl border border-[#D4D2CF] shadow-sm mb-8">
                <h3 className="text-sm font-bold text-[#1E1E1E] mb-4 flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5 text-[#B79A63]" /> Capacité de gestion (Couverts)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Minimum de couverts *</label>
                        <input
                            type="number"
                            {...register("couvertsMinimum", { valueAsNumber: true })}
                            placeholder="Ex: 50"
                            className={cn("w-full h-12 px-4 rounded-xl border focus:outline-none focus:border-[#B79A63] text-lg font-bold text-[#1E1E1E] transition-colors", errors.couvertsMinimum ? "border-red-500 bg-red-50" : "bg-[#F8F5F0] border-[#D4D2CF]")}
                        />
                        <p className="text-xs text-[#1E1E1E]/80 mt-2">Le seuil de commande à partir duquel vous acceptez les prestations.</p>
                        {errors.couvertsMinimum && <p className="text-red-500 text-xs mt-1">{errors.couvertsMinimum.message as string}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Maximum de couverts (Optionnel)</label>
                        <input
                            type="number"
                            {...register("couvertsMaximum", { valueAsNumber: true })}
                            placeholder="Ex: 800"
                            className="w-full h-12 px-4 rounded-xl border border-[#D4D2CF] bg-[#F8F5F0] focus:outline-none focus:border-[#B79A63] text-lg font-bold text-[#1E1E1E] transition-colors"
                        />
                        <p className="text-xs text-[#1E1E1E]/80 mt-2">Laissez vide si vous n'avez virtuellement pas de limite physique.</p>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-[#D4D2CF]">
                <h3 className="text-sm font-bold text-[#1E1E1E] mb-4">Type(s) de cuisine *</h3>
                <div className="flex flex-wrap gap-3 mb-6">
                    {CUISINES.map((item) => {
                        const isSelected = typeCuisine.includes(item.id);
                        return (
                            <div
                                key={item.id}
                                onClick={() => handleCheckboxArrayToggle("typeCuisine", typeCuisine, item.id)}
                                className={cn(
                                    "px-4 py-2 border rounded-full text-sm font-bold cursor-pointer transition-colors shadow-sm",
                                    isSelected ? "bg-[#1E1E1E] text-white border-[#1E1E1E]" : "bg-white text-[#1E1E1E] border-[#D4D2CF] hover:border-[#B79A63] hover:text-[#B79A63]"
                                )}
                            >
                                {item.label}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-[#D4D2CF]">
                <div>
                    <h3 className="text-sm font-bold text-[#1E1E1E] mb-4">Formats - Restauration Salée</h3>
                    <div className="space-y-3">
                        {SALEES.map(item => {
                            const isChecked = restaurationSalee.includes(item.id);
                            return (
                                <label key={item.id} className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all", isChecked ? "border-[#B79A63] bg-[#B79A63]/5" : "border-[#D4D2CF] bg-[#F8F5F0] hover:border-[#B79A63]")}>
                                    <input type="checkbox" checked={isChecked} onChange={() => handleCheckboxArrayToggle("restaurationSalee", restaurationSalee, item.id)} className="w-5 h-5 accent-[#B79A63]" />
                                    <span className="text-sm font-bold text-[#1E1E1E]">{item.label}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-[#1E1E1E] mb-4">Formats - Restauration Sucrée</h3>
                    <div className="space-y-3">
                        {SUCREES.map(item => {
                            const isChecked = restaurationSucree.includes(item.id);
                            return (
                                <label key={item.id} className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all", isChecked ? "border-[#B79A63] bg-[#B79A63]/5" : "border-[#D4D2CF] bg-[#F8F5F0] hover:border-[#B79A63]")}>
                                    <input type="checkbox" checked={isChecked} onChange={() => handleCheckboxArrayToggle("restaurationSucree", restaurationSucree, item.id)} className="w-5 h-5 accent-[#B79A63]" />
                                    <span className="text-sm font-bold text-[#1E1E1E]">{item.label}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 pt-8 border-t border-[#D4D2CF]">
                <div>
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Menus types proposés</label>
                    <textarea
                        {...register("menusTypes")}
                        rows={4}
                        placeholder="Ex: Menu Tassili (Chorba, Bourek, Couscous Royal, Salade de fruits)..."
                        className="w-full p-4 rounded-xl border border-[#D4D2CF] bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors resize-none"
                    />
                    <p className="text-xs text-[#1E1E1E]/80 mt-2 flex items-center gap-1">
                        <Info className="w-4 h-4 text-[#B79A63] flex-shrink-0" /> Détaillez vos menus signatures pour permettre aux mariés de se projeter.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-2">Formules personnalisables</label>
                    <textarea
                        {...register("formulesPersonnalisables")}
                        rows={3}
                        placeholder="Ex: Nous adaptons nos entrées selon vos goûts. Possibilité de remplacer le dessert par la pièce montée..."
                        className="w-full p-4 rounded-xl border border-[#D4D2CF] bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors resize-none"
                    />
                    <p className="text-xs text-[#1E1E1E]/80 mt-2 flex items-center gap-1">
                        <Info className="w-4 h-4 text-[#B79A63] flex-shrink-0" /> Dites à vos clients jusqu'à quel point ils peuvent ajuster et créer avec vous un menu sur mesure.
                    </p>
                </div>
            </div>

        </div>
    );
}
