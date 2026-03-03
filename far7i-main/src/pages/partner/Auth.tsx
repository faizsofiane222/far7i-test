import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SplitScreenLayout } from "./components/SplitScreenLayout";
import { GildedInput } from "./components/GildedInput";
import { GildedButton } from "./components/GildedButton";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "sonner";
import { Loader2, AlertCircle, Phone, Check, ArrowRight } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getDashboardRoute } from "@/utils/auth-routing";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useRef } from "react";
import { compressAndUpload } from "@/lib/image-utils";
import { Camera, User, X } from "lucide-react";

type AuthMode = "login" | "signup";

// Validation Schemas
const loginSchema = z.object({
    email: z.string().email("Adresse email invalide"),
    password: z.string().min(1, "Mot de passe requis"),
});

const signupSchema = z.object({
    email: z.string().email("Adresse email invalide"),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string().min(1, "Veuillez confirmer le mot de passe"),
    businessName: z.string().min(2, "Nom de l'entreprise requis"),
    partnerType: z.enum(["individual", "agency"], { required_error: "Veuillez choisir un type" }),
    phone: z.string().regex(/^(?:(?:00213|\+213)|0)(5|6|7)[0-9]{8}$/, "Numéro de téléphone invalide (ex: 0550...)"),
    wilaya: z.string().min(1, "Veuillez sélectionner votre Wilaya"),
    socialLink: z.string().url("Lien invalide (commencez par https://)"),
    termsAccepted: z.boolean().refine(val => val === true, "Vous devez accepter les conditions d'utilisation"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
});

export default function PartnerAuth() {
    const [mode, setMode] = useState<AuthMode>("login");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showCGU, setShowCGU] = useState(false);
    const [wilayas, setWilayas] = useState<{ id: string, name: string, code: string }[]>([]);
    const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchWilayas = async () => {
            const { data, error } = await supabase.from('wilayas').select('id, name, code').eq('active', true).order('code');
            if (data && !error) setWilayas(data);
        };
        fetchWilayas();
    }, []);

    const { session } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in
    if (session) {
        getDashboardRoute(session.user).then(route => {
            navigate(route);
        });
    }

    const form = useForm<z.infer<typeof signupSchema>>({
        resolver: async (data, context, options) => {
            const schema = mode === "login" ? loginSchema : signupSchema;
            return zodResolver(schema)(data, context, options);
        },
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: "",
            businessName: "",
            partnerType: "individual",
            phone: "",
            wilaya: "",
            socialLink: "",
            termsAccepted: false
        },
    });


    const onSubmit = async (values: z.infer<typeof signupSchema>) => {
        setErrorMsg(null);
        setIsLoading(true);

        try {
            if (mode === "login") {
                const { error } = await supabase.auth.signInWithPassword({
                    email: values.email,
                    password: values.password!,
                });
                if (error) throw error;
                toast.success("Connexion réussie !");
                navigate("/partner/dashboard");
            }
            else if (mode === "signup") {
                const displayName = values.businessName;

                const { error, data } = await supabase.auth.signUp({
                    email: values.email,
                    password: values.password!,
                    options: {
                        data: {
                            role: "provider",
                            display_name: displayName,
                            phone: values.phone,
                            wilaya_id: values.wilaya,
                            partner_type: values.partnerType,
                            social_link: values.socialLink,
                            business_name: values.businessName
                        },
                    },
                });

                if (error) throw error;

                // If user is successfully created (and perhaps logged in if no confirmation required)
                // We attempt to upload the avatar if they selected one
                if (data.user && selectedAvatar) {
                    try {
                        const { publicUrl, error: uploadError } = await compressAndUpload(
                            selectedAvatar,
                            data.user.id,
                            { bucket: "provider-profiles", folder: data.user.id }
                        );
                        if (!uploadError && publicUrl) {
                            // Update the provider profile that the trigger just created
                            await supabase.from("providers")
                                .update({ profile_picture_url: publicUrl })
                                .eq("user_id", data.user.id);
                        } else {
                            console.warn("Could not upload avatar during signup (perhaps email confirmation is required):", uploadError);
                            // We don't fail the signup simply because the avatar didn't upload
                        }
                    } catch (uploadErr) {
                        console.warn("Avatar upload failed:", uploadErr);
                    }
                }

                // Show success modal
                setShowSuccessModal(true);
            }
        } catch (err: any) {
            console.error("Auth Error:", err);
            let msg = err.message;
            if (msg === "Invalid login credentials") msg = "Email ou mot de passe incorrect.";
            if (msg.includes("User already registered")) msg = "Un compte existe déjà avec cet email.";
            setErrorMsg(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SplitScreenLayout>
            <div className="space-y-6">
                <div className="text-center mb-8">
                    <h1 className="font-serif text-3xl font-bold text-[#1E1E1E] mb-2">
                        {mode === "login" && "Bon retour"}
                        {mode === "signup" && "Devenez Partenaire"}
                    </h1>
                    <p className="text-slate-500 font-sans">
                        {mode === "login" && "Accédez à votre espace professionnel."}
                        {mode === "signup" && "Rejoignez l'élite du mariage en Algérie."}
                    </p>
                </div>

                {errorMsg && (
                    <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erreur</AlertTitle>
                        <AlertDescription>{errorMsg}</AlertDescription>
                    </Alert>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        {/* Fields specific to Signup */}
                        {mode === "signup" && (
                            <>
                                {/* Avatar Selection */}
                                <div className="flex flex-col items-center justify-center space-y-3 mb-6">
                                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                        <div className="w-24 h-24 rounded-full bg-[#F8F5F0] border-2 border-[#D4D2CF] flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-[#B79A63]/50 shadow-sm relative">
                                            {avatarPreview ? (
                                                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-10 h-10 text-[#B79A63]/70" />
                                            )}
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Camera className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                        {avatarPreview && (
                                            <button
                                                type="button"
                                                className="absolute -top-2 -right-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-full p-1"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedAvatar(null);
                                                    setAvatarPreview(null);
                                                }}
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-[#1E1E1E]">Photo de profil (Optionnel)</p>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setSelectedAvatar(file);
                                                setAvatarPreview(URL.createObjectURL(file));
                                            }
                                        }}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="businessName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nom Commercial (Entreprise) <span className="text-red-500">*</span></FormLabel>
                                            <FormControl><GildedInput {...field} placeholder="Ex: Studio Lumière" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="partnerType"
                                        render={({ field }) => (
                                            <FormItem className="space-y-3">
                                                <FormLabel>Vous êtes ? <span className="text-red-500">*</span></FormLabel>
                                                <FormControl>
                                                    <RadioGroup
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                        className="flex flex-col space-y-1"
                                                    >
                                                        <FormItem className="flex items-start space-x-3 space-y-0">
                                                            <FormControl>
                                                                <RadioGroupItem value="individual" />
                                                            </FormControl>
                                                            <div className="space-y-1 leading-none">
                                                                <FormLabel className="font-normal cursor-pointer text-slate-600">
                                                                    Indépendant / Freelance
                                                                </FormLabel>
                                                            </div>
                                                        </FormItem>
                                                        <FormItem className="flex items-start space-x-3 space-y-0">
                                                            <FormControl>
                                                                <RadioGroupItem value="agency" />
                                                            </FormControl>
                                                            <div className="space-y-1 leading-none">
                                                                <FormLabel className="font-normal cursor-pointer text-slate-600">
                                                                    Agence / Équipe
                                                                </FormLabel>
                                                            </div>
                                                        </FormItem>
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2 text-sm font-medium text-[#1E1E1E]">
                                                <Phone className="w-4 h-4 text-[#B79A63]" />
                                                Numéro de téléphone <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl><GildedInput {...field} placeholder="Ex: 05 50..." /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="wilaya"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Wilaya <span className="text-red-500">*</span></FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="mt-1 h-12 md:h-14 bg-[#F8F5F0]/30 border-[#D4D2CF] rounded-xl px-4 hover:border-[#B79A63] focus:ring-[#B79A63] focus:border-[#B79A63] transition-all">
                                                        <SelectValue placeholder="Sélectionnez votre wilaya" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {wilayas.map((wilaya) => (
                                                        <SelectItem key={wilaya.id} value={wilaya.id}>
                                                            {wilaya.code} - {wilaya.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="socialLink"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Lien Réseau Social (Instagram/Facebook) <span className="text-red-500">*</span></FormLabel>
                                            <FormControl><GildedInput {...field} placeholder="https://instagram.com/..." /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Professionnel <span className="text-red-500">*</span></FormLabel>
                                    <FormControl><GildedInput {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mot de passe <span className="text-red-500">*</span></FormLabel>
                                    <FormControl><PasswordInput {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {mode === "signup" && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirmer le mot de passe <span className="text-red-500">*</span></FormLabel>
                                            <FormControl><PasswordInput {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="termsAccepted"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border border-[#D4D2CF] p-4 bg-[#F8F5F0]/30 hover:border-[#B79A63] transition-colors">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    className="border-[#B79A63] text-[#B79A63] data-[state=checked]:bg-[#B79A63]"
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="text-sm font-normal text-slate-600">
                                                    J'accepte les{" "}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setShowCGU(true);
                                                        }}
                                                        className="text-[#B79A63] font-medium hover:underline hover:text-[#9A8152] transition-colors"
                                                    >
                                                        conditions générales d'utilisation
                                                    </button>
                                                </FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        <GildedButton
                            className="w-full py-6 mt-6 text-base"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {mode === "login" ? "Se connecter" : "Créer mon espace"}
                        </GildedButton>
                    </form>
                </Form>

                <div className="text-center text-sm pt-4">
                    {mode === "login" ? (
                        <p>
                            Pas encore de compte ?{" "}
                            <button type="button" onClick={() => setMode("signup")} className="font-semibold text-[#1E1E1E] hover:text-[#B79A63] transition-colors">
                                Devenir Partenaire
                            </button>
                        </p>
                    ) : (
                        <p>
                            Déjà un compte ?{" "}
                            <button type="button" onClick={() => setMode("login")} className="font-semibold text-[#1E1E1E] hover:text-[#B79A63] transition-colors">
                                Se connecter
                            </button>
                        </p>
                    )}
                </div>
            </div>

            {/* Success Modal */}
            <Dialog open={showSuccessModal} onOpenChange={(open) => {
                setShowSuccessModal(open);
                if (!open) setMode("login");
            }}>
                <DialogContent className="sm:max-w-xl p-8">
                    <DialogHeader className="flex flex-col items-center">
                        <div className="mx-auto w-20 h-20 bg-emerald-100/50 rounded-full flex items-center justify-center mb-6">
                            <Check className="w-10 h-10 text-emerald-600" />
                        </div>
                        <DialogTitle className="text-center text-3xl font-serif text-[#1E1E1E]">Inscription réussie !</DialogTitle>
                        <DialogDescription className="text-center text-lg text-slate-600 pt-4 leading-relaxed">
                            Votre demande de création de compte a été prise en compte avec succès.
                            <br /><br />
                            <strong>Veuillez consulter votre boîte mail</strong> et cliquer sur le lien de confirmation pour activer votre espace partenaire.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <GildedButton
                            onClick={() => {
                                setShowSuccessModal(false);
                                setMode("login");
                                navigate('/');
                            }}
                            className="w-full sm:w-auto"
                        >
                            <Check className="w-5 h-5 mr-2" />
                            Compris, je vais vérifier mes emails
                        </GildedButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showCGU} onOpenChange={setShowCGU}>
                <DialogContent className="sm:max-w-2xl bg-[#FCFAF8] max-h-[80vh] overflow-y-auto w-11/12 mx-auto sm:w-full rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-serif text-[#1E1E1E]">Conditions Générales d'Utilisation (CGU)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 text-sm text-slate-600 font-sans p-2">
                        <section className="space-y-2">
                            <h3 className="font-semibold text-[#1E1E1E] text-base">1. Acceptation des conditions</h3>
                            <p>En vous inscrivant sur la plateforme Far7i en tant que partenaire professionnel (ci-après "le Prestataire"), vous reconnaissez avoir lu, compris et accepté sans réserve les présentes Conditions Générales d'Utilisation. Ces conditions peuvent être modifiées à tout moment par Far7i, et il est de votre responsabilité de vous tenir informé des éventuelles mises à jour.</p>
                        </section>

                        <section className="space-y-2">
                            <h3 className="font-semibold text-[#1E1E1E] text-base">2. Objet du service</h3>
                            <p>Far7i est une plateforme de mise en relation entre des particuliers organisant des événements (mariages, fêtes, etc.) et des professionnels du secteur événementiel en Algérie. Le service permet aux Prestataires de créer une vitrine (le Profil Partenaire), d'afficher leurs prestations, et de recevoir des demandes de devis de la part des utilisateurs.</p>
                        </section>

                        <section className="space-y-2">
                            <h3 className="font-semibold text-[#1E1E1E] text-base">3. Obligations du Prestataire</h3>
                            <p>Le Prestataire s'engage à :</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Fournir des informations exactes, complètes et à jour lors de l'inscription et sur son profil.</li>
                                <li>Exercer son activité de manière légale et conforme à la législation algérienne en vigueur.</li>
                                <li>Ne proposer que des services dont il maîtrise l'exécution et pour lesquels il dispose des ressources nécessaires.</li>
                                <li>Maintenir un comportement professionnel et respectueux envers les utilisateurs de la plateforme et l'équipe Far7i.</li>
                                <li>Répondre aux demandes de devis dans des délais raisonnables.</li>
                            </ul>
                        </section>

                        <section className="space-y-2">
                            <h3 className="font-semibold text-[#1E1E1E] text-base">4. Modération et suspension de compte</h3>
                            <p>L'équipe Far7i se réserve le droit de modérer les profils avant leur publication publique. Far7i peut, à son entière discrétion, suspendre ou supprimer le compte d'un Prestataire en cas de non-respect de ces CGU, de plaintes répétées d'utilisateurs fraudes ou d'informations mensongères. L'état du profil (en attente, validé, suspendu) est géré par les administrateurs de la plateforme.</p>
                        </section>

                        <section className="space-y-2">
                            <h3 className="font-semibold text-[#1E1E1E] text-base">5. Propriété intellectuelle</h3>
                            <p>Le Prestataire garantit détenir les droits de propriété intellectuelle sur l'ensemble des contenus (textes, photos, vidéos) qu'il publie sur son profil, ou d'avoir obtenu les autorisations nécessaires pour leur utilisation. En publiant ces contenus, le Prestataire accorde à Far7i une licence non exclusive, gratuite et mondiale pour les utiliser, les reproduire et les afficher afin de promouvoir la plateforme.</p>
                        </section>

                        <section className="space-y-2">
                            <h3 className="font-semibold text-[#1E1E1E] text-base">6. Tarification et paiements</h3>
                            <p>Far7i se réserve le droit d'introduire des fonctionnalités payantes (abonnements premium, mise en avant, etc.) ou de modifier sa structure tarifaire à l'avenir. Les Prestataires seront informés de toute modification tarifaire avec un préavis raisonnable. Les transactions financières entre le Prestataire et ses clients s'effectuent en dehors de la plateforme Far7i, qui n'intervient pas dans ces paiements et ne saurait être tenue responsable des litiges financiers.</p>
                        </section>

                        <section className="space-y-2">
                            <h3 className="font-semibold text-[#1E1E1E] text-base">7. Limitation de responsabilité</h3>
                            <p>Far7i agit uniquement en tant qu'intermédiaire technique. La responsabilité de Far7i ne peut être engagée quant à la qualité, la sécurité ou la légalité des prestations fournies par le Prestataire, ni quant à la capacité des utilisateurs à payer les services. Far7i ne garantit pas de volume d'affaires ou de rentabilité pour le Prestataire.</p>
                        </section>

                        <section className="space-y-2">
                            <h3 className="font-semibold text-[#1E1E1E] text-base">8. Données personnelles</h3>
                            <p>La collecte et le traitement des données personnelles du Prestataire sont régis par notre Politique de Confidentialité. En s'inscrivant, le Prestataire consent à l'utilisation de ses données dans le cadre du fonctionnement de la plateforme.</p>
                        </section>
                    </div>
                </DialogContent>
            </Dialog>
        </SplitScreenLayout>
    );
}

function LabelWithIcon({ icon: Icon, label }: { icon: any, label: string }) {
    return (
        <div className="flex items-center gap-2 mb-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            <Icon className="w-4 h-4 text-[#B79A63]" />
            {label}
        </div>
    );
}
