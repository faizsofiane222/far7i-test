import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useOnboardingStore, CategorySlug } from "@/store/useOnboardingStore";
import { GildedButton } from "@/components/ui/gilded-button";
import { ChevronLeft, ChevronRight, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Step1_Identity } from "@/components/partner/onboarding/Step1_Identity";
import { Step2_Specifics } from "@/components/partner/onboarding/Step2_Specifics";
import { Step3_Media } from "@/components/partner/onboarding/Step3_Media";
import { Step4_Pricing } from "@/components/partner/onboarding/Step4_Pricing";
import { compressAndUpload } from "@/lib/image-utils";

const STEPS = [
    { id: 1, title: 'Identité' },
    { id: 2, title: 'Spécificités' },
    { id: 3, title: 'Médias' },
    { id: 4, title: 'Tarification' },
];

export default function OnboardingWizard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const state = useOnboardingStore();
    const { step, nextStep, prevStep } = state;

    useEffect(() => {
        // Reset state on mount if needed, or we keep it for drafts.
    }, []);

    const validateStep = () => {
        if (step === 1) {
            if (!state.categorySlug || !state.commercialName || !state.wilayaId || state.eventsAccepted.length === 0) {
                toast.error("Veuillez remplir tous les champs obligatoires de l'étape 1.");
                return false;
            }
        }
        if (step === 3) {
            if (!state.description || state.media.length === 0) {
                toast.error("Veuillez ajouter une description et au moins une photo.");
                return false;
            }
        }
        if (step === 4 && state.categorySlug !== 'lieu_de_reception') {
            if (!state.basePrice || state.priceFactors.length === 0) {
                toast.error("Veuillez indiquer un prix de base et au moins un critère de variation.");
                return false;
            }
        }
        return true;
    };

    const isLastStep = state.categorySlug === 'lieu_de_reception' ? step === 3 : step === 4;

    const isCateringCategory = (slug: string) =>
        ['traiteur', 'gateau_traditionnel', 'patisserie_sales', 'piece_montee_tartes'].includes(slug);

    const handleNext = async () => {
        if (validateStep()) {
            // Désormais, on redirige systématiquement vers les éditeurs spécialisés dès l'étape 1
            if (step === 1 && user) {
                setIsSubmitting(true);
                try {
                    // Toujours créer une NOUVELLE prestation (un nouveau provider) 
                    // car un utilisateur peut en posséder plusieurs.
                    const { data: newProvider, error: createError } = await supabase
                        .from('providers')
                        .insert({
                            user_id: user.id,
                            commercial_name: state.commercialName,
                            wilaya_id: state.wilayaId || null,
                            address: state.address,
                            category_slug: state.categorySlug,
                            events_accepted: state.eventsAccepted,
                            moderation_status: 'pending',
                            phone_number: state.phoneNumber,
                            is_whatsapp_active: state.isWhatsappActive,
                            is_viber_active: state.isViberActive
                        })
                        .select('id')
                        .single();

                    if (createError) throw createError;

                    // REDIRECTION IMMEDIATE VERS L'EDITEUR SUR-MESURE AVEC L'ID CREE
                    const targetId = newProvider.id;
                    if (state.categorySlug === 'lieu_de_reception') {
                        toast.success("Profil Salle initialisé !");
                        navigate(`/partner/dashboard/services/venues/${targetId}/edit?onboarding=true`);
                    } else if (isCateringCategory(state.categorySlug)) {
                        toast.success("Profil Traiteur initialisé !");
                        navigate(`/partner/dashboard/services/catering/${targetId}/edit?onboarding=true`);
                    } else if (state.categorySlug === 'dj_orchestre') {
                        toast.success("Profil DJ/Orchestre initialisé !");
                        navigate(`/partner/dashboard/services/dj-orchestra/${targetId}/edit?onboarding=true`);
                    } else if (state.categorySlug === 'photographe') {
                        toast.success("Profil Photographe initialisé !");
                        navigate(`/partner/dashboard/services/photographer/${targetId}/edit?onboarding=true`);
                    } else if (state.categorySlug === 'beaute_bien_etre' || state.categorySlug === 'habilleuse' || state.categorySlug === 'coiffure_beaute') {
                        toast.success("Profil Beauté initialisé !");
                        navigate(`/partner/dashboard/services/${targetId}/edit?onboarding=true`);
                    } else {
                        // Par défaut, éditeur générique
                        navigate(`/partner/dashboard/services/${targetId}/edit?onboarding=true`);
                    }
                    return;

                } catch (error: any) {
                    console.error("Erreur création prestation:", error);
                    toast.error("Erreur lors de la préparation de votre profil.");
                } finally {
                    setIsSubmitting(false);
                }
            } else {
                if (!isLastStep) {
                    nextStep();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }
        }
    };

    const handleSubmit = async () => {
        if (!validateStep() || !user) return;

        setIsSubmitting(true);
        try {
            // 1. Fetch provider ID
            const { data: provider, error: providerError } = await supabase
                .from('providers')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (providerError || !provider) throw new Error("Prestataire introuvable.");

            const providerId = provider.id;

            // 2. Update Provider (Step 1, 3, 4 data)
            const { error: updateError } = await supabase
                .from('providers')
                .update({
                    commercial_name: state.commercialName,
                    wilaya_id: state.wilayaId || null,
                    address: state.address,
                    travel_wilayas: state.travelWilayas,
                    category_slug: state.categorySlug,
                    events_accepted: state.eventsAccepted,
                    description: state.description,
                    base_price: Number(state.basePrice),
                    price_factors: state.priceFactors,
                    phone_number: state.phoneNumber,
                    is_whatsapp_active: state.isWhatsappActive,
                    is_viber_active: state.isViberActive,
                    moderation_status: 'pending' // Mark for review
                })
                .eq('id', providerId);

            if (updateError) throw updateError;

            // 3. Upload Media & save to provider_media
            for (const m of state.media) {
                if (m.file) {
                    const { publicUrl, error: uploadError } = await compressAndUpload(
                        m.file,
                        user.id,
                        { folder: providerId }
                    );

                    if (uploadError) throw uploadError;

                    await supabase.from('provider_media').insert({
                        provider_id: providerId,
                        media_url: publicUrl,
                        is_main: m.isMain
                    });
                }
            }

            // 4. Save Specifics based on Category
            // 4. Save Specifics based on Category
            // Convert camelCase keys to snake_case for PostgreSQL
            const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            const specificData: Record<string, any> = { provider_id: providerId };

            Object.entries(state.specifics).forEach(([key, value]) => {
                if (value !== undefined) {
                    specificData[toSnakeCase(key)] = value;
                }
            });

            const categoryToTable: Record<CategorySlug, string> = {
                'lieu_de_reception': 'provider_venues',
                'traiteur': 'provider_catering',
                'gateau_traditionnel': 'provider_catering',
                'patisserie_sales': 'provider_catering',
                'piece_montee_tartes': 'provider_catering',
                'dj_orchestre': 'provider_music',
                'animation_musicale_traditionnelle': 'provider_music',
                'photographe': '', // No specific table
                'location_tenues': 'provider_rentals',
                'location_voiture': 'provider_rentals',
                'habilleuse': 'provider_beauty',
                'coiffure_beaute': 'provider_beauty',
                'beaute_bien_etre': 'provider_beauty',
                '': ''
            };

            const tableName = categoryToTable[state.categorySlug];
            if (tableName) {
                // Upsert specifics
                const { error: specError } = await supabase
                    .from(tableName as any)
                    .upsert(specificData);

                if (specError) {
                    console.error("Specifics error:", specError);
                    // Non-fatal, but log it. Or throw.
                }
            }

            toast.success("Votre profil a été soumis et est en cours de modération ! 🎉");
            state.reset();
            navigate('/partner/dashboard/profile');

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Une erreur est survenue lors de l'enregistrement.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCFB] pb-32">
            {/* Header / Progress Bar */}
            <div className="bg-white border-b border-[#D4D2CF] sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#B79A63] uppercase tracking-widest">Étape {step} sur 4</span>
                    </div>
                    <div className="flex gap-2">
                        {STEPS.filter(s => state.categorySlug === 'lieu_de_reception' ? s.id !== 4 : true).map((s) => (
                            <div key={s.id} className="flex flex-col items-center gap-1 w-16 sm:w-24">
                                <div className={`h-1.5 w-full rounded-full transition-colors ${step >= s.id ? 'bg-[#B79A63]' : 'bg-[#D4D2CF]/40'}`} />
                                <span className={`text-[10px] uppercase font-bold tracking-wider hidden sm:block ${step >= s.id ? 'text-[#1E1E1E]' : 'text-[#1E1E1E]/40'}`}>{s.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-3xl mx-auto px-6 mt-12">
                <div className="bg-white rounded-3xl p-8 md:p-12 border border-[#D4D2CF]/60 shadow-sm relative overflow-hidden">
                    {step === 1 && <Step1_Identity />}
                    {step === 2 && <Step2_Specifics />}
                    {step === 3 && <Step3_Media />}
                    {step === 4 && state.categorySlug !== 'lieu_de_reception' && <Step4_Pricing />}
                </div>

                {/* Navigation Actions */}
                <div className="mt-8 flex items-center justify-between">
                    <div>
                        {step > 1 && (
                            <button
                                onClick={() => { prevStep(); window.scrollTo({ top: 0 }); }}
                                className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#1E1E1E]/60 hover:text-[#B79A63] transition-colors h-12 px-6 rounded-full hover:bg-white"
                            >
                                <ChevronLeft className="w-4 h-4" /> Retour
                            </button>
                        )}
                    </div>

                    <div>
                        {!isLastStep ? (
                            <GildedButton onClick={handleNext}>
                                Continuer <ChevronRight className="w-4 h-4 ml-2" />
                            </GildedButton>
                        ) : (
                            <GildedButton
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="bg-[#1E1E1E] text-white hover:bg-[#B79A63]"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</>
                                ) : (
                                    <><Save className="w-4 h-4 mr-2" /> Soumettre mon profil</>
                                )}
                            </GildedButton>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
