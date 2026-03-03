import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
    ChevronLeft,
    ChevronRight,
    Save,
    X,
    Plus,
    Check,
    Loader2,
    MapPin,
    Info,
    Music2,
    Sparkles,
    DollarSign,
} from "lucide-react";
import { GildedButton } from "@/components/ui/gilded-button";
import { GildedInput } from "@/components/ui/gilded-input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { compressAndUpload } from "@/lib/image-utils";
import { useWilayas } from "@/hooks/useWilayas";

// Wilayas are now fetched from the database via useWilayas hook

const EVENT_TYPES = [
    { id: "mariage", label: "Mariage" },
    { id: "fiancailles", label: "Fiançailles (khotba)" },
    { id: "naissance", label: "Naissance (z'yada, sbou3)" },
    { id: "circoncision", label: "Circoncision" },
    { id: "anniversaire", label: "Anniversaire" },
    { id: "reussite", label: "Fête de réussite (BAC, BEM...)" },
    { id: "soutenance", label: "Soutenance universitaire" },
    { id: "entreprise", label: "Événement professionnel" },
];

const ANIMATION_TYPES = [
    { key: "zorna", label: "Zorna", emoji: "🎺" },
    { key: "karkabou", label: "Karkabou", emoji: "🥁" },
    { key: "bendir", label: "Bendir", emoji: "🪘" },
];

const PRICE_REASONS = [
    "Durée de la prestation",
    "Type d'événement",
    "Moment (réception / soirée)",
    "Semaine / week-end",
    "Date demandée",
    "Urgence",
    "Déplacement",
];

const STEPS = [
    { num: 1, label: "Identité" },
    { num: 2, label: "Galerie" },
    { num: 3, label: "Description" },
    { num: 4, label: "Type" },
    { num: 5, label: "Services" },
    { num: 6, label: "Déplacement" },
    { num: 7, label: "Tarifs" },
    { num: 8, label: "Conditions" },
];

export default function TraditionalMusicEditor({ providerIdProp }: { providerIdProp?: string }) {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { wilayas } = useWilayas();

    const adminMode = searchParams.get('adminMode') === 'true' || !!providerIdProp;
    const isNew = id === "new" || (!id && !providerIdProp);
    const targetProviderId = isNew ? null : (id || providerIdProp || searchParams.get('providerId'));

    const basePath = adminMode && targetProviderId
        ? `/admin/providers/${targetProviderId}/services`
        : `/partner/dashboard/services`;

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(1);
    const [providerId, setProviderId] = useState<string>("");

    // Step 1
    const [commercialName, setCommercialName] = useState("");
    const [wilayaId, setWilayaId] = useState("");
    const [address, setAddress] = useState("");
    const [eventsAccepted, setEventsAccepted] = useState<string[]>([]);

    // Step 2
    const [media, setMedia] = useState<{ url: string; isMain: boolean }[]>([]);

    // Step 3
    const [description, setDescription] = useState("");

    // Step 4 — Types d'animation
    const [animationTypes, setAnimationTypes] = useState<Record<string, boolean>>({});
    const [animationOther, setAnimationOther] = useState("");
    const [servOptions, setServOptions] = useState<Record<string, boolean>>({});


    // Step 5 — Déplacement
    const [deplacementPossible, setDeplacementPossible] = useState(false);
    const [wilayasDeplacement, setWilayasDeplacement] = useState<string[]>([]);

    // Step 6 — Tarifs
    const [basePrice, setBasePrice] = useState<number | "">("");

    // Step 7 — Conditions
    const [acompteDemande, setAcompteDemande] = useState(false);
    const [politiqueAnnulation, setPolitiqueAnnulation] = useState("");


    useEffect(() => {
        if (!isNew && (user || adminMode)) fetchProviderData();
    }, [user, targetProviderId]);

    const fetchProviderData = async () => {
        if (!targetProviderId) return;
        try {
            setLoading(true);
            const { data: p } = await supabase
                .from("providers")
                .select(`
                    id, commercial_name, wilaya_id, address, events_accepted, bio, base_price, travel_wilayas,
                    provider_media (media_url, is_main),
                    provider_music (music_styles, equipment_options, acompte_demande, politique_annulation)
                `)
                .eq("id", targetProviderId)
                .maybeSingle();

            if (p) {
                setProviderId(p.id);
                setCommercialName(p.commercial_name || "");
                setWilayaId(p.wilaya_id || "");
                setAddress(p.address || "");
                setEventsAccepted(p.events_accepted || []);
                setDescription(p.bio || "");
                setBasePrice(p.base_price || "");
                setDeplacementPossible((p.travel_wilayas as string[] || []).length > 0);
                setWilayasDeplacement(p.travel_wilayas as string[] || []);

                const pm = (p.provider_media || []).sort((a: any) => a.is_main ? -1 : 1);
                setMedia(pm.map((m: any) => ({ url: m.media_url, isMain: m.is_main })));

                const music = (p.provider_music as any)?.[0] || (p.provider_music as any);
                if (music) {
                    const stylesMap: Record<string, boolean> = {};
                    (music.music_styles || []).forEach((s: string) => {
                        if (ANIMATION_TYPES.find(t => t.key === s)) stylesMap[s] = true;
                        else setAnimationOther(s);
                    });
                    setAnimationTypes(stylesMap);
                    setAcompteDemande(music.acompte_demande || false);
                    setPolitiqueAnnulation(music.politique_annulation || "");
                }
            }
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleEvent = (evId: string) =>
        setEventsAccepted(prev => prev.includes(evId) ? prev.filter(x => x !== evId) : [...prev, evId]);

    const toggleType = (key: string) =>
        setAnimationTypes(prev => ({ ...prev, [key]: !prev[key] }));

    const toggleWilaya = (id: string) =>
        setWilayasDeplacement(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

    const validateStep = (): boolean => {
        if (step === 1) {
            if (!commercialName.trim()) { toast.error("Le nom du groupe / artiste est requis"); return false; }
            if (!wilayaId) { toast.error("Veuillez sélectionner votre wilaya"); return false; }
            if (eventsAccepted.length === 0) { toast.error("Sélectionnez au moins un type d'événement"); return false; }
        }
        return true;
    };

    const handleSave = async () => {
        if (!commercialName.trim()) { toast.error("Le nom est requis"); setStep(1); return; }
        if (!user && !adminMode) return;

        try {
            setSaving(true);
            let currentProviderId = providerId;

            // Build animation styles array
            const allStyles = [
                ...Object.entries(animationTypes).filter(([, v]) => v).map(([k]) => k),
                ...(animationOther.trim() ? [animationOther.trim()] : []),
            ];

            // Upsert provider
            const providerPayload: any = {
                commercial_name: commercialName,
                category_slug: "animation_musicale_traditionnelle",
                wilaya_id: wilayaId || null,
                address,
                events_accepted: eventsAccepted,
                bio: description,
                base_price: basePrice || null,
                travel_wilayas: deplacementPossible ? wilayasDeplacement : [],
                moderation_status: "pending",
            };

            if (currentProviderId) {
                const { error } = await supabase.from("providers").update(providerPayload).eq("id", currentProviderId);
                if (error) throw error;
            } else if (user) {
                const { data: newP, error } = await supabase.from("providers").insert({
                    ...providerPayload,
                    user_id: user.id,
                    phone_number: "",
                }).select("id").single();
                if (error) throw error;
                currentProviderId = newP.id;
                setProviderId(currentProviderId);
            }

            // Upsert provider_music
            await supabase.from("provider_music").upsert({
                provider_id: currentProviderId,
                music_styles: allStyles,
                acompte_demande: acompteDemande,
                politique_annulation: politiqueAnnulation,
            });

            // Sync media
            await supabase.from("provider_media").delete().eq("provider_id", currentProviderId);
            if (media.length > 0) {
                await supabase.from("provider_media").insert(
                    media.map((m, i) => ({ provider_id: currentProviderId, media_url: m.url, is_main: i === 0 }))
                );
            }

            toast.success("Prestation enregistrée !");
            navigate(basePath);
        } catch (err: any) {
            toast.error(err.message || "Erreur lors de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    const handleNext = () => {
        if (validateStep()) {
            if (step < STEPS.length) setStep(s => s + 1);
            else handleSave();
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleAddMedia = async (file: File) => {
        if (!user) return;
        if (media.length >= 5) { toast.error("Maximum 5 photos"); return; }
        const tId = toast.loading("Upload en cours...");
        try {
            const { publicUrl, error: uploadError } = await compressAndUpload(
                file,
                user.id,
                { folder: providerId || user.id }
            );

            if (uploadError) throw uploadError;

            setMedia(prev => [...prev, { url: publicUrl, isMain: prev.length === 0 }]);
            toast.success("Photo ajoutée", { id: tId });
        } catch (err) {
            toast.error("Erreur lors de l'upload", { id: tId });
        }
    };

    const UXHint = ({ children }: { children: React.ReactNode }) => (
        <div className="flex items-start gap-3 p-4 bg-[#F8F5F0] rounded-xl border border-[#D4D2CF]/50 mt-4">
            <Info className="w-4 h-4 text-[#B79A63] shrink-0 mt-0.5" />
            <p className="text-xs text-[#1E1E1E]/60 leading-relaxed">{children}</p>
        </div>
    );

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-[#B79A63]" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto pb-36 mt-8 px-4">
            {/* Header */}
            <div className="mb-12 space-y-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#F8F5F0] rounded-full text-[#1E1E1E]/40 transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-[#1E1E1E]">Animation Musicale Traditionnelle</h1>
                        <p className="text-sm text-[#1E1E1E]/60 mt-1">
                            {isNew ? "Créer une nouvelle prestation" : "Modifier votre prestation"}
                        </p>
                    </div>
                </div>

                {/* Stepper */}
                <div className="flex items-center justify-between relative px-2 overflow-x-auto gap-1">
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-[#D4D2CF] z-0" />
                    {STEPS.map((s) => (
                        <div key={s.num} className="relative z-10 flex flex-col items-center gap-2 shrink-0">
                            <button
                                onClick={() => setStep(s.num)}
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 text-sm font-bold",
                                    step === s.num ? "bg-[#B79A63] border-[#B79A63] text-white shadow-lg shadow-[#B79A63]/30" :
                                        step > s.num ? "bg-[#1E1E1E] border-[#1E1E1E] text-white" :
                                            "bg-white border-[#D4D2CF] text-[#D4D2CF]"
                                )}
                            >
                                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                            </button>
                            <span className={cn("text-[9px] font-bold uppercase tracking-wider hidden md:block whitespace-nowrap", step === s.num ? "text-[#B79A63]" : "text-[#D4D2CF]")}>
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Card */}
            <div className="bg-white rounded-3xl border border-[#D4D2CF] p-8 md:p-12 shadow-sm min-h-[500px] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.04]">
                    <Music2 className="w-32 h-32" />
                </div>

                {/* STEP 1 — Identité */}
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <h2 className="text-2xl font-serif text-[#1E1E1E]">Identité du prestataire</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-[#1E1E1E]">Nom du groupe / artiste *</Label>
                                <GildedInput value={commercialName} onChange={e => setCommercialName(e.target.value)} placeholder="Ex: Groupe El Fergana, Maître Kaci..." />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-[#1E1E1E]">Wilaya *</Label>
                                <select value={wilayaId} onChange={e => setWilayaId(e.target.value)}
                                    className="w-full h-12 rounded-xl border border-[#D4D2CF] bg-[#F8F5F0] px-4 font-sans text-sm outline-none focus:ring-1 focus:ring-[#B79A63]">
                                    <option value="">Sélectionnez</option>
                                    {wilayas.map(w => <option key={w.id} value={w.id}>{w.code} - {w.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-[#1E1E1E]">Localisation exacte</Label>
                            <GildedInput value={address} onChange={e => setAddress(e.target.value)} placeholder="Adresse, quartier, ville..." />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-sm font-bold text-[#1E1E1E]">Types d'événements acceptés *</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {EVENT_TYPES.map(ev => (
                                    <button key={ev.id} onClick={() => toggleEvent(ev.id)}
                                        className={cn("px-4 py-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all text-center",
                                            eventsAccepted.includes(ev.id)
                                                ? "border-[#B79A63] bg-[#F8F5F0] text-[#B79A63]"
                                                : "border-[#D4D2CF] text-[#1E1E1E]/40 hover:border-[#B79A63]/40")}>
                                        {ev.label}
                                    </button>
                                ))}
                            </div>
                            <UXHint>Sélectionnez uniquement les événements sur lesquels vous intervenez réellement. Votre prestation sera visible uniquement pour ces événements.</UXHint>
                        </div>
                    </div>
                )}

                {/* STEP 2 — Galerie */}
                {step === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <div>
                            <h2 className="text-2xl font-serif text-[#1E1E1E] mb-1">Galerie & médias</h2>
                            <p className="text-sm text-[#1E1E1E]/40">{media.length} / 5 photos</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {media.map((m, i) => (
                                <div key={i} className="relative aspect-square rounded-2xl border border-[#D4D2CF] overflow-hidden group">
                                    <img src={m.url} alt="" className="w-full h-full object-cover" />
                                    <button onClick={() => setMedia(prev => prev.filter((_, idx) => idx !== i))}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <X className="w-3 h-3" />
                                    </button>
                                    {i === 0 && <span className="absolute bottom-2 left-2 bg-[#B79A63] text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">Principal</span>}
                                </div>
                            ))}
                            {media.length < 5 && (
                                <label className="aspect-square rounded-2xl border-2 border-dashed border-[#D4D2CF] flex flex-col items-center justify-center text-[#1E1E1E]/20 hover:text-[#B79A63] hover:border-[#B79A63]/50 transition-all cursor-pointer">
                                    <Plus className="w-8 h-8" />
                                    <input type="file" hidden accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleAddMedia(f); e.target.value = ""; }} />
                                </label>
                            )}
                        </div>

                        <UXHint>Ajoutez uniquement des photos issues de vos vraies prestations. Une sélection courte et authentique inspire plus de confiance.</UXHint>
                    </div>
                )}

                {/* STEP 3 — Description */}
                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <h2 className="text-2xl font-serif text-[#1E1E1E]">Description <span className="text-[#B79A63]">(optionnelle)</span></h2>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-[#1E1E1E]">Présentation du groupe / artiste</Label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full h-40 rounded-xl border border-[#D4D2CF] bg-[#F8F5F0] p-4 text-sm outline-none focus:ring-1 focus:ring-[#B79A63] resize-none"
                                placeholder="Décrivez brièvement votre style et votre ambiance..."
                            />
                        </div>
                        <UXHint>Décrivez brièvement votre style et votre ambiance. Ce champ est facultatif.</UXHint>
                    </div>
                )}

                {/* STEP 4 — Type d'animation */}
                {step === 4 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <h2 className="text-2xl font-serif text-[#1E1E1E]">Type d'animation proposée</h2>
                        <p className="text-sm text-[#1E1E1E]/40 -mt-4">Cochez au moins une option</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {ANIMATION_TYPES.map(type => (
                                <button
                                    key={type.key}
                                    onClick={() => toggleType(type.key)}
                                    className={cn(
                                        "flex flex-col items-center gap-4 p-8 rounded-2xl border-2 transition-all",
                                        animationTypes[type.key]
                                            ? "bg-[#1E1E1E] border-[#1E1E1E] text-white"
                                            : "bg-white border-[#D4D2CF] text-[#1E1E1E]/60 hover:border-[#D4D2CF]"
                                    )}>
                                    <span className="text-4xl">{type.emoji}</span>
                                    <span className="font-bold uppercase text-sm tracking-widest">{type.label}</span>
                                    {animationTypes[type.key] && <Check className="w-4 h-4 text-[#B79A63]" />}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-[#1E1E1E]">Autre instrument / type d'animation</Label>
                            <GildedInput
                                value={animationOther}
                                onChange={e => setAnimationOther(e.target.value)}
                                placeholder="Ex: Gasba, Guembri, Darbouka..."
                            />
                        </div>
                    </div>
                )}

                {/* STEP 5 — Services */}
                {step === 5 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <h2 className="text-2xl font-serif text-[#1E1E1E]">Services proposés <span className="text-[#B79A63]">(informatif)</span></h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                                { key: "sono", label: "Sonorisation fournie" },
                                { key: "animation", label: "Animation et interactions" },
                                { key: "costumes", label: "Tenues traditionnelles" },
                                { key: "choregraphie", label: "Chorégraphie / placement" },
                            ].map(s => (
                                <button key={s.key}
                                    onClick={() => setServOptions(prev => ({ ...prev, [s.key]: !prev[s.key] }))}
                                    className={cn("flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left",
                                        servOptions?.[s.key] ? "bg-[#1E1E1E] border-[#1E1E1E] text-white" : "bg-[#F8F5F0] border-transparent text-[#1E1E1E]/60 hover:border-[#D4D2CF]")}>
                                    <span className="text-sm font-bold uppercase tracking-wider">{s.label}</span>
                                    {servOptions?.[s.key] && <Check className="w-4 h-4 ml-auto shrink-0 text-[#B79A63]" />}
                                </button>
                            ))}
                        </div>
                        <UXHint>Ces informations aident le client à mieux comprendre votre prestation et ce que vous apportez sur le terrain.</UXHint>
                    </div>
                )}

                {/* STEP 6 — Déplacement */}
                {step === 6 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <h2 className="text-2xl font-serif text-[#1E1E1E]">Déplacement & organisation <span className="text-[#B79A63]">(informatif)</span></h2>

                        <button
                            onClick={() => setDeplacementPossible(!deplacementPossible)}
                            className={cn(
                                "w-full p-6 rounded-2xl border-2 flex items-center gap-5 transition-all text-left",
                                deplacementPossible ? "bg-[#1E1E1E] border-[#1E1E1E] text-white" : "bg-white border-[#D4D2CF] text-[#1E1E1E]/60"
                            )}>
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", deplacementPossible ? "bg-[#B79A63]" : "bg-[#F8F5F0]")}>
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-bold uppercase text-sm tracking-widest">Déplacement possible</p>
                                <p className={cn("text-xs mt-1", deplacementPossible ? "text-white/60" : "text-[#1E1E1E]/40")}>Cliquez pour activer</p>
                            </div>
                            {deplacementPossible && <Check className="w-5 h-5 text-[#B79A63] ml-auto" />}
                        </button>

                        {deplacementPossible && (
                            <div className="space-y-4 animate-in slide-in-from-top-2">
                                <Label className="text-sm font-bold text-[#1E1E1E]">Wilayas de déplacement</Label>
                                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 max-h-60 overflow-y-auto p-1">
                                    {wilayas.map(w => (
                                        <button key={w.id} onClick={() => toggleWilaya(w.id)}
                                            className={cn("px-2 py-2 rounded-lg border text-[9px] font-bold uppercase transition-all",
                                                wilayasDeplacement.includes(w.id)
                                                    ? "bg-[#B79A63] text-white border-[#B79A63]"
                                                    : "bg-white border-[#D4D2CF] text-[#1E1E1E]/40")}>
                                            {w.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <UXHint>Les conditions de déplacement sont définies lors de l'échange avec le client.</UXHint>
                    </div>
                )}

                {/* STEP 6 — Tarification */}
                {/* STEP 7 — Tarifs */}
                {step === 7 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <h2 className="text-2xl font-serif text-[#1E1E1E]">Tarification & conditions</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-[#1E1E1E]">Prix à partir de (DA)</Label>
                                    <div className="relative">
                                        <GildedInput
                                            type="number"
                                            value={basePrice}
                                            onChange={e => setBasePrice(parseInt(e.target.value) || "")}
                                            placeholder="0"
                                            className="pr-12 text-lg"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#1E1E1E]/40 text-sm">DA</span>
                                    </div>
                                </div>

                                <div className="bg-[#1E1E1E] p-6 rounded-2xl text-white space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#B79A63] flex items-center justify-center">
                                            <Info className="w-4 h-4" />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Le prix peut varier selon :</span>
                                    </div>
                                    <ul className="space-y-2 text-[11px] text-white/60 font-medium pl-2">
                                        {PRICE_REASONS.map(r => <li key={r} className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-[#B79A63] shrink-0" />{r}</li>)}
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-[#F8F5F0] p-8 rounded-3xl border border-[#D4D2CF]/50 flex flex-col items-center justify-center text-center gap-4">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border border-[#B79A63]/20 shadow-sm">
                                    <DollarSign className="w-8 h-8 text-[#B79A63]" />
                                </div>
                                <h3 className="text-lg font-serif font-bold text-[#1E1E1E]">Tarif Indicatif</h3>
                                <p className="text-xs text-[#1E1E1E]/60 leading-relaxed">Le tarif final dépend du contexte réel de l'événement et sera discuté directement avec le client.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 7 — Conditions */}
                {/* STEP 8 — Conditions */}
                {step === 8 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <h2 className="text-2xl font-serif text-[#1E1E1E]">Conditions <span className="text-[#B79A63]">(optionnelles)</span></h2>

                        <button
                            onClick={() => setAcompteDemande(!acompteDemande)}
                            className={cn(
                                "w-full p-6 rounded-2xl border-2 flex items-center gap-4 transition-all text-left",
                                acompteDemande ? "bg-[#1E1E1E] border-[#1E1E1E] text-white" : "bg-white border-[#D4D2CF] text-[#1E1E1E]/60"
                            )}>
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", acompteDemande ? "bg-[#B79A63]" : "bg-[#F8F5F0]")}>
                                <Check className="w-5 h-5" />
                            </div>
                            <span className="font-bold uppercase text-xs tracking-widest">Acompte demandé</span>
                            {acompteDemande && <Check className="w-4 h-4 text-[#B79A63] ml-auto" />}
                        </button>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-[#1E1E1E]">Politique d'annulation <span className="font-normal text-[#1E1E1E]/40">(texte libre)</span></Label>
                            <textarea
                                value={politiqueAnnulation}
                                onChange={e => setPolitiqueAnnulation(e.target.value)}
                                className="w-full h-32 rounded-xl border border-[#D4D2CF] bg-[#F8F5F0] p-4 text-sm outline-none focus:ring-1 focus:ring-[#B79A63] resize-none"
                                placeholder="Ex: Annulation gratuite jusqu'à 15 jours avant l'événement..."
                            />
                        </div>
                    </div>
                )}

                {/* STEP 8 — Avis */}
            </div>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-[#D4D2CF] p-4 z-50">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => step > 1 ? setStep(s => s - 1) : navigate(basePath)}
                        className="px-6 py-2.5 font-bold text-[#1E1E1E]/40 hover:text-[#1E1E1E] transition-colors text-sm uppercase tracking-widest">
                        {step === 1 ? "Retour" : "Précédent"}
                    </button>
                    <div className="flex gap-4">
                        <GildedButton variant="outline" onClick={handleSave} disabled={saving}>
                            <Save className="w-4 h-4 mr-2" /> Sauvegarder
                        </GildedButton>
                        <GildedButton onClick={handleNext} disabled={saving} className="gap-2">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {step < STEPS.length ? <>Continuer <ChevronRight className="w-4 h-4" /></> : "Terminer"}
                        </GildedButton>
                    </div>
                </div>
            </div>
        </div>
    );
}
