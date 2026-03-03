import { useEffect, useState } from "react";
import { useOnboardingStore, CategorySlug } from "@/store/useOnboardingStore";
import { supabase } from "@/integrations/supabase/client";
import { GildedInput } from "@/components/ui/gilded-input";
import { Label } from "@/components/ui/label";
import { Check, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const CATEGORIES: { slug: CategorySlug; label: string; }[] = [
    { slug: 'lieu_de_reception', label: 'Salle des fêtes / Lieu de réception' },
    { slug: 'traiteur', label: 'Traiteur (repas, restauration)' },
    { slug: 'photographe', label: 'Photographe (photo & vidéo)' },
    { slug: 'dj_orchestre', label: 'DJ / Orchestre' },
    { slug: 'animation_musicale_traditionnelle', label: 'Animation musicale (zorna, karkabou)' },
    { slug: 'piece_montee_tartes', label: 'Pièce montée & Tartes' },
    { slug: 'gateau_traditionnel', label: 'Gâteau traditionnel' },
    { slug: 'patisserie_sales', label: 'Pâtisserie & Salés' },
    { slug: 'location_tenues', label: 'Location des tenues' },
    { slug: 'habilleuse', label: 'Habilleuse (Négafa & mashta)' },
    { slug: 'coiffure_beaute', label: 'Coiffure & beauté' },
    { slug: 'location_voiture', label: 'Location de voiture' },
];

export const Step1_Identity = () => {
    const {
        categorySlug, setCategorySlug,
        commercialName, setCommercialName,
        wilayaId, setWilayaId,
        address, setAddress,
        phoneNumber, setPhoneNumber,
        isWhatsappActive, setIsWhatsappActive,
        isViberActive, setIsViberActive,
        eventsAccepted, toggleEventAccepted,
        travelWilayas, toggleTravelWilaya
    } = useOnboardingStore();

    const [wilayas, setWilayas] = useState<{ id: string, code: string, name: string }[]>([]);
    const [events, setEvents] = useState<{ id: string, label: string, slug: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLookups = async () => {
            const [w, e] = await Promise.all([
                supabase.from('wilayas').select('*').order('code'),
                supabase.from('event_types').select('*').order('label')
            ]);

            if (w.data) setWilayas(w.data);
            if (e.data) setEvents(e.data);
            setIsLoading(false);
        };
        fetchLookups();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-[#1E1E1E]/60">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p>Chargement des données...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-serif text-[#1E1E1E]">Parlez-nous de vous</h2>
                <p className="text-[#1E1E1E]/60 mt-2">Commençons par les bases de votre activité professionnelle.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                    <Label className="text-[#1E1E1E] text-base font-serif">Type d'activité *</Label>
                    <select
                        value={categorySlug}
                        onChange={(e) => setCategorySlug(e.target.value as CategorySlug)}
                        className="w-full bg-white border border-[#D4D2CF] rounded-xl px-4 py-3 h-12 text-[#1E1E1E] outline-none focus:border-[#B79A63] transition-colors appearance-none"
                    >
                        <option value="">Sélectionnez votre activité</option>
                        {CATEGORIES.map(cat => (
                            <option key={cat.slug} value={cat.slug}>{cat.label}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-3">
                    <Label className="text-[#1E1E1E] text-base font-serif">Nom commercial *</Label>
                    <GildedInput
                        value={commercialName}
                        onChange={(e) => setCommercialName(e.target.value)}
                        placeholder="Ex: Salle des fêtes El Djazaïr..."
                    />
                </div>

                <div className="space-y-3">
                    <Label className="text-[#1E1E1E] text-base font-serif">Wilaya (Siège principal) *</Label>
                    <select
                        value={wilayaId}
                        onChange={(e) => setWilayaId(e.target.value)}
                        className="w-full bg-white border border-[#D4D2CF] rounded-xl px-4 py-3 h-12 text-[#1E1E1E] outline-none focus:border-[#B79A63] transition-colors appearance-none"
                    >
                        <option value="">Sélectionnez une wilaya</option>
                        {wilayas.map(w => (
                            <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-3">
                    <Label className="text-[#1E1E1E] text-base font-serif">Adresse (complète) *</Label>
                    <GildedInput
                        value={address || ''}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Ex: 12 Rue Didouche Mourad..."
                    />
                </div>

                <div className="space-y-3">
                    <Label className="text-[#1E1E1E] text-base font-serif">Téléphone *</Label>
                    <GildedInput
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="05XX XX XX XX"
                    />
                </div>

                <div className="flex items-end gap-6 pb-2">
                    <div className="flex items-center gap-3">
                        <Switch
                            id="whatsapp-active"
                            checked={isWhatsappActive}
                            onCheckedChange={setIsWhatsappActive}
                        />
                        <Label htmlFor="whatsapp-active" className="text-sm font-medium cursor-pointer">WhatsApp actif</Label>
                    </div>
                    <div className="flex items-center gap-3">
                        <Switch
                            id="viber-active"
                            checked={isViberActive}
                            onCheckedChange={setIsViberActive}
                        />
                        <Label htmlFor="viber-active" className="text-sm font-medium cursor-pointer">Viber actif</Label>
                    </div>
                </div>
            </div>

            {/* Travel Wilayas - Conditional Rendering */}
            {categorySlug && categorySlug !== 'lieu_de_reception' && (
                <div className="space-y-4 pt-4 border-t border-[#D4D2CF]/50">
                    <Label className="text-[#1E1E1E] text-lg font-serif">Wilayas où vous vous déplacez</Label>
                    <p className="text-sm text-[#1E1E1E]/60 mb-2">Sélectionnez les wilayas où vous acceptez d'aller travailler.</p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {wilayas.map(w => {
                            const isSelected = travelWilayas.includes(w.id);
                            return (
                                <label
                                    key={w.id}
                                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-[#B79A63] bg-[#F8F5F0]' : 'border-[#D4D2CF]/60 bg-white hover:border-[#B79A63]/50'
                                        }`}
                                >
                                    <div className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center ${isSelected ? 'bg-[#B79A63] border-[#B79A63]' : 'border-[#D4D2CF]'
                                        }`}>
                                        {isSelected && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={isSelected}
                                        onChange={() => toggleTravelWilaya(w.id)}
                                    />
                                    <span className="text-sm text-[#1E1E1E] font-medium leading-tight">{w.code} - {w.name}</span>
                                </label>
                            )
                        })}
                    </div>
                </div>
            )}

            <div className="space-y-4 pt-4 border-t border-[#D4D2CF]/50">
                <Label className="text-[#1E1E1E] text-lg font-serif">Types d'événements acceptés *</Label>
                <p className="text-sm text-[#1E1E1E]/60 mb-2">Sélectionnez tous les événements que vous prenez en charge.</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {events.map(event => {
                        const isSelected = eventsAccepted.includes(event.slug);
                        return (
                            <label
                                key={event.id}
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
                                    onChange={() => toggleEventAccepted(event.slug)}
                                />
                                <span className="text-sm text-[#1E1E1E] font-medium leading-tight">{event.label}</span>
                            </label>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};
