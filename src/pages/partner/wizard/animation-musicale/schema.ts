import * as z from "zod";

export const animationMusicaleSchema = z.object({
    // Step 1: Identité
    nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    category_slug: z.string().default("dj_orchestre"),
    wilaya_id: z.string().min(1, "Veuillez sélectionner une wilaya"),
    adresse: z.string().optional(),
    evenementsAccepte: z.array(z.string()).min(1, "Sélectionnez au moins un type d'événement"),
    description: z.string().optional(),

    // Step 2: Spécialités
    isDJ: z.boolean().default(false),
    isOrchestra: z.boolean().default(false),
    stylesMusicaux: z.array(z.string()).default([]),

    // Step 3: Matériel & Options
    equipements: z.array(z.string()).default([]),
    optionsAnimation: z.array(z.string()).default([]),

    // Step 4: Tarification & Logistique
    prixAPartirDeDA: z.number().min(0, "Le prix ne peut être négatif"),
    deplacementPossible: z.boolean().default(false),
    wilayasDeplacement: z.array(z.string()).default([]),
    acompteDemande: z.boolean().default(false),
    cautionDemande: z.boolean().default(false),
    politiqueAnnulation: z.string().optional(),

    // Step 5: Médias & Contact
    galeriePhotos: z.array(z.string()).min(1, "Au moins une photo est requise").max(5, "Maximum 5 photos autorisées"),
    utiliserFormulaireFar7i: z.boolean().default(true),
    telephone: z.string().optional(),
}).superRefine((data, ctx) => {
    // 1. DJ OR Orchestra must be checked
    if (!data.isDJ && !data.isOrchestra) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Sélectionnez au moins un type de prestation (DJ et/ou Orchestre)",
            path: ["isDJ"]
        });
    }

    // 2. Deployment possible requires at least one wilaya
    if (data.deplacementPossible && data.wilayasDeplacement.length === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Veuillez sélectionner au moins une wilaya de déplacement",
            path: ["wilayasDeplacement"]
        });
    }
});

export type AnimationMusicaleFormValues = z.infer<typeof animationMusicaleSchema>;
