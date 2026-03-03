import { useOnboardingStore } from "@/store/useOnboardingStore";
import { CheckboxOption } from "./CheckboxOption";
import { Label } from "@/components/ui/label";
import { GildedInput } from "@/components/ui/gilded-input";

export const RentalSpecifics = ({ isCar }: { isCar: boolean }) => {
    const { specifics, updateSpecifics, toggleSpecificArrayItem } = useOnboardingStore();

    const vehicleOptions = ['Berline de luxe', 'Limousine', 'Voiture ancienne/Classique', 'SUV', 'Minibus (Cortège)'];
    const dressOptions = ['Karakou', 'Chedda', 'Robe Kabyle', 'Robe Blanche', 'Tenue Chaoui', 'Caftan', 'Blouza'];

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
            {isCar && (
                <div className="space-y-6">
                    <div className="space-y-3">
                        <h3 className="text-xl font-serif text-[#1E1E1E] mb-2">Service Chauffeur</h3>
                        <label className="flex items-center gap-3 p-4 rounded-xl border border-[#D4D2CF]/60 bg-white hover:border-[#B79A63]/50 cursor-pointer transition-all">
                            <input
                                type="checkbox"
                                className="w-5 h-5 accent-[#B79A63]"
                                checked={!!specifics.withChauffeur}
                                onChange={(e) => updateSpecifics({ withChauffeur: e.target.checked })}
                            />
                            <span className="text-[#1E1E1E] font-medium">Je propose le véhicule AVEC un chauffeur inclus</span>
                        </label>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-serif">Types de véhicules</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {vehicleOptions.map(opt => (
                                <CheckboxOption
                                    key={opt}
                                    label={opt}
                                    checked={(specifics.vehicleTypes || []).includes(opt)}
                                    onChange={() => toggleSpecificArrayItem('vehicleTypes', opt)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {!isCar && (
                <div className="space-y-4">
                    <h3 className="text-xl font-serif text-[#1E1E1E] mb-2">Types de tenues proposées</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {dressOptions.map(opt => (
                            <CheckboxOption
                                key={opt}
                                label={opt}
                                // Since we share vehicleTypes functionally for dresses historically, let's remap it if needed 
                                // But historically the useOnboardingStore only had vehicleTypes. Let's map clothing to productTypes temporarily 
                                // Or we can add clothingTypes to the Zustand store. I'll use vehicleTypes as a generic array for now per the old file
                                checked={(specifics.vehicleTypes || []).includes(opt)}
                                onChange={() => toggleSpecificArrayItem('vehicleTypes', opt)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Caution handled at step 4 per the new spec, but preserving it here visually if needed.
                Wait! The user requested "Conditionnel : Afficher le champ 'Caution' uniquement si c'est une location de robe ou de voiture sans chauffeur" in Etape 4. 
                So I will remove it from here. */}
        </div>
    );
};
