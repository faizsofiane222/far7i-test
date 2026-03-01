import { useOnboardingStore } from "@/store/useOnboardingStore";
import { CheckboxOption } from "./CheckboxOption";

export const BeautySpecifics = () => {
    const { specifics, toggleSpecificArrayItem } = useOnboardingStore();
    const services = ['Maquillage Mariée', 'Maquillage Invitée', 'Coiffure Chignon', 'Lissage / Soins', 'Pose Ongles / Cils', 'Hammam / Massage', 'Déplacement à domicile'];

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
            <div className="space-y-4">
                <h3 className="text-xl font-serif text-[#1E1E1E] mb-2">Détail des prestations</h3>
                <p className="text-[#1E1E1E]/60 text-sm mb-4">Cochez ce que comprend votre pack ou spécialité :</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {services.map(opt => (
                        <CheckboxOption
                            key={opt}
                            label={opt}
                            checked={(specifics.servicesIncluded || []).includes(opt)}
                            onChange={() => toggleSpecificArrayItem('servicesIncluded', opt)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
