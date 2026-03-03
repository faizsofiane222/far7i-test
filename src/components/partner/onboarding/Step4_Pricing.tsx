import { useOnboardingStore } from "@/store/useOnboardingStore";
import { Label } from "@/components/ui/label";
import { GildedInput } from "@/components/ui/gilded-input";
import { Check } from "lucide-react";

export const Step4_Pricing = () => {
    const {
        basePrice, setBasePrice,
        priceFactors, togglePriceFactor,
        categorySlug,
        specifics, updateSpecifics
    } = useOnboardingStore();

    const factors = [
        'La date (Haute/Basse saison)',
        'Le nombre d\'invités',
        'Les options choisies',
        'Le lieu / Frais de déplacement',
        'L\'urgence de la prestation'
    ];

    return (
        <div className="space-y-10">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-serif text-[#1E1E1E]">Tarification & Logistique</h2>
                <p className="text-[#1E1E1E]/60 mt-2">Détaillez vos offres et rassurez vos clients sur les conditions.</p>
            </div>

            <div className="space-y-4">
                <Label className="text-[#1E1E1E] text-lg font-serif">Prix ​​de base (ou "À partir de") *</Label>
                <div className="relative">
                    <GildedInput
                        type="number"
                        placeholder="Ex: 50000"
                        className="pl-12"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value ? Number(e.target.value) : '')}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1E1E1E]/40 font-bold uppercase tracking-widest text-sm">DA</span>
                </div>
                <p className="text-xs text-[#1E1E1E]/60">Ce prix sera affiché comme référence sur votre vitrine.</p>
            </div>

            {/* Caution Conditionnelle : Uniquement pour location voiture sans chauffeur OU location tenues */}
            {((categorySlug === 'location_voiture' && !specifics.withChauffeur) || categorySlug === 'location_tenues') && (
                <div className="space-y-4 pt-4 border-t border-[#D4D2CF]/30 animate-in fade-in">
                    <Label className="text-[#1E1E1E] text-lg font-serif">Montant de la caution demandée (DA) *</Label>
                    <div className="relative">
                        <GildedInput
                            type="number"
                            placeholder="Ex: 50000"
                            className="pl-12"
                            value={specifics.cautionAmount || ''}
                            onChange={(e) => updateSpecifics({ cautionAmount: Number(e.target.value) })}
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1E1E1E]/40 font-bold uppercase tracking-widest text-sm">DA</span>
                    </div>
                    <p className="text-xs text-[#1E1E1E]/60">Cette somme sera affichée pour informer vos clients à l'avance.</p>
                </div>
            )}

            <div className="space-y-4">
                <Label className="text-[#1E1E1E] text-lg font-serif">Ce prix peut varier selon... *</Label>
                <p className="text-sm text-[#1E1E1E]/60 mb-2">Sélectionnez les critères qui influencent généralement vos devis.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {factors.map(factor => {
                        const isSelected = priceFactors.includes(factor);
                        return (
                            <label
                                key={factor}
                                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-[#B79A63] bg-[#F8F5F0]' : 'border-[#D4D2CF]/60 bg-white hover:border-[#B79A63]/50'
                                    }`}
                            >
                                <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center ${isSelected ? 'bg-[#B79A63] border-[#B79A63]' : 'border-[#D4D2CF]'
                                    }`}>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={isSelected}
                                    onChange={() => togglePriceFactor(factor)}
                                />
                                <span className="text-sm text-[#1E1E1E] font-medium leading-tight">{factor}</span>
                            </label>
                        )
                    })}
                </div>
            </div>

            <div className="space-y-4">
                <Label className="text-[#1E1E1E] text-lg font-serif">Politique de réservation (Optionnel)</Label>
                <div className="p-6 rounded-2xl border border-[#D4D2CF]/60 bg-[#FDFCFB]">
                    <p className="text-sm text-[#1E1E1E]/80 mb-4">
                        Souhaitez-vous informer les clients que des arrhes (acompte) seront nécessaires pour bloquer la date ?
                    </p>
                    {/* Add simple static text or a dedicated switch. Keeping it clean for MVP based on user prompt */}
                    <p className="text-sm text-[#B79A63] font-medium flex items-center gap-2">
                        <Check className="w-4 h-4" /> La politique standard "Acompte requis" sera appliquée.
                    </p>
                </div>
            </div>
        </div>
    );
};
