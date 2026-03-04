import { useOnboardingStore } from "@/store/useOnboardingStore";
import { Label } from "@/components/ui/label";
import { GildedInput } from "@/components/ui/gilded-input";

export const VenueSpecifics = () => {
    const { specifics, updateSpecifics } = useOnboardingStore();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div>
                <h3 className="text-xl font-serif text-[#1E1E1E] mb-2">Les espaces de votre salle</h3>
                <p className="text-[#1E1E1E]/60 text-sm mb-6">Précisez la capacité d'accueil pour vos invités.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <Label>Capacité Minimum (Invités)</Label>
                        <GildedInput
                            type="number"
                            placeholder="Ex: 50"
                            value={specifics.capacityMin || ''}
                            onChange={(e) => updateSpecifics({ capacityMin: Number(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-3">
                        <Label>Capacité Maximum (Invités)</Label>
                        <GildedInput
                            type="number"
                            placeholder="Ex: 500"
                            value={specifics.capacityMax || ''}
                            onChange={(e) => updateSpecifics({ capacityMax: Number(e.target.value) })}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <Label className="text-lg font-serif">Option de séparation H/F</Label>
                <label className="flex items-center gap-3 p-4 rounded-xl border border-[#D4D2CF]/60 hover:border-[#B79A63]/50 bg-white cursor-pointer transition-all">
                    <input
                        type="checkbox"
                        className="w-5 h-5 accent-[#B79A63]"
                        checked={!!specifics.separatedSpaces}
                        onChange={(e) => updateSpecifics({ separatedSpaces: e.target.checked })}
                    />
                    <span className="text-[#1E1E1E] font-medium">Je dispose de deux salles (ou espaces) séparés Hommes / Femmes</span>
                </label>
            </div>
        </div>
    );
};
