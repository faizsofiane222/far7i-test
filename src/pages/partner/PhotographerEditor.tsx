import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
    ChevronLeft,
    Save,
    Image as ImageIcon,
    X,
    Plus,
    Check,
    Loader2,
    Camera,
    Video,
    Users,
    MapPin,
    ArrowRight,
    DollarSign,
    Sparkles,
    Heart,
    Baby,
    Gift,
    GraduationCap,
    Briefcase,
    Clock,
    Plane,
    Book,
    FileText,
    Frame,
    Usb,
    FastForward,
    Film,
    Car,
    Mic2,
    Disc,
    Wind,
    Utensils
} from "lucide-react";
import { GildedButton } from "@/components/ui/gilded-button";
import { GildedInput } from "@/components/ui/gilded-input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { compressAndUpload } from "@/lib/image-utils";
import { useWilayas } from "@/hooks/useWilayas";

// @ts-ignore
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Wilayas are now fetched from the database via useWilayas hook

const EVENT_TYPES = [
    { id: "mariage", label: "Mariage", icon: <Heart className="w-4 h-4" /> },
    { id: "fiancailles", label: "Fiançailles", icon: <Heart className="w-4 h-4" /> },
    { id: "naissance", label: "Naissance", icon: <Baby className="w-4 h-4" /> },
    { id: "circoncision", label: "Circoncision", icon: <Baby className="w-4 h-4" /> },
    { id: "anniversaire", label: "Anniversaire", icon: <Gift className="w-4 h-4" /> },
    { id: "reussite", label: "Fête de réussite", icon: <GraduationCap className="w-4 h-4" /> },
    { id: "soutenance", label: "Soutenance", icon: <GraduationCap className="w-4 h-4" /> },
    { id: "professionnel", label: "Événement Pro", icon: <Briefcase className="w-4 h-4" /> }
];

const COVERAGE_OPTIONS = [
    { id: 'preparatifs', label: 'Préparatifs', icon: <Clock className="w-4 h-4" /> },
    { id: 'reception', label: 'Réception', icon: <Users className="w-4 h-4" /> },
    { id: 'cortege', label: 'Cortège', icon: <Car className="w-4 h-4" /> },
    { id: 'ceremonie', label: 'Cérémonie', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'soiree', label: 'Soirée', icon: <Disc className="w-4 h-4" /> },
    { id: 'shooting', label: 'Shooting hors jour J', icon: <Camera className="w-4 h-4" /> },
];

const TECHNICAL_OPTIONS = [
    { id: 'heures_sup', label: 'Heures supplémentaires', icon: <Clock className="w-4 h-4" /> },
    { id: 'drone', label: 'Drone', icon: <Plane className="w-4 h-4" /> },
];

const DELIVERABLES = [
    { id: 'album_photo', label: 'Album photo / Photobook', icon: <Book className="w-4 h-4" /> },
    { id: 'album_sup', label: 'Album supplémentaire', icon: <FileText className="w-4 h-4" /> },
    { id: 'tirages_papier', label: 'Tirages papier', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'cadres_photo', label: 'Cadres photo', icon: <Frame className="w-4 h-4" /> },
    { id: 'cle_usb', label: 'Clé USB', icon: <Usb className="w-4 h-4" /> },
    { id: 'livraison_express', label: 'Livraison express', icon: <FastForward className="w-4 h-4" /> },
    { id: 'film_long', label: 'Film long', icon: <Film className="w-4 h-4" /> },
    { id: 'film_court', label: 'Film court', icon: <Film className="w-4 h-4" /> },
];

export default function PhotographerEditor() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isOnboarding = searchParams.get('onboarding') === 'true';
    const { wilayas } = useWilayas();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(1);

    const providerId = id;

    const [baseData, setBaseData] = useState({
        commercial_name: "",
        category_slug: "photographe",
        wilaya_id: "",
        address: "",
        events_accepted: [] as string[],
        bio: "",
        travel_wilayas: [] as string[],
        base_price: 0,
    });

    const [photographerData, setPhotographerData] = useState({
        coverage_options: [] as string[],
        service_types: [] as string[],
        technical_options: [] as string[],
        deliverables: [] as string[],
        delivery_time_weeks: 4,
        acompte_demande: "",
        politique_annulation: "",
    });

    const [media, setMedia] = useState<string[]>([]);
    const [uploadingMedia, setUploadingMedia] = useState(false);

    useEffect(() => {
        if (user && providerId && providerId !== 'new') {
            fetchProviderData();
        } else {
            setLoading(false);
        }
    }, [user, providerId]);

    const fetchProviderData = async () => {
        try {
            setLoading(true);
            const { data: provider, error } = await (supabase
                .from("providers") as any)
                .select(`
                    id, commercial_name, category_slug, wilaya_id, address, 
                    events_accepted, bio, base_price, travel_wilayas,
                    moderation_status, last_saved_step,
                    provider_photographer (*),
                    provider_media (media_url, is_main)
                `)
                .eq("id", providerId)
                .single();

            if (provider) {
                setBaseData({
                    commercial_name: provider.commercial_name || "",
                    category_slug: provider.category_slug || "photographe",
                    wilaya_id: provider.wilaya_id || "",
                    address: provider.address || "",
                    events_accepted: provider.events_accepted || [],
                    bio: provider.bio || "",
                    travel_wilayas: provider.travel_wilayas || [],
                    base_price: Number(provider.base_price) || 0,
                });

                if (provider.provider_photographer) {
                    const photo = (provider.provider_photographer as any)[0] || provider.provider_photographer;
                    setPhotographerData({
                        coverage_options: photo.coverage_options || [],
                        service_types: photo.service_types || [],
                        technical_options: photo.technical_options || [],
                        deliverables: photo.deliverables || [],
                        delivery_time_weeks: photo.delivery_time_weeks || 4,
                        acompte_demande: photo.acompte_demande || "",
                        politique_annulation: photo.politique_annulation || "",
                    });
                }

                if (provider.provider_media) {
                    setMedia(provider.provider_media.map((m: any) => m.media_url));
                }

                if (provider.moderation_status === "incomplete" || provider.moderation_status === "draft") {
                    setStep(provider.last_saved_step || 1);
                } else {
                    setStep(1); // Default to start for published/pending records
                }
            }
        } catch (error: any) {
            console.error("Error fetching provider:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDraft = async () => {
        if (!baseData.commercial_name.trim()) { toast.error("Le nom est obligatoire"); setStep(1); return; }
        await handleSave(false, true);
    }

    const handleSave = async (silent = false, isDraft: boolean = false) => {
        if (!baseData.commercial_name.trim()) {
            toast.error("Le nom est obligatoire");
            return;
        }

        try {
            if (!silent) setSaving(true);

            let currentProviderId = providerId !== 'new' ? providerId : null;

            // 1. Update or Insert Providers
            const providerPayload = {
                commercial_name: baseData.commercial_name,
                category_slug: baseData.category_slug,
                wilaya_id: baseData.wilaya_id || null,
                address: baseData.address,
                events_accepted: baseData.events_accepted,
                bio: baseData.bio,
                base_price: baseData.base_price,
                travel_wilayas: baseData.travel_wilayas,
                moderation_status: isDraft ? "draft" : "pending",
                last_saved_step: isDraft ? step : null,
            };

            if (currentProviderId) {
                const { error: pError } = await (supabase
                    .from('providers') as any)
                    .update(providerPayload)
                    .eq('id', currentProviderId);

                if (pError) throw pError;
            } else if (user) {
                const { data: newP, error: pError } = await (supabase
                    .from('providers') as any)
                    .insert({
                        user_id: user.id,
                        phone_number: (user as any).phone || "",
                        ...providerPayload
                    })
                    .select('id')
                    .single();

                if (pError) throw pError;
                currentProviderId = newP.id;
            }

            if (!currentProviderId) throw new Error("Erreur d'identifiant prestataire");

            // 2. Upsert Photographer Specifics
            const { error: photoError } = await (supabase
                .from('provider_photographer' as any) as any)
                .upsert({
                    provider_id: currentProviderId,
                    ...photographerData
                });

            if (photoError) throw photoError;

            // 3. Media
            await supabase.from('provider_media').delete().eq('provider_id', currentProviderId);
            if (media.length > 0) {
                const mediaInserts = media.map((url, idx) => ({
                    provider_id: currentProviderId,
                    media_url: url,
                    is_main: idx === 0,
                    sort_order: idx
                }));
                const { error: mediaError } = await supabase.from('provider_media').insert(mediaInserts);
                if (mediaError) throw mediaError;
            }

            if (!silent) {
                toast.success(isDraft ? "Brouillon sauvegardé" : "Profil enregistré !");
                if (!isDraft) {
                    if (isOnboarding) {
                        navigate('/partner/dashboard?success=photo_ready');
                    } else {
                        navigate('/partner/dashboard/services');
                    }
                }
            }
        } catch (error: any) {
            console.error("Save error:", error);
            if (!silent) toast.error("Erreur de sauvegarde : " + error.message);
        } finally {
            if (!silent) setSaving(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setUploadingMedia(true);
        try {
            const newMedia = [...media];
            for (let i = 0; i < files.length; i++) {
                if (newMedia.length >= 5) break;

                const { publicUrl, error: uploadError } = await compressAndUpload(
                    files[i],
                    user?.id || "",
                    { folder: providerId || user?.id || "" }
                );

                if (uploadError) throw uploadError;
                newMedia.push(publicUrl);
            }
            setMedia(newMedia);
            toast.success("Photos ajoutées");
        } catch (e: any) {
            toast.error("Erreur upload : " + e.message);
        } finally {
            setUploadingMedia(false);
            e.target.value = '';
        }
    };

    if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-[#B79A63]" /></div>;

    const steps = [
        { num: 1, label: "Identité" },
        { num: 2, label: "Galerie" },
        { num: 3, label: "Description" },
        { num: 4, label: "Prestations" },
        { num: 5, label: "Options" },
        { num: 6, label: "Tarifs" },
        { num: 7, label: "Logistique" },
        { num: 8, label: "Conditions" },
    ];

    const toggleArrayItem = (state: any, setState: any, field: string, value: string) => {
        const current = [...state[field]];
        const index = current.indexOf(value);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(value);
        }
        setState({ ...state, [field]: current });
    };

    return (
        <div className="max-w-4xl mx-auto pb-36 md:pb-32 px-4">
            {/* Header & Stepper */}
            <div className="space-y-8 mb-12 mt-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#F8F5F0] rounded-full text-[#1E1E1E]/40 hover:text-[#B79A63] transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-[#1E1E1E]">Éditeur Photographe / Vidéaste</h1>
                        <p className="text-sm text-[#1E1E1E]/60 mt-1">Configurez votre profil pour attirer les meilleurs événements.</p>
                    </div>
                </div>

                <div className="flex items-center justify-between relative px-2">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#D4D2CF] -translate-y-1/2 z-0" />
                    {steps.map((s) => (
                        <div key={s.num} className="relative z-10 flex flex-col items-center gap-2">
                            <button
                                onClick={() => setStep(s.num)}
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                    step === s.num ? "bg-[#B79A63] border-[#B79A63] text-white shadow-lg" :
                                        step > s.num ? "bg-[#1E1E1E] border-[#1E1E1E] text-white" :
                                            "bg-white border-[#D4D2CF] text-[#D4D2CF]"
                                )}
                            >
                                {step > s.num ? <Check className="w-5 h-5" /> : s.num}
                            </button>
                            <span className={cn("text-[10px] font-bold uppercase tracking-wider hidden md:block", step === s.num ? "text-[#B79A63]" : step > s.num ? "text-[#1E1E1E]" : "text-[#D4D2CF]")}>
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-2xl border border-[#D4D2CF] p-8 md:p-10 shadow-sm min-h-[500px] mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Camera className="w-32 h-32" />
                </div>

                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div>
                            <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-6 flex items-center gap-2">
                                <Check className="w-5 h-5 text-[#B79A63]" /> 1. Identité du prestataire
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-[#1E1E1E]">Nom du photographe / studio *</Label>
                                    <GildedInput value={baseData.commercial_name} onChange={e => setBaseData({ ...baseData, commercial_name: e.target.value })} placeholder="Ex: Studio Al-Anwar" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-[#1E1E1E]">Wilaya *</Label>
                                    <select value={baseData.wilaya_id} onChange={e => setBaseData({ ...baseData, wilaya_id: e.target.value })} className="w-full h-11 rounded-xl border border-[#D4D2CF] bg-[#F8F5F0] px-4 font-lato text-sm focus:ring-1 focus:ring-[#B79A63] outline-none">
                                        <option value="">Sélectionnez</option>
                                        {wilayas.map(w => <option key={w.id} value={w.id}>{w.code} - {w.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="mt-6 space-y-2">
                                <Label className="text-sm font-bold text-[#1E1E1E]">Localisation (Adresse précise)</Label>
                                <div className="relative">
                                    <GildedInput value={baseData.address} onChange={e => setBaseData({ ...baseData, address: e.target.value })} placeholder="Ex: 12 Rue Didouche Mourad, Alger" className="pl-10" />
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B79A63]" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-[#F8F5F0]">
                            <div className="mb-4">
                                <Label className="text-sm font-bold text-[#1E1E1E]">Types d’événements acceptés</Label>
                                <p className="text-[11px] text-[#1E1E1E]/40 italic">Votre prestation sera visible uniquement pour ces types d'événements.</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {EVENT_TYPES.map(ev => (
                                    <button
                                        key={ev.id}
                                        onClick={() => toggleArrayItem(baseData, setBaseData, 'events_accepted', ev.id)}
                                        className={cn(
                                            "flex items-center gap-2 p-3 rounded-xl border transition-all text-left",
                                            baseData.events_accepted.includes(ev.id)
                                                ? "bg-[#1E1E1E] text-white border-[#1E1E1E] shadow-md"
                                                : "bg-white border-[#D4D2CF] text-[#1E1E1E]/60 hover:border-[#B79A63]/50"
                                        )}
                                    >
                                        <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0", baseData.events_accepted.includes(ev.id) ? "bg-[#B79A63]" : "bg-[#F8F5F0]")}>
                                            {ev.icon}
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{ev.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-serif font-bold text-[#1E1E1E]">2. Galerie & Médias</h2>
                                <p className="text-sm text-[#1E1E1E]/60 mt-1">Choisissez vos meilleurs travaux (Max 5 photos).</p>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer bg-[#B79A63] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#A68953] transition-all self-start md:self-auto shadow-lg">
                                <Plus className="w-4 h-4" /> Ajouter des photos
                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} disabled={media.length >= 5} />
                            </label>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-8">
                            {media.map((u, i) => (
                                <div key={i} className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#D4D2CF] shadow-sm bg-[#F8F5F0]">
                                    <img src={u} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button onClick={() => setMedia(prev => prev.filter((_, idx) => idx !== i))} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-all shadow-xl border border-white/20"><X className="w-6 h-6" /></button>
                                    </div>
                                    {i === 0 && (
                                        <div className="absolute top-3 left-3 px-3 py-1 bg-[#B79A63] text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1.5">
                                            <Sparkles className="w-3 h-3" /> Photo Principale
                                        </div>
                                    )}
                                </div>
                            ))}
                            {uploadingMedia && <div className="aspect-[4/3] rounded-2xl border-2 border-dashed border-[#B79A63] flex flex-col items-center justify-center bg-[#B79A63]/5 gap-3"><Loader2 className="w-8 h-8 animate-spin text-[#B79A63]" /><span className="text-[10px] uppercase font-bold text-[#B79A63]">Upload en cours...</span></div>}
                        </div>

                        <div className="bg-[#B79A63]/5 p-6 rounded-3xl border border-[#B79A63]/10 flex items-start gap-4">
                            <Sparkles className="w-8 h-8 text-[#B79A63] shrink-0" />
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-[#1E1E1E]">Aide UX</p>
                                <p className="text-xs text-[#1E1E1E]/60 leading-relaxed italic">Maximum 5 photos pour garantir une présentation claire et qualitative. Vos clients choisissent un regard avant un prix.</p>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div>
                            <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-6 flex items-center gap-2">
                                <Check className="w-5 h-5 text-[#B79A63]" /> 3. Présentation détaillée
                            </h2>
                            <p className="text-sm text-[#1E1E1E]/60 mb-6 font-lato italic">"Les clients choisissent un regard avant un prix." - Décrivez votre style, votre matériel et votre approche.</p>
                            <div className="prose-editor">
                                <ReactQuill theme="snow" value={baseData.bio} onChange={(val: string) => setBaseData({ ...baseData, bio: val })} placeholder="Écrivez ici votre présentation..." className="bg-[#F8F5F0] rounded-xl overflow-hidden border border-[#D4D2CF] min-h-[300px]" />
                            </div>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <h2 className="text-xl font-serif font-bold text-[#1E1E1E]">4. Prestations proposées</h2>

                        <div className="space-y-6">
                            <Label className="text-sm font-bold uppercase tracking-widest text-[#B79A63] border-b border-[#F8F5F0] pb-2 block">Couverture possible</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {COVERAGE_OPTIONS.map(it => (
                                    <button
                                        key={it.id}
                                        onClick={() => toggleArrayItem(photographerData, setPhotographerData, 'coverage_options', it.id)}
                                        className={cn(
                                            "flex items-center gap-3 p-5 rounded-2xl border transition-all text-left",
                                            photographerData.coverage_options.includes(it.id)
                                                ? "bg-[#1E1E1E] text-white border-[#1E1E1E] shadow-md"
                                                : "bg-[#F8F5F0] border-transparent text-[#1E1E1E]/60"
                                        )}
                                    >
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", photographerData.coverage_options.includes(it.id) ? "bg-[#B79A63]" : "bg-white")}>
                                            {it.icon}
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wider">{it.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-[#F8F5F0]">
                            <Label className="text-sm font-bold uppercase tracking-widest text-[#B79A63] mb-6 block">Type de prestation</Label>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { id: 'photographie', label: 'Photographie', icon: <Camera className="w-5 h-5" /> },
                                    { id: 'video', label: 'Vidéo', icon: <Video className="w-5 h-5" /> }
                                ].map(it => (
                                    <button
                                        key={it.id}
                                        onClick={() => toggleArrayItem(photographerData, setPhotographerData, 'service_types', it.id)}
                                        className={cn(
                                            "flex items-center gap-4 p-6 rounded-2xl border transition-all text-left",
                                            photographerData.service_types.includes(it.id)
                                                ? "bg-[#1E1E1E] text-white border-[#1E1E1E] shadow-md"
                                                : "bg-white border-[#D4D2CF] text-[#1E1E1E]/60 hover:border-[#B79A63]"
                                        )}
                                    >
                                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", photographerData.service_types.includes(it.id) ? "bg-[#B79A63]" : "bg-[#F8F5F0]")}>
                                            {it.icon}
                                        </div>
                                        <span className="text-sm font-bold uppercase tracking-widest">{it.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <h2 className="text-xl font-serif font-bold text-[#1E1E1E]">5. Services & Options</h2>

                        <div className="space-y-6">
                            <Label className="text-sm font-bold uppercase tracking-widest text-[#B79A63] border-b border-[#F8F5F0] pb-2 block">Options techniques</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {TECHNICAL_OPTIONS.map(it => (
                                    <button
                                        key={it.id}
                                        onClick={() => toggleArrayItem(photographerData, setPhotographerData, 'technical_options', it.id)}
                                        className={cn(
                                            "flex items-center gap-3 p-5 rounded-2xl border transition-all text-left",
                                            photographerData.technical_options.includes(it.id)
                                                ? "bg-[#1E1E1E] text-white border-[#1E1E1E] shadow-md"
                                                : "bg-[#F8F5F0] border-transparent text-[#1E1E1E]/60"
                                        )}
                                    >
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", photographerData.technical_options.includes(it.id) ? "bg-[#B79A63]" : "bg-white")}>
                                            {it.icon}
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wider">{it.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-[#F8F5F0]">
                            <Label className="text-sm font-bold uppercase tracking-widest text-[#B79A63] mb-6 block">Livrables</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {DELIVERABLES.map(it => (
                                    <button
                                        key={it.id}
                                        onClick={() => toggleArrayItem(photographerData, setPhotographerData, 'deliverables', it.id)}
                                        className={cn(
                                            "flex items-center gap-3 p-5 rounded-2xl border transition-all text-left",
                                            photographerData.deliverables.includes(it.id)
                                                ? "bg-[#1E1E1E] text-white border-[#1E1E1E] shadow-md"
                                                : "bg-[#F8F5F0] border-transparent text-[#1E1E1E]/60"
                                        )}
                                    >
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", photographerData.deliverables.includes(it.id) ? "bg-[#B79A63]" : "bg-white")}>
                                            {it.icon}
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{it.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 6 — Tarifs */}
                {step === 6 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <h2 className="text-xl font-serif font-bold text-[#1E1E1E]">6. Tarification</h2>

                        <div className="flex justify-center">
                            <div className="bg-[#1E1E1E] rounded-3xl p-8 text-white relative flex flex-col items-center gap-6 shadow-2xl border border-[#B79A63]/20 w-full max-w-sm">
                                <div className="w-16 h-16 bg-[#B79A63] rounded-2xl flex items-center justify-center shadow-lg transform rotate-3"><DollarSign className="w-8 h-8 text-white" /></div>
                                <div className="text-center w-full">
                                    <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B79A63] mb-2 block">Prix à partir de (DA)</Label>
                                    <div className="flex items-center gap-3 justify-center">
                                        <input type="number" value={baseData.base_price || ""} onChange={e => setBaseData({ ...baseData, base_price: Number(e.target.value) })} className="bg-transparent border-b-2 border-[#B79A63] text-4xl font-serif text-white focus:outline-none w-[180px] text-center" placeholder="0" />
                                        <span className="text-2xl font-serif text-white/40">DZD</span>
                                    </div>
                                    <p className="text-[9px] text-white/40 mt-4 italic">Le tarif final dépend du contexte réel de l'événement.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 7 — Logistique */}
                {step === 7 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <h2 className="text-xl font-serif font-bold text-[#1E1E1E]">7. Logistique</h2>

                        <div className="space-y-6">
                            <div className="space-y-4">
                                <Label className="text-sm font-bold flex items-center gap-2">
                                    <Car className="w-4 h-4 text-[#B79A63]" /> Déplacement possible ?
                                </Label>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                    {wilayas.map(w => (
                                        <button
                                            key={w.id}
                                            onClick={() => toggleArrayItem(baseData, setBaseData, 'travel_wilayas', w.id)}
                                            className={cn(
                                                "px-3 py-2 rounded-lg border text-[9px] font-bold uppercase transition-all",
                                                baseData.travel_wilayas.includes(w.id) ? "bg-[#B79A63] text-white border-[#B79A63]" : "bg-[#F8F5F0] border-transparent text-[#1E1E1E]/40"
                                            )}
                                        >
                                            {w.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-[#1E1E1E]/60 uppercase tracking-widest flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5" /> Délais de livraison (semaines)
                                </Label>
                                <GildedInput type="number" value={photographerData.delivery_time_weeks} onChange={e => setPhotographerData({ ...photographerData, delivery_time_weeks: Number(e.target.value) })} />
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 8 — Conditions */}
                {step === 8 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <h2 className="text-xl font-serif font-bold text-[#1E1E1E]">8. Conditions <span className="text-[#B79A63] font-normal">(optionnelles)</span></h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-[#1E1E1E]/60 uppercase tracking-widest flex items-center gap-2">
                                        <DollarSign className="w-3.5 h-3.5" /> Acompte demandé
                                    </Label>
                                    <GildedInput value={photographerData.acompte_demande} onChange={e => setPhotographerData({ ...photographerData, acompte_demande: e.target.value })} placeholder="Ex: 30% d'acompte" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-[#1E1E1E]/60 uppercase tracking-widest flex items-center gap-2">
                                    <X className="w-3.5 h-3.5" /> Politique d'annulation
                                </Label>
                                <textarea
                                    value={photographerData.politique_annulation}
                                    onChange={e => setPhotographerData({ ...photographerData, politique_annulation: e.target.value })}
                                    rows={5}
                                    className="w-full bg-[#F8F5F0] border border-[#D4D2CF] rounded-xl p-4 text-sm font-lato focus:ring-1 focus:ring-[#B79A63] outline-none"
                                    placeholder="Ex: Toute annulation moins de 15 jours avant..."
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between mt-8 sticky bottom-8 z-50">
                <div>
                    {step > 1 && (
                        <button
                            onClick={() => { setStep(prev => prev - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#1E1E1E]/40 hover:text-[#B79A63] transition-colors h-14 px-8 rounded-2xl border border-[#D4D2CF]/40 shadow-xl bg-white/90 backdrop-blur-md"
                        >
                            <ChevronLeft className="w-5 h-5" /> Précédent
                        </button>
                    )}
                </div>

                <div className="flex gap-4">
                    {step < 8 ? (
                        <>
                            <GildedButton
                                variant="outline"
                                onClick={handleSaveDraft}
                                disabled={saving}
                                className="h-14 px-8 rounded-2xl shadow-xl"
                            >
                                {saving ? <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Sauvegarde...</> : <><Save className="w-5 h-5 mr-2" /> Brouillon</>}
                            </GildedButton>
                            <GildedButton
                                onClick={() => { setStep(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className="h-14 px-10 rounded-2xl shadow-xl hover:translate-x-1 duration-300"
                            >
                                Suivant <ArrowRight className="w-5 h-5 ml-2" />
                            </GildedButton>
                        </>
                    ) : (
                        <GildedButton
                            onClick={() => handleSave()}
                            disabled={saving}
                            className="h-14 px-12 rounded-2xl bg-[#1E1E1E] text-white hover:bg-[#B79A63] shadow-xl"
                        >
                            {saving ? <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Sauvegarde...</> : <><Save className="w-5 h-5 mr-3" /> Soumettre pour validation</>}
                        </GildedButton>
                    )}
                </div>
            </div>
        </div>
    );
}
