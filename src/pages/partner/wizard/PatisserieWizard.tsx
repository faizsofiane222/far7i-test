import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

import { patisserieSchema, type PatisserieFormValues } from "./patisserie/schema";
import IdentityStep from "./patisserie/steps/IdentityStep";
import SpecialtiesStep from "./patisserie/steps/SpecialtiesStep";
import LogisticsStep from "./patisserie/steps/LogisticsStep";
import PricingStep from "./patisserie/steps/PricingStep";
import MediaStep from "./patisserie/steps/MediaStep";

const STEPS = [
    { id: 1, label: "Identité" },
    { id: 2, label: "Spécialités" },
    { id: 3, label: "Logistique" },
    { id: 4, label: "Tarification" },
    { id: 5, label: "Médias" },
];

export default function PatisserieWizard() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(!!id);
    const [saving, setSaving] = useState(false);
    const [providerId, setProviderId] = useState<string | null>(id || null);

    const methods = useForm<PatisserieFormValues>({
        resolver: zodResolver(patisserieSchema),
        defaultValues: {
            commercial_name: "",
            category_slug: "piece_montee_tartes",
            wilaya_id: "",
            address: "",
            events_accepted: [],
            bio: "",
            produitsProposes: [],
            personnalisationPossible: false,
            optionsPersonnalisation: [],
            installationSurLieu: false,
            livraisonPossible: false,
            wilayasLivraison: [],
            prixAPartirDeDAParPiece: 0,
            acompteMontantDA: 0,
            politiqueAnnulation: "",
            media: [],
            formulaire_far7i: true,
            phone: "",
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
                    provider_catering(product_types, delivery_options)
                `)
                .eq("id", id)
                .single();

            if (error) throw error;

            if (provider) {
                const catering = (provider.provider_catering as any)?.[0] || (provider.provider_catering as any) || {};
                const mediaUrls = provider.provider_media?.map((m: any) => m.media_url) || [];

                const deliveryOptions: string[] = catering.delivery_options || [];

                // Parse deliveryOptions back to form states
                const installationSurLieu = deliveryOptions.includes("installation");
                const personnalisationPossible = deliveryOptions.includes("personnalisation");

                const acompteOpt = deliveryOptions.find(opt => opt.startsWith("acompte:"));
                const acompteMontantDA = acompteOpt ? parseInt(acompteOpt.split(":")[1]) : (deliveryOptions.includes("acompte") ? 1 : 0);

                const annulationOpt = deliveryOptions.find(opt => opt.startsWith("annulation:"));
                const politiqueAnnulation = annulationOpt ? annulationOpt.split(":")[1] : "";

                const optionsPersonnalisation = deliveryOptions
                    .filter(opt => opt.startsWith("perso:"))
                    .map(opt => opt.split(":")[1]);

                reset({
                    commercial_name: provider.commercial_name || "",
                    category_slug: "piece_montee_tartes",
                    wilaya_id: provider.wilaya_id || "",
                    address: provider.address || "",
                    events_accepted: provider.events_accepted || [],
                    bio: provider.bio || "",
                    produitsProposes: catering.product_types || [],
                    personnalisationPossible,
                    optionsPersonnalisation,
                    installationSurLieu,
                    livraisonPossible: (provider.travel_wilayas?.length > 0) || false,
                    wilayasLivraison: provider.travel_wilayas || [],
                    prixAPartirDeDAParPiece: provider.base_price || 0,
                    acompteMontantDA,
                    politiqueAnnulation,
                    media: mediaUrls,
                    formulaire_far7i: true,
                    phone: provider.phone_number || "",
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

    const getFieldsForStep = (stepNumber: number): (keyof PatisserieFormValues)[] => {
        switch (stepNumber) {
            case 1: return ["commercial_name", "wilaya_id", "events_accepted"];
            case 2: return ["produitsProposes"];
            case 3: return ["wilayasLivraison", "livraisonPossible"];
            case 4: return ["prixAPartirDeDAParPiece", "acompteMontantDA", "politiqueAnnulation"];
            case 5: return ["media", "phone", "formulaire_far7i"];
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

    const onSubmit = async (data: PatisserieFormValues, isDraftOrEvent?: boolean | React.BaseSyntheticEvent) => {
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
                commercial_name: data.commercial_name,
                category_slug: "piece_montee_tartes",
                wilaya_id: data.wilaya_id,
                address: typeof data.address === 'string' ? data.address : data.address.address,
                events_accepted: data.events_accepted,
                bio: data.bio,
                base_price: data.prixAPartirDeDAParPiece,
                travel_wilayas: data.livraisonPossible ? data.wilayasLivraison : [],
                phone_number: data.phone || "",
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

            // 2. Upsert Provider Catering mapping to Piece Montee
            const deliveryOptions = [
                ...(data.installationSurLieu ? ["installation"] : []),
                ...(data.personnalisationPossible ? ["personnalisation"] : []),
                ...(data.optionsPersonnalisation.map(opt => `perso:${opt}`)),
                ...(data.acompteMontantDA ? [`acompte:${data.acompteMontantDA}`] : []),
                ...(data.politiqueAnnulation ? [`annulation:${data.politiqueAnnulation}`] : [])
            ];

            const cateringPayload = {
                provider_id: currentProviderId,
                product_types: data.produitsProposes,
                delivery_options: deliveryOptions,
            };

            const { error: cateringError } = await supabase.from("provider_catering").upsert(cateringPayload);
            if (cateringError) {
                console.warn("Error inserting catering data", cateringError);
            }

            // 3. Media Sync
            if (data.media && data.media.length > 0) {
                await supabase.from("provider_media").delete().eq("provider_id", currentProviderId);
                const mediaPayload = data.media.map((url, i) => ({
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
                    <h1 className="text-4xl font-serif text-[#1E1E1E] mb-8 text-center">Pièce Montée & Tartes</h1>

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
                                {step === 2 && <SpecialtiesStep />}
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
