import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
    User, Store, MapPin, Globe, Phone, Info, Mail, Camera, Save,
    Check, X, Plus, Trash2, Calendar, Loader2, Image as ImageIcon,
    LayoutGrid, List, MessageSquare, Briefcase, Star, Clock,
    AlertCircle, CheckCircle, XCircle, Share2, Instagram, Facebook,
    Linkedin, Twitter, ExternalLink, Shield, ShieldCheck, Rocket,
    ArrowRight, ChevronRight, ChevronLeft, Search, Filter, SlidersHorizontal,
    MoreVertical, Edit2, Pencil, Trash, Download, Upload, Eye, EyeOff,
    UserCircle2, Building2, Smartphone
} from "lucide-react";
import { GildedButton } from "@/components/ui/gilded-button";
import { GildedInput } from "@/components/ui/gilded-input";
import { GildedMultiSelect } from "@/components/ui/gilded-multi-select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
// DonutProgress removed as obsolete
import { cn } from "@/lib/utils";
import { AvatarUpload } from "./components/AvatarUpload";
import { SageTip, SAGE_TIPS } from "./components/SageTip";
import { StickyActionBar } from "./components/StickyActionBar";
import { RejectionModal } from "../../components/partner/RejectionModal";
// @ts-ignore
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface Option {
    id: string;
    name: string;
    label: string;
}

interface Wilaya {
    id: string;
    name: string;
    code: string;
}

interface Commune {
    id: string;
    name: string;
    wilaya_id: string;
}

export default function Profile({ providerIdProp, isNewProp }: { providerIdProp?: string; isNewProp?: boolean }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Admin Mode Params - Check URL OR Props
    const adminMode = searchParams.get('adminMode') === 'true' || !!providerIdProp || !!isNewProp;
    const targetProviderId = providerIdProp || searchParams.get('providerId');
    const isNew = isNewProp || searchParams.get('new') === 'true';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // For Admin: User Selection
    const [selectedUserId, setSelectedUserId] = useState<string>("");

    // New User Creation & Linking State
    const [newUserMode, setNewUserMode] = useState(adminMode && isNew);
    const [shadowMode, setShadowMode] = useState(adminMode && isNew); // Default to Shadow Mode if New
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newUserPassword, setNewUserPassword] = useState("");
    const [newUserName, setNewUserName] = useState("");
    const [creatingUser, setCreatingUser] = useState(false);
    const [hasLinkedUser, setHasLinkedUser] = useState(true); // Default true to hide linking block until fetch proves false

    // Lookups
    const [wilayas, setWilayas] = useState<Wilaya[]>([]);
    const [communes, setCommunes] = useState<Commune[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        email: "",
        commercial_name: "",
        slug: "",
        bio: "",
        profile_picture_url: "",
        wilaya_id: "",
        phone_number: "",
        is_whatsapp_active: false,
        is_viber_active: false,
        social_link: "",
        provider_type: "individual", // 'agency' | 'individual'
        pending_changes: null as any,
    });

    const [providerStatus, setProviderStatus] = useState<string>('incomplete');
    const [submitting, setSubmitting] = useState(false);

    // Locked mode: lock when pending OR incomplete (unlocked only when approved or rejected)
    const isLocked = !adminMode && (providerStatus === 'pending' || providerStatus === 'incomplete');

    useEffect(() => {
        fetchLookups();

        if (adminMode) {
            if (isNew) {
                // Admin creating new provider: No user fetch needed anymore (strict create mode)
                setLoading(false);
            } else if (targetProviderId) {
                fetchProfile(targetProviderId);
            }
        } else if (user) {
            fetchProfile();
        }
    }, [user, adminMode, targetProviderId, isNew]);

    const fetchLookups = async () => {
        try {
            const [w, c] = await Promise.all([
                supabase.from("wilayas").select("*").order("code"),
                supabase.from("communes").select("*").order("name"),
            ]);

            if (w.data) setWilayas(w.data);
            if (c.data) setCommunes(c.data);
        } catch (error) {
            console.error("Error fetching lookups:", error);
        }
    };

    const fetchProfile = async (specificId?: string) => {
        try {
            setLoading(true);
            console.log("fetchProfile called with specificId:", specificId);

            // Build the query with junction tables
            let query = supabase
                .from("providers")
                .select(`*`);

            if (specificId) {
                query = query.eq("id", specificId);
            } else {
                query = query.eq("user_id", user?.id);
            }

            const { data: provider, error } = await query.limit(1).maybeSingle();

            console.log("Provider data:", provider, "Error:", error);

            if (error) {
                if (error.code !== "PGRST116") {
                    console.error("Error fetching provider:", error);
                    throw error;
                }
                console.log("No provider found (PGRST116)");
                return;
            }

            if (provider) {
                // Check if user is linked
                setHasLinkedUser(!!(provider as any).user_id);

                // Store provider status
                setProviderStatus((provider as any).moderation_status || 'incomplete');

                const dataToLoad = (provider as any).pending_changes
                    ? { ...provider, ...(provider as any).pending_changes }
                    : provider;

                console.log("Loading provider data from DB:", dataToLoad);

                // Fallback to waitlist for missing registration data
                let phoneFallback = dataToLoad.phone_number || "";
                let socialFallback = dataToLoad.social_link || "";

                if ((!phoneFallback || !socialFallback) && user?.email) {
                    try {
                        const { data: waitlistData } = await (supabase as any)
                            .from('provider_waitlist')
                            .select('phone, website')
                            .eq('email', user.email)
                            .maybeSingle();

                        if (waitlistData) {
                            if (!phoneFallback) phoneFallback = waitlistData.phone || "";
                            if (!socialFallback) socialFallback = waitlistData.website || "";
                        }
                    } catch (e) {
                        console.warn("Could not fetch waitlist fallback:", e);
                    }
                }

                setFormData({
                    email: (provider as any).email || (user?.email || ""),
                    commercial_name: dataToLoad.commercial_name || "",
                    slug: dataToLoad.slug || "",
                    bio: dataToLoad.bio || "",
                    profile_picture_url: dataToLoad.profile_picture_url || "",
                    wilaya_id: dataToLoad.wilaya_id || "",
                    phone_number: phoneFallback,
                    is_whatsapp_active: dataToLoad.is_whatsapp_active || false,
                    is_viber_active: dataToLoad.is_viber_active || false,
                    social_link: socialFallback,
                    provider_type: dataToLoad.provider_type || "individual",
                    pending_changes: dataToLoad.pending_changes,
                });
            } else if (user) {
                // No provider found in DB, use Auth metadata as fallback
                console.log("No provider found in DB, using metadata fallback:", user.user_metadata);
                const metadata = user.user_metadata || {};
                setFormData({
                    email: user.email || "",
                    commercial_name: metadata.business_name || metadata.businessName || metadata.display_name || "",
                    slug: "",
                    bio: "",
                    profile_picture_url: "",
                    wilaya_id: metadata.wilaya_id || metadata.wilaya || "",
                    phone_number: metadata.phone || "",
                    is_whatsapp_active: false,
                    is_viber_active: false,
                    social_link: metadata.social_link || metadata.socialLink || "",
                    provider_type: metadata.partner_type || metadata.partnerType || "individual",
                    pending_changes: null,
                });
                setProviderStatus('incomplete');
            }
        } catch (error: any) {
            console.error("Error in fetchProfile:", error);
            toast.error("Erreur lors du chargement du profil");
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarSuccess = async (url: string) => {
        setFormData(prev => ({ ...prev, profile_picture_url: url }));
        if (user) {
            try {
                const { data: providerData } = await supabase
                    .from("providers")
                    .select("id")
                    .eq("user_id", user.id)
                    .limit(1)
                    .maybeSingle();

                if (providerData) {
                    await supabase.from("providers")
                        .update({ profile_picture_url: url })
                        .eq("id", providerData.id);
                    fetchProfile();
                }
            } catch (err) {
                console.error("Failed to sync avatar to DB:", err);
            }
        }
    };

    const handleLinkUser = async () => {
        if (!newUserEmail || !newUserPassword || !newUserName) {
            toast.error("Veuillez remplir tous les champs utilisateur");
            return;
        }

        try {
            setCreatingUser(true);
            // 1. Create User
            const { data: userId, error: sError } = await (supabase.rpc as any)('create_partner_user', {
                email: newUserEmail,
                password: newUserPassword,
                full_name: newUserName
            });

            if (sError) throw sError;

            // 2. Update Provider
            if (targetProviderId) {
                const { error: updError } = await supabase
                    .from("providers")
                    .update({ user_id: userId as any })
                    .eq("id", targetProviderId);

                if (updError) throw updError;

                toast.success("Compte utilisateur créé et lié avec succès !");
                setHasLinkedUser(true);
                // Clear fields
                setNewUserEmail("");
                setNewUserPassword("");
                setNewUserName("");
                // Refresh
                fetchProfile(targetProviderId);
            }

        } catch (error: any) {
            console.error("Link Error:", error);
            toast.error("Erreur liaison: " + error.message);
        } finally {
            setCreatingUser(false);
        }
    };

    const stripHtml = (html: string) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    };

    const validateAlgerianPhone = (phone: string) => {
        const cleanPhone = phone.replace(/[\s\.]/g, '');
        // Standard: 05/06/07 + 8 digits = 10 total
        if (/^0[567]\d{8}$/.test(cleanPhone)) return true;
        // International: +213 + 5/6/7 + 8 digits = 13 total
        if (/^\+213[567]\d{8}$/.test(cleanPhone)) return true;
        return false;
    };

    const handleGlobalSave = async (submitForValidation: boolean = true) => {
        // Validation removed for brevity, check original logic
        if (!user && !adminMode) return;
        setSaving(true);

        try {
            if (!formData.commercial_name || !formData.phone_number || !formData.wilaya_id) {
                toast.error("Veuillez remplir tous les champs obligatoires (*)");
                setSaving(false);
                return;
            }

            if (!validateAlgerianPhone(formData.phone_number)) {
                toast.error("Format de téléphone invalide. Utilisez 05/06/07XXXXXXXX ou +213XXXXXXXXX");
                setSaving(false);
                return;
            }

            // User Creation Check (omitted for brevity, assume exists or shadow)

            let providerId = targetProviderId;
            if (!providerId && user && (!adminMode || (adminMode && !isNew))) {
                const { data: providerData } = await supabase.from("providers").select("id").eq("user_id", user.id).maybeSingle();
                providerId = providerData?.id;
            }

            const profileData: Record<string, any> = {
                commercial_name: formData.commercial_name,
                bio: formData.bio,
                profile_picture_url: formData.profile_picture_url,
                wilaya_id: formData.wilaya_id || null,
                phone_number: formData.phone_number,
                is_whatsapp_active: formData.is_whatsapp_active,
                is_viber_active: formData.is_viber_active,
                social_link: formData.social_link,
                provider_type: formData.provider_type,
                updated_at: new Date().toISOString(),
            };

            if (isNew && adminMode) {
                if (shadowMode) {
                    profileData.user_id = null;
                } else if (selectedUserId) {
                    profileData.user_id = selectedUserId;
                }
            }

            // Logic to save (Update or Insert)
            // Check current status if not new
            let currentStatus = 'pending';
            if (providerId && !adminMode) {
                const { data: curr } = await supabase.from('providers').select('moderation_status').eq('id', providerId).single();
                currentStatus = (curr as any)?.moderation_status || 'pending';
            }

            const shouldSubmitPending = !adminMode && !isNew && currentStatus === 'approved';

            if (shouldSubmitPending) {
                const { error: pendError } = await supabase.from("providers").update({
                    pending_changes: profileData as any
                }).eq("id", providerId);
                if (pendError) throw pendError;

                if (submitForValidation) {
                    // Notify Admins
                    try {
                        await (supabase.rpc as any)('notify_admins_of_modification', { provider_id: providerId });
                    } catch (notifErr) {
                        console.error("Failed to notify admins:", notifErr);
                    }

                    toast.success("Modifications envoyées pour validation");
                } else {
                    toast.success("Brouillon des modifications enregistré");
                }
                fetchProfile(); // Reload to show the banner
            } else {
                if (providerId) {
                    const { error: updError } = await supabase.from("providers").update({
                        ...profileData,
                        moderation_status: user && !adminMode ? 'pending' : (profileData.moderation_status || 'approved')
                    } as any).eq("id", providerId);
                    if (updError) throw updError;
                } else {
                    const insertData: any = {
                        ...profileData,
                        ...(isNew && adminMode && shadowMode ? { user_id: null } : {}),
                        ...(!adminMode && user ? { user_id: user.id } : {}),
                        moderation_status: adminMode ? 'approved' : 'pending',
                    };
                    const { data: newProvider, error: insError } = await supabase.from("providers").insert(insertData).select().single();
                    if (insError) throw insError;
                    providerId = newProvider?.id;
                }
            }

            // Note: Service syncing logic removed from here as it's no longer part of the Profile page in V1.

            // If incomplete and not admin, trigger validation automatically
            if (providerStatus === 'incomplete' && !adminMode && providerId) {
                try {
                    await (supabase.rpc as any)('submit_provider_for_validation', {
                        provider_id: providerId
                    });
                    toast.success("✅ Profil mis à jour et soumis pour validation !");
                } catch (submissionError) {
                    console.error("Auto-submission error:", submissionError);
                    toast.error("Profil enregistré mais erreur lors de la soumission pour validation.");
                }
            } else if (!shouldSubmitPending) {
                toast.success("Profil mis à jour avec succès");
            }

            if (adminMode && providerId) {
                navigate(`/admin/providers/${providerId}/services`);
            } else {
                fetchProfile();
            }

        } catch (error: any) {
            console.error("Save Error:", error);
            toast.error(`Erreur: ${error.message || "Erreur lors de l'enregistrement"}`);
        } finally {
            setSaving(false);
        }
    };

    // liveScore logic removed as redundant
    // filteredCommunes logic removed as redundant (no more communes in UI)

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#B79A63]" />
            </div>
        );
    }

    const SectionLabel = ({ children, icon: Icon, required, tipId }: { children: React.ReactNode, icon?: any, required?: boolean, tipId?: keyof typeof SAGE_TIPS }) => (
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
                <Label className="flex items-center gap-2 text-sm font-bold text-[#1E1E1E]">
                    {Icon && <Icon className="w-3.5 h-3.5 text-[#B79A63]" />}
                    {children}
                    {required && <span className="text-[#B79A63] ml-1">*</span>}
                </Label>
                {tipId && <SageTip tipId={tipId} />}
            </div>
            <Pencil className="w-3 h-3 text-[#B79A63]/40" />
        </div>
    );

    const isFormVisible = selectedUserId || (!adminMode && user) || (adminMode && shadowMode) || (adminMode && targetProviderId && !isNew);

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-36 md:pb-32 px-4 md:px-8 relative">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#1E1E1E] tracking-tight">
                        {adminMode ? (isNew ? "Création Prestataire" : "Édition (Admin)") : "Mon Profil"}
                    </h1>
                    <p className="text-[#1E1E1E]/60 font-lato text-base md:text-lg max-w-2xl">
                        {adminMode ? "Modification forcée du profil." : "Personnalisez votre présentation. Une page élégante et complète attire plus de futurs mariés."}
                    </p>
                </div>



                <div className="flex flex-wrap items-center gap-4">
                    {!adminMode && (
                        <>
                            {providerStatus === 'approved' && !formData.pending_changes && (
                                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="p-1.5 bg-white rounded-lg shadow-sm border border-emerald-100">
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider">Profil Vérifié</p>
                                        <p className="text-[10px] opacity-80 font-medium">En ligne & Visible</p>
                                    </div>
                                </div>
                            )}

                            {providerStatus === 'pending' && (
                                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-orange-500/20 bg-orange-500/5 text-orange-600 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="p-1.5 bg-white rounded-lg shadow-sm border border-orange-100">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider">En cours de validation</p>
                                        <p className="text-[10px] opacity-80 font-medium">Profil en attente de revue</p>
                                    </div>
                                </div>
                            )}

                            {providerStatus === 'approved' && formData.pending_changes && (
                                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 text-blue-600 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="p-1.5 bg-white rounded-lg shadow-sm border border-blue-100">
                                        <div className="relative">
                                            <Check className="w-4 h-4" />
                                            <Clock className="w-2 h-2 absolute -top-1 -right-1 text-blue-500 bg-white rounded-full" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider">En ligne (Ancienne Version)</p>
                                        <p className="text-[10px] opacity-80 font-medium tracking-tight">Nouvelles infos en cours de validation</p>
                                    </div>
                                </div>
                            )}

                            {providerStatus === 'rejected' && (
                                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-600 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="p-1.5 bg-white rounded-lg shadow-sm border border-red-100">
                                        <AlertCircle className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider">Modifications Requises</p>
                                        <p className="text-[10px] opacity-80 font-medium">Voir les notes de l'admin</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                </div>
            </div>

            {/* ── Dynamic Status Banner ─────────────────────────────────────────── */}
            {!adminMode && (() => {
                switch (providerStatus) {

                    case 'incomplete':
                        return (
                            <div className="bg-orange-50 border-l-4 border-orange-400 py-6 px-8 mb-4 mt-4 rounded-r-3xl mx-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-700">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                        <AlertCircle className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <h3 className="font-serif font-bold text-xl text-orange-600">Profil à compléter</h3>
                                </div>
                                <p className="text-orange-500 text-sm leading-relaxed ml-14">
                                    Votre vitrine Far7i prend forme. Complétez vos informations et enregistrez pour soumettre votre profil à l'équipe de modération.
                                </p>
                                <p className="text-orange-600 font-semibold text-sm mt-2 ml-14">
                                    Vous pourrez modifier vos informations une fois votre profil validé par un administrateur.
                                </p>
                            </div>
                        );

                    case 'pending':
                        return (
                            <div className="bg-amber-500/10 border-l-4 border-orange-500 py-6 px-8 mb-4 mt-4 rounded-r-3xl mx-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-700">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center border border-orange-400/30 shadow-md animate-pulse shrink-0">
                                            <Clock className="w-7 h-7 text-orange-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-serif font-bold text-xl text-orange-600">
                                                En cours de validation
                                            </h3>
                                            <p className="text-orange-500 max-w-2xl text-sm leading-relaxed">
                                                Votre profil a bien été enregistré et est actuellement en cours d'examen par notre équipe de modération.
                                            </p>
                                            <p className="text-orange-600 font-semibold text-xs mt-1">
                                                Vous pourrez modifier vos informations une fois votre profil validé par un administrateur.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0">
                                        <GildedButton
                                            onClick={() => navigate('/partner/dashboard/services')}
                                            className="shadow-xl bg-orange-500 hover:bg-orange-600 text-white border-none hover:scale-105 transition-transform"
                                        >
                                            <span>Préparer mes prestations</span>
                                            <ArrowRight className="ml-2 w-5 h-5" />
                                        </GildedButton>
                                    </div>
                                </div>
                            </div>
                        );

                    case 'approved':
                        return formData.pending_changes ? (
                            <div className="bg-blue-50 border-l-4 border-blue-400 py-4 px-8 mb-4 mt-4 rounded-r-3xl mx-6 shadow-sm animate-in fade-in duration-500">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                        <Clock className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-blue-700 uppercase tracking-wide">Modifications en cours de validation</h3>
                                        <p className="text-blue-600 text-sm">Votre vitrine est en ligne avec l'ancienne version. Les nouvelles infos seront publiées après validation.</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-emerald-50 border-l-4 border-emerald-400 py-4 px-8 mb-4 mt-4 rounded-r-3xl mx-6 shadow-sm animate-in fade-in duration-500">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-emerald-700 uppercase tracking-wide">Vitrine active &amp; visible</h3>
                                        <p className="text-emerald-600 text-sm">Votre profil est validé. Vous êtes visible par les futurs mariés sur Far7i.</p>
                                    </div>
                                </div>
                            </div>
                        );

                    case 'rejected':
                        return (
                            <div className="bg-red-50 border-l-4 border-red-400 py-4 px-8 mb-4 mt-4 rounded-r-3xl mx-6 shadow-sm animate-in fade-in duration-500">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-red-700 uppercase tracking-wide">Modifications requises</h3>
                                        <p className="text-red-600 text-sm">Votre profil a été refusé. Veuillez consulter les notes de l'administrateur et corriger les informations demandées.</p>
                                    </div>
                                </div>
                            </div>
                        );

                    default:
                        return null;
                }
            })()}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-12 space-y-8">

                    {/* Card 1: Identity & Type */}
                    <section className="bg-white rounded-3xl border border-[#D4D2CF]/50 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                        <div className="p-8 md:p-10 space-y-8">

                            {/* ADMIN USER MANAGEMENT BLOCK */}
                            {adminMode && (
                                <>
                                    {/* CREATION MODE: Shadow Info */}
                                    {isNew && (
                                        <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl mb-6 space-y-4">
                                            <h3 className="font-bold text-amber-900 border-b border-amber-200 pb-2">Nouveau Prestataire</h3>
                                            <div className="p-4 bg-white/50 rounded-lg border border-amber-100 text-sm text-amber-800">
                                                <p className="flex items-center gap-2 font-bold mb-1">
                                                    <Info className="w-4 h-4" /> Création de Fiche (Mode Invité)
                                                </p>
                                                <p>
                                                    Ce profil est créé sans compte utilisateur associé (Shadow Profile).
                                                    Remplissez simplement les informations ci-dessous et enregistrez.
                                                    Vous pourrez lier un compte email ultérieurement.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* EDIT MODE: Link User if missing */}
                                    {!isNew && !hasLinkedUser && (
                                        <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl mb-6 space-y-4">
                                            <h3 className="font-bold text-blue-900 border-b border-blue-200 pb-2">Lier un Compte Utilisateur</h3>

                                            <div className="p-3 bg-white/50 rounded-lg border border-blue-100 text-sm text-blue-800 mb-4">
                                                Ce prestataire n'a pas encore de compte utilisateur (Email/Mot de passe) pour se connecter.
                                                Créez-en un maintenant pour lui donner accès.
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-blue-800">Email *</Label>
                                                    <input
                                                        type="email"
                                                        value={newUserEmail}
                                                        onChange={(e) => setNewUserEmail(e.target.value)}
                                                        className="w-full h-11 rounded-lg border border-blue-200 p-2 text-sm"
                                                        placeholder="email@exemple.com"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-blue-800">Mot de passe *</Label>
                                                    <input
                                                        type="text"
                                                        value={newUserPassword}
                                                        onChange={(e) => setNewUserPassword(e.target.value)}
                                                        className="w-full h-11 rounded-lg border border-blue-200 p-2 text-sm"
                                                        placeholder="Mot de passe"
                                                    />
                                                </div>
                                                <div className="space-y-2 md:col-span-2">
                                                    <Label className="text-blue-800">Nom Complet *</Label>
                                                    <input
                                                        type="text"
                                                        value={newUserName}
                                                        onChange={(e) => setNewUserName(e.target.value)}
                                                        className="w-full h-11 rounded-lg border border-blue-200 p-2 text-sm"
                                                        placeholder="Nom Prénom"
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <button
                                                        onClick={handleLinkUser}
                                                        disabled={creatingUser}
                                                        type="button"
                                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
                                                    >
                                                        {creatingUser ? "Liaison en cours..." : "Créer le Compte et Lier"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* MAIN FORM CONTENT */}
                            {isFormVisible && (
                                <div className={cn(
                                    "space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500",
                                    isLocked && "opacity-60 pointer-events-none select-none cursor-not-allowed"
                                )}>
                                    <div className="flex flex-col md:flex-row gap-10 pt-4">
                                        {/* Avatar Section */}
                                        <div className="flex flex-col items-center space-y-4 md:w-1/3 xl:w-1/4">
                                            <div className="p-6 bg-[#F8F5F0]/50 rounded-3xl border border-[#D4D2CF]/50 w-full flex flex-col items-center justify-center space-y-4 shadow-sm">
                                                <AvatarUpload
                                                    userId={user?.id || ''}
                                                    currentUrl={formData.profile_picture_url}
                                                    onUploadSuccess={handleAvatarSuccess}
                                                />
                                                <div className="text-center">
                                                    <p className="text-sm font-bold text-[#1E1E1E]">Photo de Profil</p>
                                                    <p className="text-xs text-[#1E1E1E]/60 mt-1">Format carré recommandé. Max 5MB.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-10 w-full">

                                            {/* Profil Section */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3 border-b border-[#F8F5F0] pb-2">
                                                    <h3 className="text-xl font-serif font-semibold text-[#1E1E1E]">Profil</h3>
                                                </div>

                                                <div className="bg-[#F8F5F0]/40 rounded-3xl p-6 md:p-8 border border-[#D4D2CF]/60 space-y-8">

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div className="space-y-2">
                                                            <SectionLabel icon={Store} required>Nom Commercial</SectionLabel>
                                                            <GildedInput
                                                                value={formData.commercial_name || ""}
                                                                onChange={(e) => setFormData({ ...formData, commercial_name: e.target.value })}
                                                                placeholder="Le nom de votre entreprise"
                                                                disabled={isLocked}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <SectionLabel icon={Briefcase} required>Type de Prestataire</SectionLabel>
                                                            <select
                                                                value={formData.provider_type || ""}
                                                                onChange={(e) => setFormData({ ...formData, provider_type: e.target.value as 'agency' | 'solo' })}
                                                                className="w-full h-12 rounded-2xl border border-[#D4D2CF] bg-white px-4 py-2 text-sm focus:border-[#B79A63] focus:ring-1 focus:ring-[#B79A63] outline-none transition-all disabled:opacity-50"
                                                                disabled={isLocked}
                                                            >
                                                                <option value="" disabled>Sélectionnez un type</option>
                                                                <option value="solo">Indépendant / Freelance</option>
                                                                <option value="agency">Agence / Équipe</option>
                                                            </select>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div className="space-y-2">
                                                                <SectionLabel icon={Phone} required>Téléphone</SectionLabel>
                                                                <GildedInput
                                                                    type="tel"
                                                                    value={formData.phone_number || ""}
                                                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                                                    placeholder="05XX XX XX XX"
                                                                    disabled={isLocked}
                                                                />
                                                            </div>

                                                            <div className="flex flex-wrap gap-4">
                                                                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white border border-[#D4D2CF]/30 shadow-sm">
                                                                    <Switch
                                                                        checked={formData.is_whatsapp_active}
                                                                        onCheckedChange={(val) => setFormData({ ...formData, is_whatsapp_active: val })}
                                                                        disabled={isLocked}
                                                                    />
                                                                    <span className="text-xs font-bold text-emerald-600">WhatsApp</span>
                                                                </div>
                                                                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white border border-[#D4D2CF]/30 shadow-sm">
                                                                    <Switch
                                                                        checked={formData.is_viber_active}
                                                                        onCheckedChange={(val) => setFormData({ ...formData, is_viber_active: val })}
                                                                        disabled={isLocked}
                                                                    />
                                                                    <span className="text-xs font-bold text-purple-600">Viber</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <SectionLabel icon={MapPin} required>Wilaya</SectionLabel>
                                                            <select
                                                                value={formData.wilaya_id || ""}
                                                                onChange={(e) => setFormData({ ...formData, wilaya_id: e.target.value })}
                                                                className="w-full h-12 rounded-2xl border border-[#D4D2CF] bg-white px-4 py-2 text-sm focus:border-[#B79A63] focus:ring-1 focus:ring-[#B79A63] outline-none transition-all disabled:opacity-50"
                                                                disabled={isLocked}
                                                            >
                                                                <option value="" disabled>Sélectionnez votre Wilaya</option>
                                                                {wilayas.map(w => (
                                                                    <option key={w.id} value={w.id}>
                                                                        {w.code} - {w.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div className="space-y-2 md:col-span-2">
                                                            <SectionLabel icon={Mail}>Email (Non modifiable)</SectionLabel>
                                                            <div className="w-full h-12 flex items-center rounded-2xl border border-[#D4D2CF] bg-[#F8F5F0]/50 px-4 py-2 text-sm text-[#1E1E1E]/50 font-medium">
                                                                {formData.email || user?.email}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2 md:col-span-2">
                                                            <SectionLabel icon={Globe}>Lien Réseau Social (Instagram/Facebook)</SectionLabel>
                                                            <GildedInput
                                                                type="url"
                                                                value={formData.social_link || ""}
                                                                onChange={(e) => setFormData({ ...formData, social_link: e.target.value })}
                                                                placeholder="https://instagram.com/votre.page"
                                                                disabled={isLocked}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>



                                        {/* La section Biographie a été supprimée suite à la demande */}

                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {
                        isFormVisible && !isLocked && (
                            <>
                                {/* Removed Expertise and Location Sections to simplify the profile as requested */}

                                <div className="hidden md:flex fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-[#D4D2CF] p-6 justify-center items-center shadow-2xl">
                                    <div className="max-w-[1400px] w-full flex flex-col md:flex-row items-center justify-between gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-[#B79A63] uppercase tracking-widest">Révision du Profil</span>
                                            <p className="text-sm text-[#1E1E1E]/60">Vérifiez vos modifications avant d'enregistrer.</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {providerStatus === 'approved' && !adminMode && (
                                                <button
                                                    onClick={() => handleGlobalSave(false)}
                                                    disabled={saving}
                                                    className="px-6 h-14 text-sm font-bold uppercase tracking-widest text-[#1E1E1E]/40 hover:text-[#B79A63] transition-colors disabled:opacity-30"
                                                >
                                                    Enregistrer Brouillon
                                                </button>
                                            )}
                                            <GildedButton
                                                onClick={() => handleGlobalSave(true)}
                                                disabled={saving}
                                                className="w-full md:w-64 h-14 text-lg font-bold shadow-lg shadow-[#B79A63]/20"
                                            >
                                                {saving ? (
                                                    <div className="flex items-center gap-3">
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        <span>Enregistrement...</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-3">
                                                        <Save className="w-5 h-5" />
                                                        <span>{providerStatus === 'approved' && !adminMode ? "Publier les Modifs" : "Enregistrer Tout"}</span>
                                                    </div>
                                                )}
                                            </GildedButton>
                                        </div>
                                    </div>
                                </div>

                                <StickyActionBar>
                                    <div className="flex items-center gap-2 w-full">
                                        {providerStatus === 'approved' && !adminMode && (
                                            <button
                                                onClick={() => handleGlobalSave(false)}
                                                disabled={saving}
                                                className="flex-1 h-14 text-sm font-bold uppercase tracking-widest text-[#1E1E1E]/40 disabled:opacity-30"
                                            >
                                                Brouillon
                                            </button>
                                        )}
                                        <GildedButton
                                            onClick={() => handleGlobalSave(true)}
                                            disabled={saving}
                                            className="flex-[2] h-14 text-lg font-bold shadow-xl shadow-[#B79A63]/20 rounded-2xl"
                                        >
                                            {saving ? (
                                                <div className="flex items-center gap-3">
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    <span>...</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <Save className="w-5 h-5" />
                                                    <span>{providerStatus === 'approved' && !adminMode ? "Soumettre" : "Enregistrer"}</span>
                                                </div>
                                            )}
                                        </GildedButton>
                                    </div>
                                </StickyActionBar>
                            </>
                        )
                    }
                    <RejectionModal />
                </div>
            </div>
        </div>
    );
}
