import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { ChevronLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

import { lieuReceptionSchema, LieuReceptionFormValues } from "./schema";
import IdentityStep from "./steps/IdentityStep";
import CapacityStep from "./steps/CapacityStep";
import ServicesStep from "./steps/ServicesStep";
import PricingStep from "./steps/PricingStep";
import MediaStep from "./steps/MediaStep";

const STEPS = [
    { id: 1, title: "Identité" },
    { id: 2, title: "Capacités" },
    { id: 3, title: "Services" },
    { id: 4, title: "Tarifs" },
    { id: 5, title: "Médias" },
];

export default function LieuReceptionWizard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const isOnboarding = searchParams.get("onboarding") === "true";

    const [currentStep, setCurrentStep] = useState(1);
    const [providerId, setProviderId] = useState<string | null>(id || null);
    const [loading, setLoading] = useState(!!id);
    const [saving, setSaving] = useState(false);

    const methods = useForm<LieuReceptionFormValues>({
        resolver: zodResolver(lieuReceptionSchema),
        mode: "onChange",
        defaultValues: {
            commercial_name: "",
            category_slug: "lieu_de_reception",
            wilaya_id: "",
            address: "",
            events_accepted: [],
            bio: "",
            capaciteMaximale: 0,
            capaciteMinimale: 0,
            separated_spaces: false,
            salle_dinatoire: false,
            jardin: false,
            terrasse: false,
            piscine: false,
            parking: false,
            loge_maries: false,
            loge_invites: false,
            salle_attente: false,
            serveurs: false,
            serveuses: false,
            nettoyage: false,
            securite: false,
            piste_danse: false,
            mobilier: false,
            nappes: false,
            climatisation: false,
            chauffage: false,
            ventilation: false,
            acces_pmr: false,
            sonorisation: false,
            jeux_lumiere: false,
            videoprojecteur: false,
            dj: false,
            animateur: false,
            valet: false,
            cameras: false,
            traiteur_type: "libre",
            cuisine_equipee: false,
            vaisselle: false,
            boissons: false,
            prixAPartirDeDA: 0,
            acompteMontantDA: 0,
            politique_annulation: "",
            plages_horaires: [],
            contraintes: "",
            media: [],
            formulaire_far7i: true,
            phone: ""
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
                    .select("*, provider_venues(*), provider_media(*)")
                    .eq("id", id)
                    .single();

                if (error) throw error;

                if (provider) {
                    setProviderId(provider.id);
                    const venue = provider.provider_venues?.[0] || {};
                    const media = provider.provider_media?.map((m: any) => m.media_url) || [];

                    methods.reset({
                        commercial_name: provider.commercial_name || "",
                        wilaya_id: provider.wilaya_id || "",
                        address: provider.address || "",
                        events_accepted: provider.events_accepted || [],
                        bio: provider.bio || "",
                        capaciteMaximale: venue.capacity_max || 0,
                        capaciteMinimale: venue.capacity_min || 0,
                        separated_spaces: venue.separated_spaces || false,
                        capaciteFemmes: venue.salle_femmes_cap || 0,
                        capaciteHommes: venue.salle_hommes_cap || 0,
                        salle_dinatoire: venue.salle_dinatoire || false,
                        couvertsParService: venue.couverts_par_service || 0,
                        prixAPartirDeDA: Number(provider.base_price) || 0,
                        acompteMontantDA: Number(venue.acompte_montant) || 0,
                        politique_annulation: venue.politique_annulation || "",
                        traiteur_type: venue.traiteur_type || "libre",
                        media,
                        phone: provider.phone_number || "",
                        // Note: Other toggles can be mapped here similarly later. Defaulting to schema values for this scope context.
                    });

                    if (provider.moderation_status === "incomplete" || provider.moderation_status === "draft") {
                        setCurrentStep(provider.last_saved_step || 1);
                    } else {
                        // For backwards compatibility or pending items
                        let calculatedStep = 1;
                        if (provider.commercial_name && venue.capacity_max > 0) calculatedStep = 2;
                        if (calculatedStep === 2 && venue.traiteur_type) calculatedStep = 3;
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
    }, [user, methods]);

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
        if (currentStep === 1) fieldsToValidate = ['commercial_name', 'wilaya_id', 'address', 'events_accepted'];
        if (currentStep === 2) fieldsToValidate = ['capaciteMaximale', 'capaciteFemmes', 'capaciteHommes', 'couvertsParService'];
        if (currentStep === 3) fieldsToValidate = [];
        if (currentStep === 4) fieldsToValidate = ['prixAPartirDeDA', 'acompteMontantDA'];
        if (currentStep === 5) fieldsToValidate = ['media'];

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

    const onSubmit = async (data: LieuReceptionFormValues) => {
        setSaving(true);
        try {
            const isValid = await methods.trigger();
            if (!isValid) {
                toast.error("Veuillez vérifier tous vos champs.");
                setSaving(false);
                return;
            }
            await persistData(data, false);
            toast.success("Votre lieu de réception est en ligne !");
            navigate("/partner/dashboard");
        } catch (error: any) {
            toast.error("Erreur de publication: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const persistData = async (data: LieuReceptionFormValues, isDraft: boolean) => {
        let currentProviderId = providerId;
        const providerPayload = {
            commercial_name: data.commercial_name,
            category_slug: data.category_slug,
            wilaya_id: data.wilaya_id || null,
            address: typeof data.address === 'string' ? data.address : data.address.address,
            events_accepted: data.events_accepted,
            bio: data.bio,
            base_price: data.prixAPartirDeDA,
            phone_number: data.phone || "",
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
            await supabase.from('provider_venues').upsert({
                provider_id: currentProviderId,
                capacity_max: data.capaciteMaximale,
                capacity_min: data.capaciteMinimale,
                separated_spaces: data.separated_spaces,
                salle_femmes_cap: data.capaciteFemmes,
                salle_hommes_cap: data.capaciteHommes,
                salle_mixte_cap: data.separated_spaces ? 0 : data.capaciteMaximale,
                salle_dinatoire: data.salle_dinatoire,
                couverts_par_service: data.couvertsParService,
                acompte_montant: data.acompteMontantDA,
                politique_annulation: data.politique_annulation,
                serveurs_mixte: data.serveurs,
                serveuses_femmes: data.serveuses,
                traiteur_type: data.traiteur_type
            }, { onConflict: 'provider_id' }).throwOnError();

            if (data.media && data.media.length > 0) {
                await supabase.from('provider_media').delete().eq('provider_id', currentProviderId);
                const mediaPayload = data.media.map((url, index) => ({
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
                    <h1 className="text-3xl font-serif font-bold text-[#1E1E1E]">Configuration de votre Lieu</h1>
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
                            {currentStep === 3 && <ServicesStep />}
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
