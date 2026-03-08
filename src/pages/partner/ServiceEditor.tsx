import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
    ChevronLeft,
    ChevronRight,
    Save,
    Image as ImageIcon,
    X,
    Plus,
    Info,
    AlertCircle,
    Check,
    HelpCircle,
    Loader2,
    Trash2,
    Sparkles,
    Eye
} from "lucide-react";
import { GildedButton } from "@/components/ui/gilded-button";
import { GildedInput } from "@/components/ui/gilded-input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
// @ts-ignore
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { cn } from "@/lib/utils";
import { compressAndUpload } from "@/lib/image-utils";
import { SageTip, SAGE_TIPS } from "./components/SageTip";
import { StickyActionBar } from "./components/StickyActionBar";
import { ServicePreviewModal } from "./components/ServicePreviewModal";

// Types
type InclusionType = 'included' | 'optional' | 'excluded';

interface Inclusion {
    id?: string;
    item_text: string;
    inclusion_type: InclusionType;
}

interface Option {
    id?: string;
    title: string;
    description: string;
    price: number;
}

interface FAQ {
    id?: string;
    question: string;
    answer: string;
}

// Removed static CATEGORY_SUGGESTIONS

export default function ServiceEditor({ serviceIdProp, providerIdProp, isNewProp }: { serviceIdProp?: string, providerIdProp?: string, isNewProp?: boolean }) {
    const { id: routeId } = useParams();
    const [searchParams] = useSearchParams();

    const id = serviceIdProp || routeId;
    const isNew = isNewProp || (!id || id === 'new');

    const adminMode = searchParams.get('adminMode') === 'true' || !!providerIdProp;
    const targetProviderId = providerIdProp || searchParams.get('providerId');

    const basePath = adminMode && targetProviderId
        ? `/admin/providers/${targetProviderId}/services`
        : `/partner/dashboard/services`;

    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(1);
    const [noProvider, setNoProvider] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const stripHtml = (html: string) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    };

    // Data State
    const [providerId, setProviderId] = useState<string>("");
    const [commercialName, setCommercialName] = useState<string>("");
    const [categories, setCategories] = useState<{ id: string, label: string }[]>([]);
    const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        service_category_id: "",
        description: "",
        base_price: 0,
        price_unit: "per_event",
        short_pitch: "",
        is_active: true,
    });

    const [media, setMedia] = useState<string[]>([]);
    const [inclusions, setInclusions] = useState<Inclusion[]>([]);
    const [options, setOptions] = useState<Option[]>([]);
    const [faqs, setFaqs] = useState<FAQ[]>([]);

    // Scoring Logic
    const serviceScore = React.useMemo(() => {
        let score = 0;
        const cleanDesc = stripHtml(formData.description);

        // Base Info (Max 30)
        if (formData.title.trim().length >= 3) score += 10;
        if (cleanDesc.trim().length >= 100) score += 10;
        if (media.length >= 1) score += 10;

        // Value (Max 20)
        if (formData.base_price > 0) score += 10;
        if (formData.short_pitch && formData.short_pitch.length >= 5) score += 10;

        // Enrichment (Max 30)
        if (media.length >= 3) score += 10;
        if (inclusions.filter(i => i.inclusion_type === 'included').length >= 3) score += 20;

        // Trust (Max 20)
        if (options.length >= 1) score += 10;
        if (faqs.length >= 2) score += 10;

        return Math.min(score, 100);
    }, [formData, media, inclusions, options, faqs]);

    const getScoreLabel = (score: number) => {
        if (score <= 50) return { label: "Ébauche", color: "text-[#D4D2CF]", bg: "bg-[#D4D2CF]" };
        if (score <= 80) return { label: "Bon", color: "text-[#B79A63]", bg: "bg-[#B79A63]" };
        return { label: "Excellent - Visibilité Maximale", color: "text-[#B79A63] font-bold", bg: "bg-[#B79A63]", icon: Sparkles };
    };

    const canGoToNext = () => {
        if (step === 1) return formData.title.trim().length >= 3 && stripHtml(formData.description).trim().length >= 200 && media.length >= 1;
        if (step === 2) return formData.base_price > 0;
        return true;
    };

    useEffect(() => {
        if (user) {
            fetchInitialData();
            if (!isNew) fetchServiceData();

            // Pre-fill category if provided in URL
            const categoryParam = searchParams.get('category_id');
            if (isNew && categoryParam) {
                setFormData(prev => ({ ...prev, service_category_id: categoryParam }));
            }
        }
    }, [user, id, searchParams]);

    // Fetch suggestions when category changes
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!formData.service_category_id || categories.length === 0) return;

            const categoryLabel = categories.find(c => c.id === formData.service_category_id)?.label;
            if (!categoryLabel) return; // Should not happen if data is consistent

            const { data, error } = await (supabase as any)
                .from('service_category_suggestions')
                .select('item_text')
                .eq('category_label', categoryLabel);

            if (data) {
                setCategorySuggestions(data.map((d: any) => d.item_text));
            } else {
                // Fallback to empty or default if table fetch fails/returns empty
                setCategorySuggestions([]);
            }
        };

        fetchSuggestions();
    }, [formData.service_category_id, categories]);

    const fetchInitialData = async () => {
        let query = supabase
            .from("providers")
            .select(`
                id,
                commercial_name,
                category_slug,
                moderation_status
            `);

        if (adminMode && targetProviderId) {
            query = query.eq("id", targetProviderId);
        } else {
            query = query.eq("user_id", user?.id);
        }

        const { data: provider } = await query.single();

        if (provider) {
            setProviderId(provider.id);
            setCommercialName(provider.commercial_name || "");

            // Fetch the category based on slug
            let targetCategory = null;
            if (provider.category_slug) {
                const { data } = await supabase
                    .from('service_categories')
                    .select('id, label')
                    .eq('slug', provider.category_slug)
                    .single();
                if (data) targetCategory = data;
            }

            const cats = targetCategory ? [targetCategory] : [];

            // If provider exists but has no categories linked yet, load ALL available categories
            if (cats.length === 0) {
                setNoProvider(false); // provider exists, just no linked categories
                const { data: allCats } = await supabase
                    .from('service_categories')
                    .select('id, label')
                    .order('label');
                const allCatsList = allCats || [];
                setCategories(allCatsList);
                if (isNew && allCatsList.length > 0) {
                    const categoryParam = searchParams.get('category_id');
                    setFormData(prev => ({ ...prev, service_category_id: categoryParam || allCatsList[0].id }));
                }
            } else {
                setCategories(cats);
                if (isNew && cats.length > 0) {
                    setFormData(prev => ({ ...prev, service_category_id: cats[0].id }));
                }
            }
        } else {
            // No provider profile at all — still load all categories for the form
            setNoProvider(true);
            const { data: allCats } = await supabase
                .from('service_categories')
                .select('id, label')
                .order('label');
            const allCatsList = allCats || [];
            setCategories(allCatsList);
            if (isNew && allCatsList.length > 0) {
                const categoryParam = searchParams.get('category_id');
                setFormData(prev => ({ ...prev, service_category_id: categoryParam || allCatsList[0].id }));
            }
        }
    };

    const fetchServiceData = async () => {
        try {
            setLoading(true);
            const { data: service, error } = await supabase
                .from('providers')
                .select(`
                    id,
                    commercial_name,
                    category_slug,
                    base_price,
                    moderation_status,
                    pending_changes,
                    provider_media(media_url, is_main, sort_order)
                `)
                .eq("id", id)
                .single();

            if (error) throw error;

            // Specialized Redirects
            const slug = service.category_slug;
            if (slug === "lieu_de_reception" && !window.location.pathname.includes('/venues/')) {
                navigate(`${basePath}/venues/${id}/edit${window.location.search}`, { replace: true });
                return;
            } else if (['traiteur', 'gateau_traditionnel', 'patisserie_sales', 'piece_montee_tartes'].includes(slug || "") && !window.location.pathname.includes('/catering/')) {
                navigate(`${basePath}/catering/${id}/edit${window.location.search}`, { replace: true });
                return;
            } else if (slug === "dj_orchestre" && !window.location.pathname.includes('/dj-orchestra/')) {
                navigate(`${basePath}/dj-orchestra/${id}/edit${window.location.search}`, { replace: true });
                return;
            } else if (slug === "photographe" && !window.location.pathname.includes('/photographer/')) {
                navigate(`${basePath}/photographer/${id}/edit${window.location.search}`, { replace: true });
                return;
            }

            // Moderation check: Load pending if exists (for provider to continue or admin to moderate)
            const hasPending = !!(service as any).pending_changes;
            const dataToLoad = hasPending
                ? { ...service, ...(service as any).pending_changes }
                : service;

            setFormData({
                title: dataToLoad.commercial_name || "",
                service_category_id: dataToLoad.category_slug || "",
                description: dataToLoad.bio || "",
                base_price: Number(dataToLoad.base_price) || 0,
                price_unit: "DA",
                short_pitch: "",
                is_active: dataToLoad.moderation_status === 'approved',
            });

            const pending = (service as any).pending_changes;

            if (hasPending && pending) {
                console.log("Merging pending changes into editor relations...");
                setMedia(pending.media !== undefined ? pending.media : (service.provider_media || []).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)).map((m: any) => m.media_url));
                setInclusions([]);
                setOptions([]);
                setFaqs([]);
            } else {
                console.log("Loading live data from direct relations...");
                setMedia((service.provider_media || []).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)).map((m: any) => m.media_url));
                setInclusions([]);
                setOptions([]);
                setFaqs([]);
            }

        } catch (error: any) {
            toast.error("Erreur lors du chargement de la prestation");
            navigate(basePath);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (submitForValidation: boolean = false) => {
        if (!formData.title || !formData.service_category_id) {
            toast.error("Veuillez remplir le titre et la catégorie");
            setStep(1);
            return;
        }

        // If no provider profile, create a minimal stub first
        let resolvedProviderId = providerId;
        if (!resolvedProviderId && user) {
            try {
                const { data: newProvider, error: createError } = await supabase
                    .from('providers')
                    .upsert({
                        user_id: user.id,
                        commercial_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Mon enseigne',
                        phone_number: user.user_metadata?.phone || '',
                        moderation_status: 'pending'
                    } as any, { onConflict: 'user_id' })
                    .select('id')
                    .single();

                if (createError) throw createError;
                resolvedProviderId = newProvider.id;
                setProviderId(resolvedProviderId);
                setNoProvider(false);
            } catch (err: any) {
                toast.error("Impossible de créer votre profil prestataire : " + err.message);
                return;
            }
        }

        try {
            setSaving(true);

            // 1. Prepare Service Data
            const providerData = {
                commercial_name: formData.title,
                category_slug: formData.service_category_id,
                bio: formData.description,
                base_price: formData.base_price,
                updated_at: new Date().toISOString()
            };

            let currentServiceId = id;

            // MODERATION LOGIC
            let currentStatus = 'incomplete';
            if (!isNew && !adminMode) {
                const { data: curr } = await supabase.from('providers').select('moderation_status').eq('id', id).single();
                currentStatus = curr?.moderation_status || 'incomplete';
            }

            const isAlreadyApproved = currentStatus === 'approved' && !adminMode;

            if (isAlreadyApproved) {
                // MODIFICATION OF LIVE SERVICE: Keep approved, store in pending_changes
                const { error } = await supabase
                    .from("providers") // Update providers table
                    .update({
                        pending_changes: {
                            ...providerData,
                            media,
                        } as any
                    })
                    .eq("id", id);
                if (error) throw error;

                if (submitForValidation) {
                    try {
                        await (supabase.rpc as any)('notify_admins_of_modification', { provider_id: providerId });
                    } catch (notifErr) {
                        console.error("Failed to notify admins:", notifErr);
                    }
                    toast.success("Modifications envoyées pour validation (La version actuelle reste en ligne)");
                } else {
                    toast.success("Brouillon des modifications enregistré");
                }
            } else {
                // NEW OR INCOMPLETE SERVICE: Direct Update
                const targetStatus = adminMode ? 'approved' : (submitForValidation ? 'pending' : 'incomplete');

                if (isNew) {
                    const { data: newProvider, error } = await supabase // Insert into providers
                        .from("providers")
                        .insert({
                            ...providerData,
                            user_id: user?.id, // Ensure user_id is set for new providers
                            moderation_status: targetStatus
                        } as any)
                        .select('id')
                        .single();
                    if (error) throw error;
                    currentServiceId = newProvider.id;
                } else {
                    const { error } = await supabase
                        .from("providers") // Update providers table
                        .update({
                            ...providerData,
                            moderation_status: targetStatus
                        } as any)
                        .eq("id", id);
                    if (error) throw error;
                }

                // 2. Sync Relations (Only if not approved/pending changes flow)
                if (currentServiceId) {
                    await Promise.all([
                        supabase.from("provider_media").delete().eq("provider_id", currentServiceId), // Use provider_media
                        // service_inclusions, service_options, service_faqs are removed
                    ]);

                    const syncRelations = async () => {
                        const relations = [
                            supabase.from("provider_media").insert(media.map((url, idx) => ({ provider_id: currentServiceId, media_url: url, is_main: idx === 0, sort_order: idx }))), // Use provider_media
                            // service_inclusions, service_options, service_faqs are removed
                        ];

                        await Promise.all(relations);
                    };
                    await syncRelations();
                }

                if (submitForValidation) {
                    toast.success("Prestation envoyée pour validation !");
                } else {
                    toast.success("Brouillon enregistré");
                }
            }

            navigate(basePath);

        } catch (error: any) {
            console.error("Save error:", error);
            toast.error("Erreur lors de l'enregistrement: " + error.message);
        } finally {
            setSaving(false);
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
        <div className="max-w-4xl mx-auto pb-36 md:pb-32">
            {/* Trust Pulse Sticky Header */}
            <div className="sticky top-0 z-40 -mx-4 px-4 py-4 bg-white/95 backdrop-blur-md border-b border-[#B79A63]/20 mb-8 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-6">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-16 h-16 -rotate-90">
                            <circle
                                cx="32" cy="32" r="28"
                                className="stroke-[#D4D2CF] fill-none"
                                strokeWidth="5"
                            />
                            <circle
                                cx="32" cy="32" r="28"
                                className="stroke-[#B79A63] fill-none transition-all duration-700 ease-out"
                                strokeWidth="5"
                                strokeDasharray={2 * Math.PI * 28}
                                strokeDashoffset={2 * Math.PI * 28 * (1 - serviceScore / 100)}
                                strokeLinecap="round"
                            />
                        </svg>
                        <span className="absolute text-sm font-bold text-[#B79A63]">{serviceScore}%</span>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <p className={cn("text-sm uppercase tracking-widest font-bold", getScoreLabel(serviceScore).color)}>
                                {getScoreLabel(serviceScore).label}
                            </p>
                            {serviceScore > 80 && <Sparkles className="w-4 h-4 text-[#B79A63] animate-pulse" />}
                        </div>
                        <p className="text-xs text-[#1E1E1E]/50 font-semibold">Indice de Confiance Far7i</p>
                    </div>
                </div>

                <div className="hidden md:block text-right max-w-sm">
                    <p className="text-xs text-[#B79A63] font-bold uppercase tracking-widest mb-1">Guide du Sage</p>
                    <p className="text-sm text-[#1E1E1E]/80 italic font-medium font-lato leading-tight">
                        {serviceScore < 50 ? "Complétez l'essentiel pour être visible et attirer vos premiers clients." :
                            serviceScore < 80 ? "Encore un petit effort pour briller parmi les meilleurs !" :
                                "Votre prestation frise la perfection, vous êtes prêt à rayonner !"}
                    </p>
                </div>
            </div>

            {/* Header & Stepper */}
            <div className="space-y-8 mb-12">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(basePath)} className="p-2 hover:bg-[#F8F5F0] rounded-full text-[#1E1E1E]/40 hover:text-[#B79A63] transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-3xl font-serif font-bold text-[#1E1E1E]">
                        {isNew ? "Nouvelle Prestation" : "Modifier la Prestation"}
                        {adminMode && <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">Admin Mode</span>}
                    </h1>
                </div>

                {/* Info banner: no provider profile yet */}
                {noProvider && !adminMode && (
                    <div className="flex items-start gap-4 bg-blue-50 border border-blue-200 rounded-2xl p-5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Info className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-blue-900">Profil en attente de validation</p>
                            <p className="text-sm text-blue-700 leading-relaxed">
                                Vous pouvez configurer votre prestation dès maintenant. Elle sera enregistrée et soumise à l'équipe Far7i une fois votre profil validé.
                            </p>
                        </div>
                    </div>
                )}

                {/* Horizontal Stepper */}
                <div className="flex items-center justify-between relative px-2">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#D4D2CF] -translate-y-1/2 z-0" />
                    {[
                        { step: 1, label: "Identité", req: true },
                        { step: 2, label: "Valeur", req: true },
                        { step: 3, label: "Flexibilité", req: false },
                        { step: 4, label: "Réassurance", req: false }
                    ].map((s) => (
                        <div key={s.step} className="relative z-10 flex flex-col items-center gap-2">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                step === s.step ? "bg-[#B79A63] border-[#B79A63] text-white" :
                                    step > s.step ? "bg-[#1E1E1E] border-[#1E1E1E] text-white" :
                                        "bg-white border-[#D4D2CF] text-[#D4D2CF]"
                            )}>
                                {step > s.step ? <Check className="w-5 h-5" /> : s.step}
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold uppercase tracking-wider",
                                step === s.step ? "text-[#B79A63]" : step > s.step ? "text-[#1E1E1E]" : "text-[#D4D2CF]"
                            )}>
                                {s.label}
                                {s.req && <span className="text-amber-500 ml-0.5">*</span>}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-2xl border border-[#D4D2CF] p-8 md:p-10 shadow-sm min-h-[500px]">
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <Label className="text-sm font-bold text-[#1E1E1E]">Nom de la prestation</Label>
                                    <SageTip tipId="service_title" />
                                </div>
                                <GildedInput
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder={`Ex: ${categories.find(c => c.id === formData.service_category_id)?.label || "Service"} ${commercialName || "Nom Commercial"}...`}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <Label className="text-sm font-bold text-[#1E1E1E]">Catégorie de service</Label>
                                    <SageTip tipId="service_category" />
                                </div>
                                <select
                                    value={formData.service_category_id}
                                    onChange={(e) => setFormData({ ...formData, service_category_id: e.target.value })}
                                    className="w-full h-11 rounded-xl border border-[#D4D2CF] bg-[#F8F5F0] px-4 font-lato text-sm focus:ring-1 focus:ring-[#B79A63] outline-none"
                                >
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>{c.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-bold text-[#1E1E1E]">Description détaillée</Label>
                                <span className="text-[10px] text-[#B79A63] italic">Utilisez le gras et les listes pour plus de clarté</span>
                            </div>
                            <div className="prose-editor space-y-2">
                                <ReactQuill
                                    theme="snow"
                                    value={formData.description}
                                    onChange={(val) => setFormData({ ...formData, description: val })}
                                    className={cn(
                                        "bg-[#F8F5F0] rounded-xl overflow-hidden transition-all",
                                        stripHtml(formData.description).length > 0 && stripHtml(formData.description).length < 200 ? "border-2 border-amber-400" : "border border-[#D4D2CF]"
                                    )}
                                />
                                <div className="flex justify-end px-2">
                                    <span className={cn(
                                        "text-[10px] font-bold tracking-widest uppercase",
                                        stripHtml(formData.description).length < 200 ? "text-amber-600" : "text-emerald-600"
                                    )}>
                                        {stripHtml(formData.description).length} / 200 caractères minimum
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Label className="text-sm font-bold text-[#1E1E1E]">Photos du service (Max 5)</Label>
                                <SageTip tipId="service_media" />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {media.map((url, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-lg border border-[#D4D2CF] overflow-hidden group">
                                        <img src={url} alt={`Media ${idx}`} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => setMedia(media.filter((_, i) => i !== idx))}
                                            className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {media.length < 5 && (
                                    <>
                                        <input
                                            type="file"
                                            id="media-upload"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file || !user) return;
                                                const toastId = toast.loading("Upload en cours...");
                                                try {
                                                    const { publicUrl, error: uploadError } = await compressAndUpload(
                                                        file,
                                                        user.id,
                                                        { folder: providerId || user.id }
                                                    );
                                                    if (uploadError) throw uploadError;
                                                    setMedia(prev => [...prev, publicUrl]);
                                                    toast.success("Image ajoutée", { id: toastId });
                                                } catch (err: any) {
                                                    toast.error("Échec: " + err.message, { id: toastId });
                                                } finally {
                                                    e.target.value = "";
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={() => document.getElementById('media-upload')?.click()}
                                            className="aspect-square rounded-lg border-2 border-dashed border-[#D4D2CF] flex flex-col items-center justify-center gap-2 text-[#1E1E1E]/40 hover:text-[#B79A63] hover:border-[#B79A63]/50 transition-all hover:bg-[#F8F5F0]"
                                        >
                                            <Plus className="w-6 h-6" />
                                            <span className="text-[10px] uppercase font-bold">Ajouter</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 h-5">
                                    <Label className="text-sm font-bold text-[#1E1E1E]">Prix de base</Label>
                                    <SageTip tipId="service_pricing" />
                                </div>
                                <div className="relative mt-2">
                                    <GildedInput
                                        type="text"
                                        inputMode="numeric"
                                        value={formData.base_price || ""}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9]/g, "");
                                            setFormData({ ...formData, base_price: Number(val) });
                                        }}
                                        className="h-11 pr-12"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#1E1E1E]/40">DZD</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 h-5">
                                    <Label className="text-sm font-bold text-[#1E1E1E]">Unité de prix</Label>
                                </div>
                                <select
                                    value={formData.price_unit}
                                    onChange={(e) => setFormData({ ...formData, price_unit: e.target.value })}
                                    className="w-full h-11 rounded-xl border border-[#D4D2CF] bg-[#F8F5F0] px-4 font-lato text-sm focus:ring-1 focus:ring-[#B79A63] outline-none mt-2"
                                >
                                    <option value="per_event">Par événement</option>
                                    <option value="per_hour">Par heure</option>
                                    <option value="per_day">Par jour</option>
                                    <option value="per_person">Par personne</option>
                                    <option value="fixed">Forfait fixe</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 h-5">
                                    <Label className="text-sm font-bold text-[#1E1E1E]">Mini Accroche (Short Pitch)</Label>
                                    <SageTip tipId="service_pitch" />
                                </div>
                                <GildedInput
                                    value={formData.short_pitch}
                                    onChange={(e) => setFormData({ ...formData, short_pitch: e.target.value })}
                                    className="h-11 mt-2"
                                    placeholder="Ex: Le pack idéal pour 100 invités..."
                                />
                            </div>
                        </div>

                        <div className="space-y-6 pt-6 border-t border-[#F8F5F0]">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-serif font-bold text-[#1E1E1E]">Inclusions & Détails</h3>
                                    <SageTip tipId="service_inclusions" />
                                </div>
                                <p className="text-sm text-[#1E1E1E]/50">Précisez ce qui est exactement compris dans votre tarif de base.</p>
                            </div>

                            {/* Smart Suggestions */}
                            <div className="space-y-4">
                                <Label className="text-[10px] font-bold uppercase text-[#B79A63] tracking-widest">Suggestions suggérées</Label>
                                <div className="flex flex-wrap gap-2">
                                    {(categorySuggestions.length > 0 ? categorySuggestions : ["SAV & Support", "Déplacement", "Assurance"]) // Fallback if no specific suggestions
                                        .filter(s => !inclusions.some(inc => inc.item_text === s))
                                        .map((s, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setInclusions([...inclusions, { item_text: s, inclusion_type: 'included' }])}
                                                className="px-3 py-1.5 rounded-lg border border-[#D4D2CF] text-[11px] font-medium text-[#1E1E1E]/60 hover:border-[#B79A63] hover:text-[#B79A63] transition-all"
                                            >
                                                + {s}
                                            </button>
                                        ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <GildedInput id="new-inclusion" placeholder="Ajouter une inclusion personnalisée..." className="flex-1" />
                                    <GildedButton onClick={() => {
                                        const input = document.getElementById('new-inclusion') as HTMLInputElement;
                                        if (input.value) {
                                            setInclusions([...inclusions, { item_text: input.value, inclusion_type: 'included' }]);
                                            input.value = "";
                                        }
                                    }} size="sm">Ajouter</GildedButton>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {inclusions.map((inc, idx) => (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "flex items-center justify-between p-4 rounded-xl border transition-all group",
                                                inc.inclusion_type === 'included' ? "border-[#4A7A58]/20 bg-[#4A7A58]/5" :
                                                    inc.inclusion_type === 'optional' ? "border-[#5A6B7C]/20 bg-[#5A6B7C]/5" :
                                                        "border-[#A84448]/20 bg-[#A84448]/5"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                                                    inc.inclusion_type === 'included' ? "bg-[#4A7A58] text-white" :
                                                        inc.inclusion_type === 'optional' ? "bg-[#5A6B7C] text-white" :
                                                            "bg-[#A84448] text-white"
                                                )}>
                                                    {inc.inclusion_type === 'included' ? '✓' : inc.inclusion_type === 'optional' ? '+' : '×'}
                                                </div>
                                                <span className="text-sm font-medium text-[#1E1E1E]">{inc.item_text}</span>
                                            </div>

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <select
                                                    value={inc.inclusion_type}
                                                    onChange={(e) => {
                                                        const newIncs = [...inclusions];
                                                        newIncs[idx].inclusion_type = e.target.value as InclusionType;
                                                        setInclusions(newIncs);
                                                    }}
                                                    className="bg-transparent border-none text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer text-[#1E1E1E]/40 hover:text-[#B79A63]"
                                                >
                                                    <option value="included">Inclus</option>
                                                    <option value="optional">Optionnel</option>
                                                    <option value="excluded">Exclu</option>
                                                </select>
                                                <button
                                                    onClick={() => setInclusions(inclusions.filter((_, i) => i !== idx))}
                                                    className="p-1 hover:text-red-500 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center justify-between border-b border-[#F8F5F0] pb-4">
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-serif font-bold text-[#1E1E1E]">Options Supplémentaires</h3>
                                <SageTip tipId="options" />
                            </div>
                            <GildedButton onClick={() => setOptions([...options, { title: "", description: "", price: 0 }])} variant="outline" size="sm">
                                <Plus className="w-4 h-4 mr-2" /> Ajouter une option
                            </GildedButton>
                        </div>

                        {/* Tip integrated into section header logic if possible, but keeping it below for clarity or moving up */}

                        {options.length === 0 && (
                            <div className="py-12 flex flex-col items-center text-[#1E1E1E]/30 space-y-4">
                                <Plus className="w-12 h-12" />
                                <p className="text-sm font-lato italic">Définissez des options payantes pour augmenter votre panier moyen.</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            {options.map((opt, idx) => (
                                <div key={idx} className="bg-[#F8F5F0] rounded-xl p-6 border border-[#D4D2CF]/50 relative group">
                                    <button
                                        onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                                        className="absolute top-4 right-4 p-2 text-[#1E1E1E]/20 hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="md:col-span-2 space-y-2">
                                            <Label className="text-[10px] font-bold uppercase text-[#B79A63]">Titre de l'option</Label>
                                            <GildedInput
                                                value={opt.title}
                                                onChange={(e) => {
                                                    const newOpts = [...options];
                                                    newOpts[idx].title = e.target.value;
                                                    setOptions(newOpts);
                                                }}
                                                placeholder="Ex: Drone aérien..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase text-[#B79A63]">Prix</Label>
                                            <div className="relative">
                                                <GildedInput
                                                    type="number"
                                                    value={opt.price}
                                                    onChange={(e) => {
                                                        const newOpts = [...options];
                                                        newOpts[idx].price = Number(e.target.value);
                                                        setOptions(newOpts);
                                                    }}
                                                    className="pr-12"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#1E1E1E]/40">DZD</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        <Label className="text-[10px] font-bold uppercase text-[#B79A63]">Brève description</Label>
                                        <GildedInput
                                            value={opt.description}
                                            onChange={(e) => {
                                                const newOpts = [...options];
                                                newOpts[idx].description = e.target.value;
                                                setOptions(newOpts);
                                            }}
                                            placeholder="Ex: Inclus 30min de vol en résolution 4K..."
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center justify-between border-b border-[#F8F5F0] pb-4">
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-serif font-bold text-[#1E1E1E]">FAQ (Réponses aux questions)</h3>
                                <SageTip tipId="faq" />
                            </div>
                            <GildedButton onClick={() => setFaqs([...faqs, { question: "", answer: "" }])} variant="outline" size="sm">
                                <Plus className="w-4 h-4 mr-2" /> Ajouter une question
                            </GildedButton>
                        </div>

                        {faqs.length === 0 && (
                            <div className="py-12 flex flex-col items-center text-[#1E1E1E]/30 space-y-4">
                                <HelpCircle className="w-12 h-12" />
                                <p className="text-sm font-lato italic">Anticipez les doutes de vos clients pour gagner du temps et rassurer.</p>
                            </div>
                        )}

                        <div className="space-y-6">
                            {faqs.map((faq, idx) => (
                                <div key={idx} className="space-y-4 p-6 bg-[#F8F5F0] rounded-xl border border-[#D4D2CF] relative group transition-all hover:border-[#B79A63]/30">
                                    <button
                                        onClick={() => setFaqs(faqs.filter((_, i) => i !== idx))}
                                        className="absolute top-4 right-4 p-2 text-[#1E1E1E]/20 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-[#1E1E1E]">Question</Label>
                                        <GildedInput
                                            value={faq.question}
                                            onChange={(e) => {
                                                const newFaqs = [...faqs];
                                                newFaqs[idx].question = e.target.value;
                                                setFaqs(newFaqs);
                                            }}
                                            placeholder="Ex: Proposez-vous des facilités de paiement ?"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-[#1E1E1E]">Réponse</Label>
                                        <textarea
                                            rows={3}
                                            value={faq.answer}
                                            onChange={(e) => {
                                                const newFaqs = [...faqs];
                                                newFaqs[idx].answer = e.target.value;
                                                setFaqs(newFaqs);
                                            }}
                                            className="w-full rounded-xl border border-[#D4D2CF] bg-white p-4 font-lato text-sm focus:outline-none focus:ring-1 focus:ring-[#B79A63] transition-all"
                                            placeholder="Ex: Oui, nous acceptons le paiement en 3 fois sans frais..."
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Desktop Sticky Navigation Footer */}
            <div className="hidden md:flex fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-[#D4D2CF] p-4 justify-center items-center shadow-2xl">
                <div className="max-w-4xl w-full flex items-center justify-between gap-4">
                    <button
                        onClick={() => step > 1 ? setStep(step - 1) : navigate(basePath)}
                        className="px-6 h-12 flex items-center gap-2 font-bold text-[#1E1E1E]/60 hover:text-[#B79A63] transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        {step === 1 ? "Retour" : "Précédent"}
                    </button>

                    <div className="flex gap-3">
                        {/* Preview Button */}
                        <button
                            onClick={() => setShowPreview(true)}
                            className="px-5 h-12 flex items-center gap-2 font-bold text-[#B79A63] border border-[#B79A63]/40 rounded-xl hover:bg-[#B79A63]/5 transition-colors text-sm uppercase tracking-widest"
                        >
                            <Eye className="w-4 h-4" />
                            <span className="hidden lg:inline">Prévisualiser</span>
                        </button>

                        <GildedButton
                            onClick={() => handleSave(false)}
                            disabled={saving}
                            variant="outline"
                            className="flex"
                        >
                            <Save className="w-5 h-5 mr-2" />
                            Enregistrer & Quitter
                        </GildedButton>

                        {step < 4 ? (
                            <GildedButton
                                onClick={() => setStep(step + 1)}
                                disabled={!canGoToNext()}
                                className="px-10 h-12 text-base font-bold disabled:opacity-50"
                            >
                                Suivant
                                <ChevronRight className="w-5 h-5 ml-2" />
                            </GildedButton>
                        ) : (
                            <GildedButton
                                onClick={() => handleSave(true)}
                                disabled={saving || !canGoToNext()}
                                className="px-10 h-12 text-base font-bold"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Terminer & Publier"}
                            </GildedButton>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Sticky Navigation Footer */}
            <StickyActionBar className="flex-row items-center justify-between pb-6 px-4">
                <button
                    onClick={() => step > 1 ? setStep(step - 1) : navigate("/partner/dashboard/services")}
                    className="w-14 h-14 flex items-center justify-center bg-[#F8F5F0] rounded-2xl text-[#1E1E1E]/60 active:scale-95 transition-all border border-[#D4D2CF]/50"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>

                <div className="flex-1 px-2">
                    {step < 4 ? (
                        <GildedButton
                            onClick={() => setStep(step + 1)}
                            disabled={!canGoToNext()}
                            className="w-full h-14 text-lg font-bold shadow-xl shadow-[#B79A63]/20 rounded-2xl disabled:opacity-50"
                        >
                            Suivant
                            <ChevronRight className="w-5 h-5 ml-2" />
                        </GildedButton>
                    ) : (
                        <GildedButton
                            onClick={() => handleSave(true)}
                            disabled={saving || !canGoToNext()}
                            className="w-full h-14 text-lg font-bold shadow-xl shadow-[#B79A63]/20 rounded-2xl"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Terminer & Publier"}
                        </GildedButton>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => setShowPreview(true)}
                        className="w-14 h-6 flex items-center justify-center bg-[#B79A63]/10 border border-[#B79A63]/30 rounded-xl text-[#B79A63] active:scale-95 transition-all"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleSave(false)}
                        disabled={saving}
                        className="w-14 h-6 flex items-center justify-center bg-white border border-[#D4D2CF] rounded-xl text-[#B79A63] active:scale-95 transition-all"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                </div>
            </StickyActionBar>

            {/* Service Preview Modal */}
            <ServicePreviewModal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                formData={formData}
                media={media}
                inclusions={inclusions}
                options={options}
                faqs={faqs}
                commercialName={commercialName}
                categoryLabel={categories.find(c => c.id === formData.service_category_id)?.label}
            />
        </div>
    );
}


