import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

import { habilleuseSchema, type HabilleuseFormValues } from "./habilleuse/schema";
import IdentityStep from "./habilleuse/steps/IdentityStep";
import ServicesStep from "./habilleuse/steps/ServicesStep";
import LogisticsStep from "./habilleuse/steps/LogisticsStep";
import PricingStep from "./habilleuse/steps/PricingStep";
import MediaStep from "./habilleuse/steps/MediaStep";

const STEPS = [
    { id: 1, label: "Identité" },
    { id: 2, label: "Prestations" },
    { id: 3, label: "Logistique" },
    { id: 4, label: "Tarifs" },
    { id: 5, label: "Médias" },
];

export default function HabilleuseWizard() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(!!id);
    const [saving, setSaving] = useState(false);
    const [providerId, setProviderId] = useState<string | null>(id || null);

    const methods = useForm<HabilleuseFormValues>({
        resolver: zodResolver(habilleuseSchema),
        defaultValues: {
            nom: "",
            category_slug: "habilleuse",
            wilaya_id: "",
            adresse: "",
            evenementsAccepte: [],
            description: "",
            prestationsPrincipales: [],
            optionsServices: [],
            interventionDomicile: false,
            deplacementPossible: false,
            wilayasDeplacement: [],
            prixAPartirDeDA: 0,
            acompteMontantDA: 0,
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
                    provider_beauty(service_options, property_features)
                `)
                .eq("id", id)
                .single();

            if (error) throw error;

            if (provider) {
                // Using provider_beauty for the properties since habilleuse falls under similar logistics
                const details = (provider.provider_beauty as any)?.[0] || (provider.provider_beauty as any) || {};
                const mediaUrls = provider.provider_media?.map((m: any) => m.media_url) || [];

                const optionsList: string[] = details.service_options || [];
                const featuresList: string[] = details.property_features || []; // We'll hijack this for logistics and pricing

                const interventionDomicile = featuresList.includes("intervention_domicile");

                const acompteOpt = featuresList.find(opt => opt.startsWith("acompte:"));
                const acompteMontantDA = acompteOpt ? parseInt(acompteOpt.split(":")[1]) : 0;

                const annulationOpt = featuresList.find(opt => opt.startsWith("annulation:"));
                const politiqueAnnulation = annulationOpt ? annulationOpt.split(":")[1] : "";

                const prestations = optionsList.filter(o => o.startsWith("prestation:")).map(o => o.split(":")[1]);
                const optionsSupp = optionsList.filter(o => o.startsWith("option:")).map(o => o.split(":")[1]);

                reset({
                    nom: provider.commercial_name || "",
                    category_slug: "habilleuse",
                    wilaya_id: provider.wilaya_id || "",
                    adresse: provider.address || "",
                    evenementsAccepte: provider.events_accepted || [],
                    description: provider.bio || "",
                    prestationsPrincipales: prestations.length ? prestations : [],
                    optionsServices: optionsSupp,
                    interventionDomicile,
                    deplacementPossible: (provider.travel_wilayas?.length > 0) || false,
                    wilayasDeplacement: provider.travel_wilayas || [],
                    prixAPartirDeDA: provider.base_price || 0,
                    acompteMontantDA,
                    politiqueAnnulation,
                    galeriePhotos: mediaUrls,
                    utiliserFormulaireFar7i: true,
                    telephone: provider.phone_number || "",
                });
            }
        } catch (error) {
            console.error("Error fetching provider:", error);
            toast.error("Erreur lors du chargement des données");
        } finally {
            setLoading(false);
        }
    };

    const getFieldsForStep = (stepNumber: number): (keyof HabilleuseFormValues)[] => {
        switch (stepNumber) {
            case 1: return ["nom", "wilaya_id", "evenementsAccepte"];
            case 2: return ["prestationsPrincipales"];
            case 3: return ["wilayasDeplacement", "deplacementPossible"];
            case 4: return ["prixAPartirDeDA", "acompteMontantDA", "politiqueAnnulation"];
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

    const onSubmit = async (data: HabilleuseFormValues, isDraftOrEvent?: boolean | React.BaseSyntheticEvent) => {
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
                category_slug: "habilleuse",
                wilaya_id: data.wilaya_id,
                address: data.adresse,
                events_accepted: data.evenementsAccepte,
                bio: data.description,
                base_price: data.prixAPartirDeDA,
                travel_wilayas: data.deplacementPossible ? data.wilayasDeplacement : [],
                phone_number: data.telephone || "",
                moderation_status: isDraft ? "incomplete" : "pending",
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

            // 2. Upsert Provider Details (Using provider_beauty for simplicity and mapping compatibility)
            const serviceOptions = [
                ...(data.prestationsPrincipales.map(p => `prestation:${p}`)),
                ...(data.optionsServices.map(o => `option:${o}`))
            ];

            const propertyFeatures = [
                ...(data.interventionDomicile ? ["intervention_domicile"] : []),
                ...(data.acompteMontantDA ? [`acompte:${data.acompteMontantDA}`] : []),
                ...(data.politiqueAnnulation ? [`annulation:${data.politiqueAnnulation}`] : [])
            ];

            const detailsPayload = {
                provider_id: currentProviderId,
                service_options: serviceOptions,
                property_features: propertyFeatures,
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
                    <h1 className="text-4xl font-serif text-[#1E1E1E] mb-8 text-center">Habilleuse / Négafa</h1>

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
                                {step === 2 && <ServicesStep />}
                                {step === 3 && <LogisticsStep />}
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
                                    <button
                                        type="button"
                                        onClick={handleSaveDraft}
                                        disabled={saving}
                                        className="px-6 py-3 border border-[#D4D2CF] rounded-xl text-xs font-bold uppercase tracking-widest text-[#1E1E1E] bg-transparent hover:border-[#B79A63] transition-all disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sauvegarder le brouillon"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={onNext}
                                        disabled={saving}
                                        className="min-w-[140px] px-6 py-3 rounded-xl bg-[#1E1E1E] text-[#F8F5F0] text-xs font-bold uppercase tracking-widest hover:bg-[#1E1E1E]/90 transition-all flex items-center justify-center"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin text-[#F8F5F0]" /> :
                                            step === STEPS.length ? "Soumettre" :
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
