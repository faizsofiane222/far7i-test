import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { ChevronLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

import { photographeSchema, PhotographeFormValues } from "./photographe/schema";
import IdentityStep from "./photographe/steps/IdentityStep";
import SpecialtiesStep from "./photographe/steps/SpecialtiesStep";
import ServicesStep from "./photographe/steps/ServicesStep";
import PricingStep from "./photographe/steps/PricingStep";
import MediaStep from "./photographe/steps/MediaStep";

const STEPS = [
    { id: 1, title: "Identité" },
    { id: 2, title: "Spécialités" },
    { id: 3, title: "Services" },
    { id: 4, title: "Déplacement & Tarifs" },
    { id: 5, title: "Médias" },
];

export default function PhotographeWizard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const isOnboarding = searchParams.get("onboarding") === "true";

    const [currentStep, setCurrentStep] = useState(1);
    const [providerId, setProviderId] = useState<string | null>(id || null);
    const [loading, setLoading] = useState(!!id);
    const [saving, setSaving] = useState(false);

    const methods = useForm<PhotographeFormValues>({
        resolver: zodResolver(photographeSchema),
        mode: "onChange",
        defaultValues: {
            nom: "",
            category_slug: "photographe",
            wilaya_id: "",
            localisation: "",
            evenementsAccepte: [],
            description: "",
            isPhotographe: false,
            isVideaste: false,
            couverture: [],
            optionsTechniques: [],
            livrables: {
                hasAlbums: false, quantiteAlbums: 1,
                hasAlbumsSupp: false, quantiteAlbumsSupp: 1,
                hasTirages: false, quantiteTirages: 100,
                hasCadres: false, quantiteCadres: 1,
                hasClesUSB: false, quantiteClesUSB: 1,
                livraisonExpress: false,
                filmLong: false,
                filmCourt: false,
            },
            deplacementPossible: false,
            wilayasDeplacement: [],
            prixAPartirDeDA: 0,
            acompteMontantDA: undefined,
            politiqueAnnulation: "",
            delaisLivraisonSemaines: 4,
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
                    .select("*, provider_photographer(*), provider_media(*)")
                    .eq("id", id)
                    .single();

                if (error) throw error;

                if (provider) {
                    setProviderId(provider.id);
                    const photo = (provider.provider_photographer?.[0] as any) || {};
                    const media = provider.provider_media?.map((m: any) => m.media_url) || [];
                    const deliverables = photo.deliverables || [];
                    const technical = photo.technical_options || [];
                    const services = photo.service_types || [];

                    methods.reset({
                        nom: provider.commercial_name || "",
                        wilaya_id: provider.wilaya_id || "",
                        localisation: provider.address || "",
                        evenementsAccepte: provider.events_accepted || [],
                        description: provider.bio || "",

                        isPhotographe: services.includes("photographie"),
                        isVideaste: services.includes("video"),
                        couverture: photo.coverage_options || [],

                        optionsTechniques: technical,
                        livrables: {
                            hasAlbums: deliverables.includes("album_photo"), quantiteAlbums: 1, // Add proper mapping if quantities were saved
                            hasAlbumsSupp: deliverables.includes("album_supp"), quantiteAlbumsSupp: 1,
                            hasTirages: deliverables.includes("tirages_papier"), quantiteTirages: 100,
                            hasCadres: deliverables.includes("cadres_photo"), quantiteCadres: 2,
                            hasClesUSB: deliverables.includes("cle_usb"), quantiteClesUSB: 1,
                            livraisonExpress: deliverables.includes("livraison_express"),
                            filmLong: deliverables.includes("film_long"),
                            filmCourt: deliverables.includes("film_court")
                        },

                        deplacementPossible: (provider.travel_wilayas || []).length > 0,
                        wilayasDeplacement: provider.travel_wilayas || [],

                        prixAPartirDeDA: Number(provider.base_price) || 0,
                        acompteMontantDA: Number(photo.acompte_demande) || 0,
                        politiqueAnnulation: photo.politique_annulation || "",
                        delaisLivraisonSemaines: photo.delivery_time_weeks || 4,

                        galeriePhotos: media,
                        telephone: provider.phone_number || "",
                        utiliserFormulaireFar7i: true,
                    });

                    // Resume step logic based on required fields
                    let calculatedStep = 1;
                    if (provider.commercial_name && provider.events_accepted?.length > 0) calculatedStep = 2;
                    if (calculatedStep === 2 && services.length > 0) calculatedStep = 3;
                    if (calculatedStep === 3) calculatedStep = 4; // Step 3 has no strict required rules (just conditionals)
                    if (calculatedStep === 4 && Number(provider.base_price) > 0) calculatedStep = 5;

                    setCurrentStep(calculatedStep);
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
        if (currentStep === 2) fieldsToValidate = ['isPhotographe', 'isVideaste'];
        if (currentStep === 3) fieldsToValidate = ['livrables']; // checks superRefine partially
        if (currentStep === 4) fieldsToValidate = ['prixAPartirDeDA', 'wilayasDeplacement'];
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

    const onSubmit = async (data: PhotographeFormValues) => {
        setSaving(true);
        try {
            const isValid = await methods.trigger();
            if (!isValid) {
                toast.error("Veuillez vérifier tous vos champs.");
                setSaving(false);
                return;
            }
            await persistData(data, false);
            toast.success("Votre profil Photographe est en ligne !");
            navigate("/partner/dashboard");
        } catch (error: any) {
            toast.error("Erreur de publication: " + error.message);
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const persistData = async (data: PhotographeFormValues, isDraft: boolean) => {
        let currentProviderId = providerId;

        const travelWilayas = data.deplacementPossible ? data.wilayasDeplacement : [];

        const providerPayload = {
            commercial_name: data.nom,
            category_slug: data.category_slug,
            wilaya_id: data.wilaya_id || null,
            address: data.localisation,
            events_accepted: data.evenementsAccepte,
            bio: data.description,
            base_price: data.prixAPartirDeDA,
            travel_wilayas: travelWilayas,
            phone_number: data.telephone || "",
            moderation_status: isDraft ? 'draft' : 'pending'
        };

        if (currentProviderId) {
            await supabase.from('providers').update(providerPayload).eq('id', currentProviderId).throwOnError();
        } else if (user) {
            const { data: newProvider } = await supabase.from('providers').insert({ user_id: user.id, ...providerPayload }).select('id').single().throwOnError();
            currentProviderId = newProvider?.id;
            setProviderId(currentProviderId);
        }

        if (currentProviderId) {
            const services = [];
            if (data.isPhotographe) services.push("photographie");
            if (data.isVideaste) services.push("video");

            const deliverablesList = [];
            if (data.livrables.hasAlbums) deliverablesList.push("album_photo");
            if (data.livrables.hasAlbumsSupp) deliverablesList.push("album_supp");
            if (data.livrables.hasTirages) deliverablesList.push("tirages_papier");
            if (data.livrables.hasCadres) deliverablesList.push("cadres_photo");
            if (data.livrables.hasClesUSB) deliverablesList.push("cle_usb");
            if (data.livrables.livraisonExpress) deliverablesList.push("livraison_express");
            if (data.livrables.filmLong) deliverablesList.push("film_long");
            if (data.livrables.filmCourt) deliverablesList.push("film_court");

            // Store JSON version of quantified deliverables in a real app, but mapping to existing text arrays
            // Currently provider_photographer has string arrays without quantities, so we adapt simply.
            await (supabase as any).from('provider_photographer').upsert({
                provider_id: currentProviderId,
                service_types: services,
                coverage_options: data.couverture,
                technical_options: data.optionsTechniques,
                deliverables: deliverablesList,
                delivery_time_weeks: data.delaisLivraisonSemaines,
                acompte_demande: (data.acompteMontantDA || "").toString(),
                politique_annulation: data.politiqueAnnulation
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
                    <h1 className="text-3xl font-serif font-bold text-[#1E1E1E]">Configuration Photographe</h1>
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
                            {currentStep === 2 && <SpecialtiesStep />}
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
                                <button
                                    type="button"
                                    onClick={handleSaveDraft}
                                    disabled={saving}
                                    className="px-6 py-2.5 rounded-full font-bold text-sm bg-transparent border border-[#D4D2CF] text-[#1E1E1E] hover:border-[#B79A63] hover:text-[#B79A63] transition-all flex items-center"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    Sauvegarder le brouillon
                                </button>

                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={handleNext}
                                    className="px-6 py-2.5 rounded-full font-bold text-sm bg-[#1E1E1E] text-white hover:bg-[#B79A63] transition-all flex items-center"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    {currentStep < 5 ? "Suivant" : "Soumettre"}
                                </button>
                            </div>
                        </div>
                    </form>
                </FormProvider>
            </div>
        </div>
    );
}
