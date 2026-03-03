import { useOnboardingStore } from "@/store/useOnboardingStore";
import { CheckboxOption } from "./CheckboxOption";

export const MusicSpecifics = () => {
    const { specifics, toggleSpecificArrayItem } = useOnboardingStore();

    const styles = ['Chaoui', 'Kabyle', 'Rai', 'Staifi', 'Occidental', 'Orientale', 'Andalou'];
    const equips = ['Sonorisation complète', 'Jeux de lumières', 'Machine à fumée lourde', 'Écrans/Projecteur', 'DJ Set', 'Instruments traditionnels'];

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
            <div className="space-y-4">
                <h3 className="text-xl font-serif text-[#1E1E1E] mb-2">Styles Musicaux</h3>
                <p className="text-[#1E1E1E]/60 text-sm mb-4">Sélectionnez les styles de musique que vous maîtrisez le mieux.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {styles.map(opt => (
                        <CheckboxOption
                            key={opt}
                            label={opt}
                            checked={(specifics.musicStyles || []).includes(opt)}
                            onChange={() => toggleSpecificArrayItem('musicStyles', opt)}
                        />
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-serif text-[#1E1E1E] mb-2">Matériel Fourni</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {equips.map(opt => (
                        <CheckboxOption
                            key={opt}
                            label={opt}
                            checked={(specifics.equipmentProvided || []).includes(opt)}
                            onChange={() => toggleSpecificArrayItem('equipmentProvided', opt)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
