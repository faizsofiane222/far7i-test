import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

import { locationVoitureSchema, type LocationVoitureFormValues } from "./location-voiture/schema";
import IdentityStep from "./location-voiture/steps/IdentityStep";
import FleetStep from "./location-voiture/steps/FleetStep";
import OrganisationStep from "./location-voiture/steps/OrganisationStep";
import PricingStep from "./location-voiture/steps/PricingStep";
import MediaStep from "./location-voiture/steps/MediaStep";

const STEPS = [
    { id: 1, label: "Identité" },
    { id: 2, label: "Flotte" },
    { id: 3, label: "Organisation" },
    { id: 4, label: "Tarifs" },
    { id: 5, label: "Médias" },
];

export default function LocationVoitureWizard() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(!!id);
    const [saving, setSaving] = useState(false);
    const [providerId, setProviderId] = useState<string | null>(id || null);

    const methods = useForm<LocationVoitureFormValues>({
        resolver: zodResolver(locationVoitureSchema),
        defaultValues: {
            nom: "",
            category_slug: "location_voiture",
            wilaya_id: "",
            adresse: "",
            evenementsAccepte: [],
            description: "",
            prestations: {
                locationAvecChauffeur: false,
                locationSansChauffeur: false,
                vehiculesVintage: false,
                vehiculesUtilitaires: false,
            },
            organisation: {
                dispoHeure: false,
                dispoDemiJournee: false,
                dispoJournee: false,
                priseEnChargeLieuChoisi: false,
            },
            servicesComplementaires: [],
            prixAPartirDeDA: 0,
            acompteMontantDA: 0,
            cautionMontantDA: 0,
            politiqueAnnulation: "",
            galeriePhotos: [],
            utiliserFormulaireFar7i: true,
            telephone: "",
        },
    });

    const { handleSubmit, trigger, getValues, reset } = methods;

    useEffect(() => {
        if (id) {
            fetchProviderData();
        }
    }, [id]);

    const fetchProviderData = async () => {
        try {
            setLoading(true);
            const { data: provider, error } = await supabase
                .from("providers")
                .select(`
                    *,
                    provider_media(media_url, is_main),
                    provider_beauty(service_types, options)
                `)
                .eq("id", id)
                .single();

            if (error) throw error;

            if (provider) {
                const details = (provider.provider_beauty as any)?.[0] || (provider.provider_beauty as any) || {};
                const mediaUrls = provider.provider_media?.map((m: any) => m.media_url) || [];

                const optionsList: string[] = details.options || [];
                const typesList: string[] = details.service_types || [];

                const locationAvecChauffeur = optionsList.includes("chauffeur:avec");
                const locationSansChauffeur = optionsList.includes("chauffeur:sans");

                const vehiculesVintage = typesList.includes("type:vintage");
                const vehiculesUtilitaires = typesList.includes("type:utilitaire");

                const dispoHeure = optionsList.includes("dispo:heure");
                const dispoDemiJournee = optionsList.includes("dispo:demi-journee");
                const dispoJournee = optionsList.includes("dispo:journee");

                const priseEnChargeLieuChoisi = optionsList.includes("logistique:lieu_choisi");

                const servicesComplementaires = optionsList
                    .filter(opt => opt.startsWith("supplementaire:"))
                    .map(opt => opt.replace("supplementaire:", ""));

                const acompteOpt = optionsList.find(opt => opt.startsWith("acompte:"));
                const acompteMontantDA = acompteOpt ? parseInt(acompteOpt.split(":")[1]) : 0;

                const cautionOpt = optionsList.find(opt => opt.startsWith("caution:"));
                const cautionMontantDA = cautionOpt ? parseInt(cautionOpt.split(":")[1]) : 0;

                const annulationOpt = optionsList.find(opt => opt.startsWith("annulation:"));
                const politiqueAnnulation = annulationOpt ? annulationOpt.split(":")[1] : "";

                reset({
                    nom: provider.commercial_name || "",
                    category_slug: "location_voiture",
                    wilaya_id: provider.wilaya_id || "",
                    adresse: provider.address || "",
                    evenementsAccepte: provider.events_accepted || [],
                    description: provider.bio || "",
                    prestations: {
                        locationAvecChauffeur,
                        locationSansChauffeur,
                        vehiculesVintage,
                        vehiculesUtilitaires,
                    },
                    organisation: {
                        dispoHeure,
                        dispoDemiJournee,
                        dispoJournee,
                        priseEnChargeLieuChoisi,
                    },
                    servicesComplementaires,
                    prixAPartirDeDA: provider.base_price || 0,
                    acompteMontantDA,
                    cautionMontantDA,
                    politiqueAnnulation,
                    galeriePhotos: mediaUrls,
                    utiliserFormulaireFar7i: true,
                    telephone: provider.phone_number || "",
                });

                if (provider.moderation_status === "incomplete" || provider.moderation_status === "draft") {
                    setStep(provider.last_saved_step || 1);
                } else {
                    setStep(1); // Default to start for published/pending records
                }
            }
        } catch (error) {
            console.error("Error fetching provider:", error);
            toast.error("Erreur lors du chargement des données");
        } finally {
            setLoading(false);
        }
    };

    const getFieldsForStep = (stepNumber: number): (keyof LocationVoitureFormValues)[] => {
        switch (stepNumber) {
            case 1: return ["nom", "wilaya_id", "evenementsAccepte"];
            case 2: return ["prestations"];
            case 3: return ["organisation"];
            case 4: return ["prixAPartirDeDA", "acompteMontantDA", "cautionMontantDA"];
            case 5: return ["galeriePhotos", "telephone", "utiliserFormulaireFar7i"];
            default: return [];
        }
    };

    const onNext = async () => {
        const fieldsToValidate = getFieldsForStep(step);
        const isValid = await trigger(fieldsToValidate);

        if (isValid) {
            if (step < STEPS.length) {
                setStep(step + 1);
                window.scrollTo(0, 0);
            } else {
                handleSubmit(onSubmit)();
            }
        } else {
            toast.error("Veuillez corriger les erreurs avant de continuer");
        }
    };

    const handleSaveDraft = async () => {
        const data = getValues();
        await onSubmit(data, true);
    };

    const onSubmit = async (data: LocationVoitureFormValues, isDraftOrEvent?: boolean | React.BaseSyntheticEvent) => {
        const isDraft = typeof isDraftOrEvent === 'boolean' ? isDraftOrEvent : false;

        if (!user) {
            toast.error("Vous devez être connecté");
            return;
        }

        try {
            setSaving(true);
            let currentProviderId = providerId;

            // 1. Upsert Provider
            const providerPayload = {
                user_id: user.id,
                commercial_name: data.nom,
                category_slug: "location_voiture",
                wilaya_id: data.wilaya_id,
                address: data.adresse,
                events_accepted: data.evenementsAccepte,
                bio: data.description,
                base_price: data.prixAPartirDeDA,
                phone_number: data.telephone || "",
                moderation_status: isDraft ? "draft" : "pending",
                last_saved_step: isDraft ? step : null,
            };

            if (currentProviderId) {
                const { error } = await supabase
                    .from("providers")
                    .update(providerPayload as any)
                    .eq("id", currentProviderId);
                if (error) throw error;
            } else {
                const { data: newProvider, error } = await supabase
                    .from("providers")
                    .insert(providerPayload as any)
                    .select("id")
                    .single();
                if (error) throw error;
                currentProviderId = newProvider.id;
                setProviderId(currentProviderId);
            }

            // 2. Upsert Provider Details
            const vehicleTypes = [
                ...(data.prestations.vehiculesVintage ? ["type:vintage"] : []),
                ...(data.prestations.vehiculesUtilitaires ? ["type:utilitaire"] : []),
            ];

            const serviceOptions = [
                ...(data.prestations.locationAvecChauffeur ? ["chauffeur:avec"] : []),
                ...(data.prestations.locationSansChauffeur ? ["chauffeur:sans"] : []),
                ...(data.organisation.dispoHeure ? ["dispo:heure"] : []),
                ...(data.organisation.dispoDemiJournee ? ["dispo:demi-journee"] : []),
                ...(data.organisation.dispoJournee ? ["dispo:journee"] : []),
                ...(data.organisation.priseEnChargeLieuChoisi ? ["logistique:lieu_choisi"] : []),
                ...data.servicesComplementaires.map(s => `supplementaire:${s}`),
                ...(data.acompteMontantDA ? [`acompte:${data.acompteMontantDA}`] : []),
                ...(data.cautionMontantDA && data.prestations.locationSansChauffeur ? [`caution:${data.cautionMontantDA}`] : []),
                ...(data.politiqueAnnulation ? [`annulation:${data.politiqueAnnulation}`] : [])
            ];

            const detailsPayload = {
                provider_id: currentProviderId,
                options: serviceOptions,
                service_types: vehicleTypes,
            };

            const { error: detailsError } = await supabase.from("provider_beauty").upsert(detailsPayload);
            if (detailsError) {
                console.warn("Error inserting details data", detailsError);
            }

            // 3. Media Sync
            if (data.galeriePhotos.length > 0) {
                await supabase.from("provider_media").delete().eq("provider_id", currentProviderId);
                const mediaPayload = data.galeriePhotos.map((url, i) => ({
                    provider_id: currentProviderId,
                    media_url: url,
                    is_main: i === 0,
                }));
                const { error: mediaError } = await supabase.from("provider_media").insert(mediaPayload as any);
                if (mediaError) throw mediaError;
            }

            toast.success(isDraft ? "Brouillon sauvegardé" : "Prestation soumise avec succès !");
            if (!isDraft) {
                navigate("/partner/dashboard/services");
            }
        } catch (error: any) {
            console.error("Submission error:", error);
            toast.error("Erreur lors de la sauvegarde : " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-[#B79A63]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCFB] pb-24 font-lato">
            <div className="max-w-4xl mx-auto px-4 pt-12">
                {/* Stepper Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-serif text-[#1E1E1E] mb-8 text-center">Location de Voiture</h1>

                    <div className="flex items-center justify-between relative px-2">
                        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#D4D2CF] -translate-y-1/2 z-0" />
                        {STEPS.map((s) => (
                            <div key={s.id} className="relative z-10 flex flex-col items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                                    step === s.id ? "bg-[#B79A63] border-[#B79A63] text-white shadow-lg shadow-[#B79A63]/20 scale-110" :
                                        step > s.id ? "bg-[#1E1E1E] border-[#1E1E1E] text-white" :
                                            "bg-[#F8F5F0] border-[#D4D2CF] text-[#D4D2CF]"
                                )}>
                                    {step > s.id ? <Check className="w-5 h-5" /> : <span className="text-sm font-bold">{s.id}</span>}
                                </div>
                                <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest hidden md:block",
                                    step === s.id ? "text-[#B79A63]" : "text-[#1E1E1E]/40"
                                )}>
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Container */}
                <div className="bg-[#F8F5F0] border border-[#D4D2CF] rounded-3xl overflow-hidden shadow-sm">
                    <FormProvider {...methods}>
                        <form onSubmit={(e) => { e.preventDefault(); }}>
                            <div className="p-8 md:p-12">
                                {step === 1 && <IdentityStep />}
                                {step === 2 && <FleetStep />}
                                {step === 3 && <OrganisationStep />}
                                {step === 4 && <PricingStep />}
                                {step === 5 && <MediaStep />}
                            </div>

                            {/* Actions Footer */}
                            <div className="px-8 py-6 bg-[#EBE6DA] border-t border-[#D4D2CF] flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
                                    className="text-xs font-bold uppercase tracking-widest text-[#1E1E1E]/60 hover:text-[#1E1E1E] transition-colors"
                                >
                                    {step === 1 ? "Annuler" : "Précédent"}
                                </button>

                                <div className="flex items-center gap-4">
                                    {step < STEPS.length && (
                                        <button
                                            type="button"
                                            onClick={handleSaveDraft}
                                            disabled={saving}
                                            className="px-6 py-3 border border-[#D4D2CF] rounded-xl text-xs font-bold uppercase tracking-widest text-[#1E1E1E] bg-transparent hover:border-[#B79A63] transition-all disabled:opacity-50"
                                        >
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sauvegarder le brouillon"}
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={onNext}
                                        disabled={saving}
                                        className="min-w-[140px] px-6 py-3 rounded-xl bg-[#1E1E1E] text-[#F8F5F0] text-xs font-bold uppercase tracking-widest hover:bg-[#1E1E1E]/90 transition-all flex items-center justify-center"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin text-[#F8F5F0]" /> :
                                            step === STEPS.length ? "Soumettre pour validation" :
                                                <span className="flex items-center gap-2">Suivant <ChevronRight className="w-4 h-4" /></span>}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </FormProvider>
                </div>
            </div>
        </div>
    );
}
