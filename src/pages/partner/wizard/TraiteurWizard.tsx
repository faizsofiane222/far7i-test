import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { ChevronLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

import { traiteurSchema, TraiteurFormValues } from "./traiteur/schema";
import IdentityStep from "./traiteur/steps/IdentityStep";
import CapacityStep from "./traiteur/steps/CapacityStep";
import LogisticsStep from "./traiteur/steps/LogisticsStep";
import PricingStep from "./traiteur/steps/PricingStep";
import MediaStep from "./traiteur/steps/MediaStep";

const STEPS = [
    { id: 1, title: "Identité" },
    { id: 2, title: "Spécialités" },
    { id: 3, title: "Logistique" },
    { id: 4, title: "Tarifs" },
    { id: 5, title: "Médias" },
];

export default function TraiteurWizard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const isOnboarding = searchParams.get("onboarding") === "true";

    const [currentStep, setCurrentStep] = useState(1);
    const [providerId, setProviderId] = useState<string | null>(id || null);
    const [loading, setLoading] = useState(!!id);
    const [saving, setSaving] = useState(false);

    const methods = useForm<TraiteurFormValues>({
        resolver: zodResolver(traiteurSchema),
        mode: "onChange",
        defaultValues: {
            nom: "",
            category_slug: "traiteur",
            wilaya_id: "",
            adresse: "",
            evenementsAccepte: [],
            description: "",
            couvertsMinimum: 0,
            couvertsMaximum: 0,
            typeCuisine: [],
            restaurationSalee: [],
            restaurationSucree: [],
            menusTypes: "",
            formulesPersonnalisables: "",
            livraisonPossible: false,
            serviceSurPlace: false,
            personnelDeService: false,
            maitreDHotel: false,
            dressageTables: false,
            decorationSimple: false,
            nettoyage: false,
            locationVaisselle: false,
            locationCouverts: false,
            locationNappes: false,
            gestionAllergies: false,
            prixAPartirDeParPersonneDA: 0,
            acompteMontantDA: 0,
            politiqueAnnulation: "",
            galeriePhotos: [],
            utiliserFormulaireFar7i: true,
            telephone: ""
        }
    });

    useEffect(() => {
        if (!user || !id) {
            setLoading(false);
            return;
        }

        const loadData = async () => {
            setLoading(true);
            try {
                const { data: provider, error } = await supabase
                    .from("providers")
                    .select("*, provider_catering(*), provider_media(*)")
                    .eq("id", id)
                    .single();

                if (error) throw error;

                if (provider) {
                    setProviderId(provider.id);
                    const catering = provider.provider_catering?.[0] || {};
                    const media = provider.provider_media?.map((m: any) => m.media_url) || [];

                    methods.reset({
                        nom: provider.commercial_name || "",
                        wilaya_id: provider.wilaya_id || "",
                        adresse: provider.address || "",
                        evenementsAccepte: provider.events_accepted || [],
                        description: provider.bio || "",

                        couvertsMinimum: catering.min_guests || 0,
                        couvertsMaximum: catering.max_guests || 0,
                        typeCuisine: catering.cuisine_types || [],
                        restaurationSalee: catering.savory_types || [],
                        restaurationSucree: catering.sweet_types || [],
                        menusTypes: catering.menu_examples || "",
                        formulesPersonnalisables: catering.custom_formulas || "",

                        livraisonPossible: catering.delivery_available || false,
                        serviceSurPlace: catering.onsite_service || false,
                        personnelDeService: catering.has_staff || false,
                        maitreDHotel: catering.has_maitre_d || false,
                        dressageTables: catering.table_setup || false,
                        decorationSimple: catering.simple_decor || false,
                        nettoyage: catering.after_cleanup || false,
                        locationVaisselle: catering.rent_plates || false,
                        locationCouverts: catering.rent_cutlery || false,
                        locationNappes: catering.rent_linens || false,
                        gestionAllergies: catering.allergy_friendly || false,

                        prixAPartirDeParPersonneDA: Number(provider.base_price) || 0,
                        acompteMontantDA: Number(catering.deposit_amount) || 0,
                        politiqueAnnulation: catering.cancellation_policy || "",

                        galeriePhotos: media,
                        telephone: provider.phone_number || "",
                        utiliserFormulaireFar7i: true,
                    });

                    if (provider.moderation_status === "incomplete" || provider.moderation_status === "draft") {
                        setCurrentStep(provider.last_saved_step || 1);
                    } else {
                        // Resume step logic for backwards compatibility or pending
                        let calculatedStep = 1;
                        if (provider.commercial_name && catering.min_guests > 0) calculatedStep = 2;
                        if (calculatedStep === 2 && (catering.cuisine_types && catering.cuisine_types.length > 0)) calculatedStep = 3;
                        if (calculatedStep === 3 && provider.base_price > 0) calculatedStep = 4;
                        if (calculatedStep === 4 && media.length > 0) calculatedStep = 5;
                        setCurrentStep(calculatedStep);
                    }
                }
            } catch (error) {
                console.error("Load error:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user, id, methods]);

    const handleSaveDraft = async () => {
        const data = methods.getValues();
        setSaving(true);
        try {
            await persistData(data, true);
            toast.success("Brouillon sauvegardé avec succès");
        } catch (error: any) {
            toast.error("Erreur lors de la sauvegarde: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleNext = async () => {
        let fieldsToValidate: any = [];
        if (currentStep === 1) fieldsToValidate = ['nom', 'wilaya_id', 'evenementsAccepte'];
        if (currentStep === 2) fieldsToValidate = ['couvertsMinimum', 'couvertsMaximum'];
        if (currentStep === 3) fieldsToValidate = []; // simple toggles
        if (currentStep === 4) fieldsToValidate = ['prixAPartirDeParPersonneDA'];
        if (currentStep === 5) fieldsToValidate = ['galeriePhotos'];

        const isValid = await methods.trigger(fieldsToValidate);

        if (isValid) {
            if (currentStep < 5) {
                setCurrentStep((prev) => prev + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
                onSubmit(methods.getValues());
            }
        } else {
            toast.error("Veuillez corriger les erreurs avant de continuer.");
        }
    };

    const onSubmit = async (data: TraiteurFormValues) => {
        setSaving(true);
        try {
            const isValid = await methods.trigger();
            if (!isValid) {
                toast.error("Veuillez vérifier tous vos champs.");
                setSaving(false);
                return;
            }
            await persistData(data, false);
            toast.success("Votre service de traiteur est en ligne !");
            navigate("/partner/dashboard");
        } catch (error: any) {
            toast.error("Erreur de publication: " + error.message);
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const persistData = async (data: TraiteurFormValues, isDraft: boolean) => {
        let currentProviderId = providerId;
        const providerPayload = {
            commercial_name: data.nom,
            category_slug: data.category_slug,
            wilaya_id: data.wilaya_id || null,
            address: typeof data.adresse === 'string' ? data.adresse : data.adresse.address,
            events_accepted: data.evenementsAccepte,
            bio: data.description,
            base_price: data.prixAPartirDeParPersonneDA,
            phone_number: data.telephone || "",
            moderation_status: isDraft ? 'draft' : 'pending',
            last_saved_step: isDraft ? currentStep : null
        };

        if (currentProviderId) {
            await supabase.from('providers').update(providerPayload).eq('id', currentProviderId).throwOnError();
        } else if (user) {
            const { data: newProvider } = await supabase.from('providers').insert({ user_id: user.id, ...providerPayload }).select('id').single().throwOnError();
            currentProviderId = newProvider?.id;
            setProviderId(currentProviderId);
        }

        if (currentProviderId) {
            await supabase.from('provider_catering').upsert({
                provider_id: currentProviderId,
                min_guests: data.couvertsMinimum,
                max_guests: data.couvertsMaximum || null,
                cuisine_types: data.typeCuisine,
                savory_types: data.restaurationSalee,
                sweet_types: data.restaurationSucree,
                menu_examples: data.menusTypes,
                custom_formulas: data.formulesPersonnalisables,
                delivery_available: data.livraisonPossible,
                onsite_service: data.serviceSurPlace,
                has_staff: data.personnelDeService,
                has_maitre_d: data.maitreDHotel,
                table_setup: data.dressageTables,
                simple_decor: data.decorationSimple,
                after_cleanup: data.nettoyage,
                rent_plates: data.locationVaisselle,
                rent_cutlery: data.locationCouverts,
                rent_linens: data.locationNappes,
                allergy_friendly: data.gestionAllergies,
                deposit_amount: data.acompteMontantDA || null,
                cancellation_policy: data.politiqueAnnulation
            }, { onConflict: 'provider_id' }).throwOnError();

            if (data.galeriePhotos && data.galeriePhotos.length > 0) {
                await supabase.from('provider_media').delete().eq('provider_id', currentProviderId);
                const mediaPayload = data.galeriePhotos.map((url, index) => ({
                    provider_id: currentProviderId,
                    media_url: url,
                    is_main: index === 0
                }));
                await supabase.from('provider_media').insert(mediaPayload).throwOnError();
            }
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#B79A63]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F5F0] py-12 px-4 font-lato">
            <div className="max-w-4xl mx-auto">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-serif font-bold text-[#1E1E1E]">Configuration Traiteur</h1>
                    <p className="text-[#1E1E1E]/80 mt-2">Étape {currentStep} sur {STEPS.length}</p>

                    <div className="flex justify-center items-center gap-4 mt-8">
                        {STEPS.map((step, idx) => {
                            const isActive = currentStep === step.id;
                            const isPast = currentStep > step.id;
                            return (
                                <div key={step.id} className="flex items-center">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300",
                                        isActive ? "bg-[#B79A63] text-white shadow-lg scale-110" :
                                            isPast ? "bg-[#1E1E1E] text-white" :
                                                "bg-[#EBE6DA] text-[#1E1E1E]/40"
                                    )}>
                                        {isPast ? <Check className="w-5 h-5" /> : step.id}
                                    </div>
                                    {idx < STEPS.length - 1 && (
                                        <div className={cn(
                                            "w-12 h-[2px] mx-2 transition-colors duration-300",
                                            isPast ? "bg-[#1E1E1E]" : "bg-[#D4D2CF]"
                                        )} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <FormProvider {...methods}>
                    <form onSubmit={methods.handleSubmit(onSubmit)} className="bg-[#EBE6DA] rounded-2xl border border-[#D4D2CF] p-8 shadow-sm transition-all relative">
                        <div className="min-h-[400px]">
                            {currentStep === 1 && <IdentityStep />}
                            {currentStep === 2 && <CapacityStep />}
                            {currentStep === 3 && <LogisticsStep />}
                            {currentStep === 4 && <PricingStep />}
                            {currentStep === 5 && <MediaStep />}
                        </div>

                        <div className="pt-8 mt-8 border-t border-[#D4D2CF] flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(prev => prev - 1)}
                                disabled={currentStep === 1}
                                className="flex items-center gap-2 text-[#1E1E1E]/60 hover:text-[#B79A63] transition-colors disabled:opacity-30"
                            >
                                <ChevronLeft className="w-5 h-5" /> Retour
                            </button>

                            <div className="flex gap-4">
                                {currentStep < STEPS.length && (
                                    <button
                                        type="button"
                                        onClick={handleSaveDraft}
                                        disabled={saving}
                                        className="px-6 py-2.5 rounded-full font-bold text-sm bg-transparent border border-[#D4D2CF] text-[#1E1E1E] hover:border-[#B79A63] hover:text-[#B79A63] transition-all flex items-center"
                                    >
                                        {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                        Sauvegarder le brouillon
                                    </button>
                                )}

                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={handleNext}
                                    className="px-6 py-2.5 rounded-full font-bold text-sm bg-[#1E1E1E] text-white hover:bg-[#B79A63] transition-all flex items-center"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    {currentStep < 5 ? "Suivant" : "Soumettre pour validation"}
                                </button>
                            </div>
                        </div>
                    </form>
                </FormProvider>
            </div>
        </div>
    );
}
