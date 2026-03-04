import { useOnboardingStore } from "@/store/useOnboardingStore";
import { CheckboxOption } from "./CheckboxOption";

export const CateringSpecifics = () => {
    const { specifics, toggleSpecificArrayItem } = useOnboardingStore();

    const productOptions = ['Plats Salés (Traditionnels)', 'Plats Salés (Modernes)', 'Gâteaux Traditionnels', 'Pâtisseries & Soirées', 'Pièce Montée', 'Salés / Mini-Salés'];
    const deliveryOptions = ['Livraison sur le lieu', 'Service de serveurs inclus', 'Vaisselle fournie', 'À récupérer sur place'];

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
            <div className="space-y-4">
                <h3 className="text-xl font-serif text-[#1E1E1E] mb-2">Vos Spécialités</h3>
                <p className="text-[#1E1E1E]/60 text-sm mb-4">Cochez uniquement les produits que vous proposez habituellement.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {productOptions.map(opt => (
                        <CheckboxOption
                            key={opt}
                            label={opt}
                            checked={(specifics.productTypes || []).includes(opt)}
                            onChange={() => toggleSpecificArrayItem('productTypes', opt)}
                        />
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-serif text-[#1E1E1E] mb-2">Options et Services</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {deliveryOptions.map(opt => (
                        <CheckboxOption
                            key={opt}
                            label={opt}
                            checked={(specifics.deliveryOptions || []).includes(opt)}
                            onChange={() => toggleSpecificArrayItem('deliveryOptions', opt)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
